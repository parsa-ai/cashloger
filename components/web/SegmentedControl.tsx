"use client"

import { useRef, useState } from "react"
import { cn, haptic } from "@/lib/utils"

interface Option<T extends string> {
    value: T
    label: React.ReactNode
}

// سگمنت کنترل شیشه‌ای هم‌شکل نوار تب پایین: لمس یا کشیدن انگشت روی گزینه‌ها (برای چیدمان راست‌به‌چپ)
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    size = "default",
    className,
}: {
    options: Option<T>[]
    value: T
    onChange: (value: T) => void
    // lg: بلندتر، برای شیت‌ها و جاهایی که کنترل اصلی صفحه است
    size?: "default" | "lg"
    className?: string
}) {
    const ref = useRef<HTMLDivElement>(null)
    const drag = useRef<{ x: number; dragging: boolean } | null>(null)
    const [dragging, setDragging] = useState(false)
    const index = Math.max(0, options.findIndex((o) => o.value === value))

    const select = (i: number) => {
        const option = options[i]
        if (!option || option.value === value) return
        haptic()
        onChange(option.value)
    }

    const indexAt = (clientX: number) => {
        const rect = ref.current!.getBoundingClientRect()
        const i = Math.floor(((rect.right - clientX) / rect.width) * options.length)
        return Math.min(options.length - 1, Math.max(0, i))
    }

    return (
        <div
            ref={ref}
            role="tablist"
            data-no-swipe
            onPointerDown={(e) => {
                drag.current = { x: e.clientX, dragging: false }
            }}
            onPointerMove={(e) => {
                const d = drag.current
                if (!d) return
                if (!d.dragging && Math.abs(e.clientX - d.x) > 6) {
                    d.dragging = true
                    setDragging(true)
                    ref.current?.setPointerCapture(e.pointerId)
                }
                if (d.dragging) select(indexAt(e.clientX))
            }}
            onPointerUp={() => {
                drag.current = null
                setDragging(false)
            }}
            onPointerCancel={() => {
                drag.current = null
                setDragging(false)
            }}
            className={cn(
                "glass relative grid touch-pan-y rounded-full p-1",
                size === "lg" ? "h-12 text-[15px]" : "h-11 text-[14px]",
                className
            )}
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
            <span
                aria-hidden
                className={cn(
                    "absolute inset-y-1 right-1 rounded-full bg-fill-strong transition-transform ease-ios",
                    dragging ? "duration-200" : "duration-[400ms]"
                )}
                style={{
                    width: `calc((100% - 8px) / ${options.length})`,
                    transform: `translateX(${-index * 100}%) scale(${dragging ? 1.06 : 1})`,
                }}
            />
            {options.map((option, i) => {
                const selected = option.value === value
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => select(i)}
                        className={cn(
                            "relative truncate rounded-full px-2 transition-colors duration-200",
                            selected ? "font-semibold text-primary" : "font-medium text-foreground/70"
                        )}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
