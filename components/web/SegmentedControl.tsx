"use client"

import { useRef, useState } from "react"
import { cn, haptic } from "@/lib/utils"

interface Option<T extends string> {
    value: T
    label: React.ReactNode
}

// سگمنت کنترل به سبک iOS: لمس یا کشیدن انگشت روی گزینه‌ها (برای چیدمان راست‌به‌چپ)
export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    className,
}: {
    options: Option<T>[]
    value: T
    onChange: (value: T) => void
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
            className={cn("relative grid h-9 touch-pan-y rounded-[10px] bg-segment p-0.5 text-[13px]", className)}
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
            <span
                aria-hidden
                className={cn(
                    "absolute inset-y-0.5 right-0.5 rounded-lg bg-segment-thumb shadow-[0_1px_3px_oklch(0_0_0/0.14),0_0_0_0.5px_oklch(0_0_0/0.04)] transition-transform ease-ios dark:shadow-none",
                    dragging ? "scale-[0.97] duration-200" : "duration-300"
                )}
                style={{
                    width: `calc((100% - 4px) / ${options.length})`,
                    transform: `translateX(${-index * 100}%)`,
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
                            "relative truncate px-2 transition-colors duration-200",
                            selected ? "font-semibold text-foreground" : "font-medium text-foreground/60"
                        )}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
