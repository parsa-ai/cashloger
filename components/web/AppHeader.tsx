"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { UserBlob } from "@/components/web/Avatars"
import { cn, formatMonthTitle, haptic, isSamePersianMonth, shiftPersianMonth } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import useDateStore from "@/store/useYearStore"

const TITLES: Record<string, string> = {
    "/user": "تنظیمات",
    "/categories": "دسته‌بندی‌ها",
}

// وضعیت همگام‌سازی مثل تلگرام زیر عنوان؛ «در حال ارسال» فقط اگر بیش از یک لحظه طول بکشد
function useSyncStatus() {
    const isOnline = useLogStore((s) => s.isOnline)
    const pending = useLogStore((s) => s.queue.length)
    const [slow, setSlow] = useState(false)

    useEffect(() => {
        if (pending === 0) {
            const reset = setTimeout(() => setSlow(false), 0)
            return () => clearTimeout(reset)
        }
        const timer = setTimeout(() => setSlow(true), 1500)
        return () => clearTimeout(timer)
    }, [pending])

    if (!isOnline) return pending > 0 ? `آفلاین · ${pending.toLocaleString("fa-IR")} تغییر در صف` : "در انتظار شبکه…"
    if (pending > 0 && slow) return "در حال ارسال…"
    return null
}

function MonthSwitcher() {
    const date = useDateStore((s) => s.date) || new Date()
    const setDate = useDateStore((s) => s.setDate)
    const isCurrent = isSamePersianMonth(date, new Date())

    const go = (months: number) => {
        haptic()
        setDate(shiftPersianMonth(date, months))
    }

    return (
        <div className="flex items-center gap-1">
            <button type="button" onClick={() => go(-1)} aria-label="ماه قبل" className="press grid size-8 place-items-center text-primary">
                <ChevronRight className="size-5" />
            </button>
            <span key={date.toDateString()} className="min-w-24 animate-fade-in text-center text-[17px] font-semibold">
                {formatMonthTitle(date)}
            </span>
            <button
                type="button"
                onClick={() => go(1)}
                disabled={isCurrent}
                aria-label="ماه بعد"
                className="press grid size-8 place-items-center text-primary transition-opacity disabled:opacity-25"
            >
                <ChevronLeft className="size-5" />
            </button>
        </div>
    )
}

export function AppHeader({ userName }: { userName: string }) {
    const pathname = usePathname()
    const status = useSyncStatus()
    const [scrolled, setScrolled] = useState(false)

    const date = useDateStore((s) => s.date) || new Date()
    const setDate = useDateStore((s) => s.setDate)
    const showMonth = pathname === "/" || pathname === "/logs"
    const isCurrentMonth = isSamePersianMonth(date, new Date())

    // خط زیر هدر فقط وقتی محتوا زیرش اسکرول شده، مثل iOS
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    return (
        <header
            className={cn(
                "safe-top sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl backdrop-saturate-150 transition-colors duration-200",
                scrolled ? "border-separator" : "border-transparent"
            )}
        >
            <div className="mx-auto grid h-12 max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
                <div className="justify-self-start">
                    {pathname === "/categories" ? (
                        <Link href="/user" className="press flex items-center text-[15px] text-primary">
                            <ChevronRight className="size-6 -ms-1.5" />
                            تنظیمات
                        </Link>
                    ) : (
                        <Link href="/user" aria-label="تنظیمات" className="press block">
                            <UserBlob name={userName} size={32} />
                        </Link>
                    )}
                </div>

                <div className="flex flex-col items-center leading-tight">
                    {showMonth ? (
                        <MonthSwitcher />
                    ) : (
                        <h1 key={pathname} className="animate-fade-in text-[17px] font-semibold">
                            {TITLES[pathname] ?? "کش لاگر"}
                        </h1>
                    )}
                    {status && <p className="animate-fade-in text-[11px] text-muted-foreground">{status}</p>}
                </div>

                <div className="justify-self-end">
                    {showMonth && (
                        <button
                            type="button"
                            onClick={() => {
                                haptic()
                                setDate(new Date())
                            }}
                            className={cn(
                                "press text-[15px] text-primary transition-opacity duration-200",
                                isCurrentMonth && "pointer-events-none opacity-0"
                            )}
                            tabIndex={isCurrentMonth ? -1 : 0}
                        >
                            امروز
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}
