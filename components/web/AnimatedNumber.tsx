"use client"

import { useEffect, useRef, useState } from "react"
import { formatMoney } from "@/lib/utils"

// عدد با انیمیشن شمارش نرم بین مقدار قبلی و جدید
export function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
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
            const eased = 1 - Math.pow(1 - t, 4)
            const current = from + (value - from) * eased
            fromRef.current = current
            setDisplay(current)
            if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [value, duration])

    return <span className="tabular-nums">{formatMoney(display)}</span>
}
