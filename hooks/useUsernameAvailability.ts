"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export type Availability = "idle" | "checking" | "free" | "taken" | "invalid"

// فقط حروف مجاز نام کاربری، با حروف کوچک
export function cleanUsername(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20)
}

// نام کاربری آزاد است؟ (با کمی تأخیر بعد از تایپ). current = نام فعلی خود کاربر
export function useUsernameAvailability(username: string, enabled = true, current?: string | null): Availability {
    const [result, setResult] = useState<{ name: string; status: Availability } | null>(null)
    const check = enabled && USERNAME_RE.test(username) && username !== current

    useEffect(() => {
        if (!check) return
        let cancelled = false
        const timer = setTimeout(async () => {
            const { data, error } = await createClient().rpc("username_available", { candidate: username })
            if (cancelled) return
            // اگر تابع هنوز روی سرور نیست، سرور موقع ذخیره خودش جلوی تکراری را می‌گیرد
            setResult({ name: username, status: error || data ? "free" : "taken" })
        }, 400)
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [username, check])

    if (!enabled || !username || username === current) return "idle"
    if (!USERNAME_RE.test(username)) return "invalid"
    return result?.name === username ? result.status : "checking"
}
