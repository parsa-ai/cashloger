"use client"

import { useEffect, useRef, useState } from "react"
import { formatMoney, moneyDecimals } from "@/lib/money"
import { useMoneyUnit } from "@/store/useMoneyUnitStore"

// عدد با شمارش نرم از مقدار قبلی به مقدار جدید (در اولین نمایش بدون انیمیشن)
export function AnimatedNumber({ value, duration = 500 }: { value: number; duration?: number }) {
    const unit = useMoneyUnit()
    const [display, setDisplay] = useState(value)
    const fromRef = useRef(value)

    useEffect(() => {
        const from = fromRef.current
        if (from === value) return

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const start = performance.now()
        let frame = 0

        const tick = (now: number) => {
            const t = reduce ? 1 : Math.min(1, (now - start) / duration)
            const eased = 1 - Math.pow(1 - t, 3)
            const current = from + (value - from) * eased
            fromRef.current = t === 1 ? value : current
            setDisplay(t === 1 ? value : current)
            if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [value, duration])

    // اعداد میانی با همان دقت مقدار نهایی نمایش داده می‌شوند؛ وگرنه «۱۲٫۳۴۶» (ممیز) شبیه «۱۲٬۳۴۶» (هزارگان) دیده می‌شود
    return <span className="num">{formatMoney(display, unit, moneyDecimals(value, unit))}</span>
}
