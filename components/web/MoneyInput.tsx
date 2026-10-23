"use client"

import { cn, formatMoney } from "@/lib/utils"

// ارقام فارسی/عربی را هم می‌پذیرد و فقط عدد نگه می‌دارد
function parseAmount(value: string) {
    const digits = value
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/\D/g, "")
        .replace(/^0+/, "")
        .slice(0, 15)
    return digits ? Number(digits) : null
}

// ردیف ورود مبلغ داخل Group: عدد با جداکنندهٔ هزارگان و «تومان» در انتها
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
    return (
        <div className={cn("flex items-center gap-3 px-4", className)}>
            <input
                value={value ? formatMoney(value) : ""}
                onChange={(e) => onChange(parseAmount(e.target.value))}
                placeholder={placeholder}
                inputMode="numeric"
                enterKeyHint="done"
                aria-label={label}
                autoFocus={autoFocus}
                className="num h-[52px] min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/70"
            />
            <span className="text-[15px] text-muted-foreground">تومان</span>
        </div>
    )
}
