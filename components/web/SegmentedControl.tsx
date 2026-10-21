"use client"

import { cn, haptic } from "@/lib/utils"

interface Option<T extends string> {
    value: T
    label: React.ReactNode
}

// سگمنت کنترل به سبک iOS با نشانگر لغزان (برای چیدمان راست‌به‌چپ)
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
    const index = Math.max(0, options.findIndex((o) => o.value === value))

    return (
        <div
            role="tablist"
            className={cn("relative grid h-9 rounded-lg bg-fill p-0.5 text-[13px]", className)}
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
            <span
                aria-hidden
                className="absolute inset-y-0.5 right-0.5 rounded-[8px] bg-card shadow-[0_1px_3px_oklch(0_0_0/0.12)] transition-transform duration-300 ease-ios dark:bg-fill-strong dark:shadow-none"
                style={{
                    width: `calc((100% - 4px) / ${options.length})`,
                    transform: `translateX(${-index * 100}%)`,
                }}
            />
            {options.map((option) => {
                const selected = option.value === value
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => {
                            if (selected) return
                            haptic()
                            onChange(option.value)
                        }}
                        className={cn(
                            "relative truncate px-2 transition-[color,font-weight] duration-200",
                            selected ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                        )}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
