"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, CloudCheck, CloudOff, Loader2 } from "lucide-react"

import { UserBlob } from "@/components/web/Avatars"
import { cn, haptic } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"

const TITLES: Record<string, string> = {
    "/": "کش لاگر",
    "/logs": "تراکنش‌ها",
    "/user": "تنظیمات",
    "/categories": "دسته‌بندی‌ها",
}

// وضعیت همگام‌سازی مثل تلگرام زیر عنوان؛ «در حال ارسال» فقط اگر بیش از یک لحظه طول بکشد
function useSyncStatus() {
    const isOnline = useLogStore((s) => s.isOnline)
    const pending = useLogStore((s) => s.queue.length)
    const [slow, setSlow] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setSlow(pending > 0), pending > 0 ? 1500 : 0)
        return () => clearTimeout(timer)
    }, [pending])

    const sending = isOnline && pending > 0 && slow
    if (!isOnline) {
        return { sending, text: pending > 0 ? `آفلاین · ${pending.toLocaleString("fa-IR")} تغییر در صف` : "در انتظار شبکه…" }
    }
    return { sending, text: sending ? "در حال ارسال…" : null }
}

const circle = "glass pointer-events-auto grid size-11 place-items-center rounded-full press"

// هدر شناور شیشه‌ای: دکمهٔ گرد، عنوان کپسولی، دکمهٔ گرد
export function AppHeader({ userName }: { userName: string }) {
    const pathname = usePathname()
    const { text: status, sending } = useSyncStatus()
    const isOnline = useLogStore((s) => s.isOnline)
    const sync = useLogStore((s) => s.sync)

    return (
        <>
            {/* محو شدن محتوا زیر نوار وضعیت گوشی */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[calc(env(safe-area-inset-top)+72px)] bg-gradient-to-b from-background via-background/70 to-transparent"
            />
            <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-[calc(env(safe-area-inset-top)+8px)]">
                <div className="mx-auto grid max-w-2xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4">
                    {pathname === "/categories" ? (
                        <Link href="/user" aria-label="بازگشت به تنظیمات" className={cn(circle, "text-primary")}>
                            <ChevronRight className="size-6" />
                        </Link>
                    ) : (
                        <Link href="/user" aria-label="تنظیمات" className={cn(circle, "p-1")}>
                            <UserBlob name={userName} size={36} />
                        </Link>
                    )}

                    <div className="glass pointer-events-auto flex h-11 min-w-0 flex-col items-center justify-center justify-self-center rounded-full px-5 leading-tight">
                        <h1 key={pathname} className="animate-fade-in truncate text-[16px] font-bold">
                            {TITLES[pathname] ?? "کش لاگر"}
                        </h1>
                        {status && <p className="animate-fade-in truncate text-[11px] text-muted-foreground">{status}</p>}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            haptic()
                            sync()
                        }}
                        aria-label={isOnline ? "همگام‌سازی" : "آفلاین"}
                        className={cn(circle, isOnline ? "text-primary" : "text-muted-foreground")}
                    >
                        {sending ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : isOnline ? (
                            <CloudCheck className="size-5" />
                        ) : (
                            <CloudOff className="size-5" />
                        )}
                    </button>
                </div>
            </header>
        </>
    )
}
