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
            className={cn("relative grid rounded-xl bg-muted p-1 text-sm", className)}
            style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
            <span
                aria-hidden
                className="absolute inset-y-1 right-1 rounded-[0.6rem] bg-card shadow-sm transition-transform duration-500 ease-ios dark:bg-secondary"
                style={{
                    width: `calc((100% - 0.5rem) / ${options.length})`,
                    transform: `translateX(${-index * 100}%)`,
                }}
            />
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={option.value === value}
                    onClick={() => {
                        if (option.value !== value) haptic()
                        onChange(option.value)
                    }}
                    className={cn(
                        "relative z-10 h-8 rounded-[0.6rem] px-2 font-medium transition-colors duration-300 active:opacity-60",
                        option.value === value ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
