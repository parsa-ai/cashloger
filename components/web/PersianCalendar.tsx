"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
    addDays,
    cn,
    formatMonthTitle,
    haptic,
    isSameDay,
    isSamePersianMonth,
    shiftPersianMonth,
    startOfPersianMonth,
} from "@/lib/utils"

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

// همان روز با ساعتِ تاریخ قبلی (ترتیب تراکنش‌های یک روز حفظ شود)
function withTime(day: Date, time: Date) {
    const result = new Date(day)
    result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0)
    return result
}

// تقویم ماهانهٔ شمسی؛ هفته از شنبه شروع می‌شود و روزهای آینده غیرفعال‌اند
export function PersianCalendar({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
    const today = new Date()
    const [month, setMonth] = useState(() => startOfPersianMonth(value))
    const isCurrentMonth = isSamePersianMonth(month, today)

    const cells = useMemo(() => {
        const days: Date[] = []
        for (let d = startOfPersianMonth(month); isSamePersianMonth(d, month); d = addDays(d, 1)) days.push(d)
        // getDay: یکشنبه=۰ … شنبه=۶؛ ستون اول شنبه است
        const offset = (days[0].getDay() + 1) % 7
        return [...Array<null>(offset).fill(null), ...days]
    }, [month])

    const go = (months: number) => {
        haptic()
        setMonth((m) => shiftPersianMonth(m, months))
    }

    const pick = (day: Date) => {
        haptic()
        onChange(withTime(day, value))
    }

    const quick = [
        { label: "امروز", date: today },
        { label: "دیروز", date: addDays(today, -1) },
        { label: "پریروز", date: addDays(today, -2) },
    ]

    return (
        <div className="animate-fade-in rounded-xl bg-card p-3">
            <div className="mb-2 flex gap-2">
                {quick.map(({ label, date }) => {
                    const on = isSameDay(date, value)
                    return (
                        <button
                            key={label}
                            type="button"
                            onClick={() => {
                                setMonth(startOfPersianMonth(date))
                                pick(date)
                            }}
                            className={cn(
                                "press h-8 flex-1 rounded-full text-[13px] font-medium transition-colors",
                                on ? "bg-primary text-primary-foreground" : "bg-fill"
                            )}
                        >
                            {label}
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center justify-between">
                <button type="button" onClick={() => go(-1)} aria-label="ماه قبل" className="press grid size-9 place-items-center text-primary">
                    <ChevronRight className="size-5" />
                </button>
                <span key={month.toDateString()} className="animate-fade-in text-[15px] font-semibold">
                    {formatMonthTitle(month)}
                </span>
                <button
                    type="button"
                    onClick={() => go(1)}
                    disabled={isCurrentMonth}
                    aria-label="ماه بعد"
                    className="press grid size-9 place-items-center text-primary transition-opacity disabled:opacity-25"
                >
                    <ChevronLeft className="size-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 text-center">
                {WEEKDAYS.map((d) => (
                    <span key={d} className="py-1 text-[11px] text-muted-foreground">
                        {d}
                    </span>
                ))}
                {cells.map((day, i) => {
                    if (!day) return <span key={`empty-${i}`} />
                    const future = day > today && !isSameDay(day, today)
                    const selected = isSameDay(day, value)
                    const isToday = isSameDay(day, today)
                    return (
                        <button
                            key={day.toDateString()}
                            type="button"
                            disabled={future}
                            onClick={() => pick(day)}
                            className="grid h-9 place-items-center disabled:opacity-25"
                        >
                            <span
                                className={cn(
                                    "num grid size-8 place-items-center rounded-full text-[15px] transition-colors duration-150",
                                    selected
                                        ? "bg-primary font-semibold text-primary-foreground"
                                        : isToday
                                          ? "font-bold text-primary"
                                          : "active:bg-fill-strong"
                                )}
                            >
                                {day.toLocaleDateString("fa-IR", { day: "numeric" })}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
