"use client"

import { useState } from "react"

import { cleanInput, formatInput, fromUnit, toUnitInput } from "@/lib/money"
import { cn } from "@/lib/utils"
import { useMoneyUnit } from "@/store/useMoneyUnitStore"

// ردیف ورود مبلغ داخل Group: عدد با جداکنندهٔ هزارگان و واحد پول انتخابی در انتها.
// value و onChange همیشه به تومان‌اند؛ ورودی به واحد انتخابی است
export function MoneyInput({
    value,
    onChange,
    placeholder,
    label,
    autoFocus,
    className,
}: {
    value: number | null
    onChange: (value: number | null) => void
    placeholder?: string
    label: string
    autoFocus?: boolean
    className?: string
}) {
    const unit = useMoneyUnit()
    const [text, setText] = useState(() => (value ? toUnitInput(value, unit) : ""))
    const [synced, setSynced] = useState({ value, unit: unit.id })

    // اگر مقدار از بیرون یا واحد عوض شد، متن را از نو بساز (تایپ خود کاربر مثل «۱۲٫» دست نمی‌خورد)
    if (synced.value !== value || synced.unit !== unit.id) {
        setSynced({ value, unit: unit.id })
        setText(value ? toUnitInput(value, unit) : "")
    }

    return (
        <div className={cn("flex items-center gap-3 px-4", className)}>
            <input
                value={formatInput(text)}
                onChange={(e) => {
                    const next = cleanInput(e.target.value, unit)
                    const amount = next ? fromUnit(Number(next), unit) : 0
                    const nextValue = amount > 0 ? amount : null
                    setText(next)
                    setSynced({ value: nextValue, unit: unit.id })
                    onChange(nextValue)
                }}
                placeholder={placeholder}
                inputMode={unit.factor > 1 ? "decimal" : "numeric"}
                enterKeyHint="done"
                aria-label={label}
                autoFocus={autoFocus}
                className="num h-[52px] min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/70"
            />
            <span className="shrink-0 text-[15px] text-muted-foreground">{unit.label}</span>
        </div>
    )
}
