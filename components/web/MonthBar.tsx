"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn, formatMonthTitle, haptic, isSamePersianMonth, shiftPersianMonth } from "@/lib/utils"
import useDateStore from "@/store/useYearStore"

// انتخاب ماه شمسی: ‹ مهر ۱۴۰۵ › و دکمهٔ برگشت به ماه جاری
export function MonthBar({ trailing }: { trailing?: React.ReactNode }) {
    const date = useDateStore((s) => s.date) || new Date()
    const setDate = useDateStore((s) => s.setDate)
    const isCurrent = isSamePersianMonth(date, new Date())

    const go = (months: number) => {
        haptic()
        setDate(shiftPersianMonth(date, months))
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex h-10 items-center rounded-full bg-card px-1">
                <button type="button" onClick={() => go(-1)} aria-label="ماه قبل" className="press grid size-8 place-items-center text-primary">
                    <ChevronRight className="size-5" />
                </button>
                <span key={date.toDateString()} className="min-w-24 animate-fade-in text-center text-[15px] font-semibold">
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
            <button
                type="button"
                onClick={() => {
                    haptic()
                    setDate(new Date())
                }}
                tabIndex={isCurrent ? -1 : 0}
                className={cn(
                    "press h-8 rounded-full bg-tint px-3 text-[13px] font-semibold text-primary transition-opacity duration-200",
                    isCurrent && "pointer-events-none opacity-0"
                )}
            >
                این ماه
            </button>
            {trailing && <div className="ms-auto">{trailing}</div>}
        </div>
    )
}
