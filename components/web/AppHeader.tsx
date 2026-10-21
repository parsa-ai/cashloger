"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, CloudCheck, CloudOff, Loader2 } from "lucide-react"
import { sleepy } from "blobatar/expression"

import { UserBlob } from "@/components/web/Avatars"
import { useBlobName } from "@/components/web/ProfileProvider"
import { cn, haptic } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"

const TITLES: Record<string, string> = {
    "/": "کش لاگر",
    "/logs": "تراکنش‌ها",
    "/user": "تنظیمات",
    "/categories": "دسته‌بندی‌ها",
}

// «در حال ارسال» فقط اگر بیش از یک لحظه طول بکشد، تا با هر ثبت چشمک نزند
function useSending() {
    const isOnline = useLogStore((s) => s.isOnline)
    const pending = useLogStore((s) => s.queue.length)
    const [slow, setSlow] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setSlow(pending > 0), pending > 0 ? 1500 : 0)
        return () => clearTimeout(timer)
    }, [pending])

    return isOnline && pending > 0 && slow
}

// وضعیت اتصال بالا سمت چپ: آنلاین یک دایره، آفلاین یا در حال ارسال یک کپسول با متن
function SyncPill() {
    const isOnline = useLogStore((s) => s.isOnline)
    const pending = useLogStore((s) => s.queue.length)
    const sync = useLogStore((s) => s.sync)
    const sending = useSending()

    const label = !isOnline
        ? pending > 0
            ? `آفلاین · ${pending.toLocaleString("fa-IR")}`
            : "آفلاین"
        : sending
          ? "ارسال…"
          : null

    return (
        <button
            type="button"
            onClick={() => {
                haptic()
                sync()
            }}
            aria-label={label ?? "همگام است"}
            className={cn(
                "glass press pointer-events-auto flex h-11 min-w-11 items-center justify-center gap-1.5 justify-self-end rounded-full",
                label ? "px-3.5" : "px-0",
                isOnline ? "text-primary" : "text-amber-600 dark:text-amber-400"
            )}
        >
            {sending ? (
                <Loader2 className="size-[18px] animate-spin" />
            ) : isOnline ? (
                <CloudCheck className="size-5" />
            ) : (
                <CloudOff className="size-[18px]" />
            )}
            {label && <span className="animate-fade-in text-[13px] font-semibold whitespace-nowrap">{label}</span>}
        </button>
    )
}

// هدر شناور شیشه‌ای: بلاب (یا برگشت)، عنوان کپسولی، وضعیت اتصال
export function AppHeader() {
    const pathname = usePathname()
    const blobName = useBlobName()
    const isOnline = useLogStore((s) => s.isOnline)

    return (
        <>
            {/* محو شدن محتوا زیر نوار وضعیت گوشی */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[calc(env(safe-area-inset-top)+72px)] bg-gradient-to-b from-background via-background/70 to-transparent"
            />
            <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-[calc(env(safe-area-inset-top)+8px)]">
                <div className="mx-auto grid max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
                    {pathname === "/categories" ? (
                        <Link
                            href="/user"
                            aria-label="بازگشت به تنظیمات"
                            className="glass press pointer-events-auto grid size-11 place-items-center justify-self-start rounded-full text-primary"
                        >
                            <ChevronRight className="size-6" />
                        </Link>
                    ) : (
                        <Link
                            href="/user"
                            aria-label="تنظیمات"
                            className="glass press pointer-events-auto grid size-11 place-items-center justify-self-start rounded-full"
                        >
                            {/* آفلاین که باشی بلاب چشم‌هایش را می‌بندد */}
                            <UserBlob name={blobName} size={36} expression={isOnline ? undefined : sleepy} />
                        </Link>
                    )}

                    <div className="glass pointer-events-auto flex h-11 min-w-0 items-center justify-center rounded-full px-5">
                        <h1 key={pathname} className="animate-fade-in truncate text-[16px] font-bold">
                            {TITLES[pathname] ?? "کش لاگر"}
                        </h1>
                    </div>

                    <SyncPill />
                </div>
            </header>
        </>
    )
}
