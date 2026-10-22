"use client"

import { createClient } from "@/lib/supabase/client"
import { deviceTimezone } from "@/lib/reminders"

export type PushStatus = "unsupported" | "needs-install" | "denied" | "default" | "granted"

function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && !!navigator.standalone)
}

export function pushStatus(): PushStatus {
    if (typeof window === "undefined") return "unsupported"
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    // در iOS اعلان فقط برای برنامهٔ نصب‌شده روی صفحهٔ اصلی کار می‌کند
    if (isIos() && !isStandalone()) return "needs-install"
    if (!supported) return "unsupported"
    return Notification.permission
}

function keyBytes(base64: string) {
    const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/")
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

// سرویس‌ورکر در حالت توسعه ثبت نمی‌شود؛ تا ابد منتظرش نمی‌مانیم
async function registration() {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    return Promise.race([navigator.serviceWorker.ready, timeout])
}

async function saveSubscription(subscription: PushSubscription) {
    const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
    })
    if (!res.ok) throw new Error("ثبت دستگاه برای اعلان انجام نشد")
}

// اجازه می‌گیرد و این دستگاه را برای اعلان ثبت می‌کند؛ باید از لمس کاربر صدا زده شود
export async function enablePush(): Promise<PushStatus> {
    const status = pushStatus()
    if (status === "unsupported" || status === "needs-install") return status

    const permission = await Notification.requestPermission()
    if (permission !== "granted") return permission

    const reg = await registration()
    if (!reg) throw new Error("سرویس‌ورکر فعال نیست")
    const subscription =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        }))
    await saveSubscription(subscription)
    return "granted"
}

// اشتراک ممکن است عوض یا منقضی شود؛ با هر بار باز شدن برنامه دوباره به سرور می‌رسانیم
export async function refreshPush() {
    if (pushStatus() !== "granted") return
    const reg = await registration()
    const subscription = await reg?.pushManager.getSubscription()
    if (subscription) await saveSubscription(subscription)
}

// موقع خروج از حساب: این دستگاه دیگر یادآوری کاربر قبلی را نگیرد
export async function disablePush() {
    if (!("serviceWorker" in navigator)) return
    const reg = await navigator.serviceWorker.getRegistration()
    const subscription = await reg?.pushManager.getSubscription()
    if (!subscription) return
    await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => {})
    await subscription.unsubscribe().catch(() => {})
}

export async function loadReminderTimes(): Promise<number[] | null> {
    const { data, error } = await createClient().from("reminder_settings").select("times").maybeSingle()
    if (error) throw error
    return data ? (data.times as number[]) : null
}

export async function saveReminderTimes(userId: string, times: number[]) {
    const { error } = await createClient()
        .from("reminder_settings")
        .upsert(
            { user_id: userId, times: [...times].sort((a, b) => a - b), timezone: deviceTimezone(), updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
        )
    if (error) throw error
}
