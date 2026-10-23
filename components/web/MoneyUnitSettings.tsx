"use client"

import { Check } from "lucide-react"

import { Group, Row } from "@/components/web/Group"
import { formatMoney, MONEY_UNITS } from "@/lib/money"
import { cn, haptic } from "@/lib/utils"
import { useMoneyUnitStore } from "@/store/useMoneyUnitStore"

const SAMPLE = 1_250_000

// انتخاب واحد پول برای نمایش و ورود مبالغ (مبالغ همیشه به تومان ذخیره می‌شوند)
export function MoneyUnitSettings() {
    const unit = useMoneyUnitStore((s) => s.unit)
    const setUnit = useMoneyUnitStore((s) => s.setUnit)

    return (
        <Group title="واحد پول" footer="فقط نحوهٔ نمایش و ورود مبلغ عوض می‌شود؛ مبالغ ثبت‌شده تغییری نمی‌کنند.">
            {MONEY_UNITS.map((u) => {
                const selected = u.id === unit
                return (
                    <Row
                        key={u.id}
                        onClick={() => {
                            if (selected) return
                            haptic()
                            setUnit(u.id)
                        }}
                        title={u.label}
                        subtitle={<span className="num">{`${formatMoney(SAMPLE, u)} ${u.label}`}</span>}
                        trailing={
                            <Check
                                aria-hidden
                                className={cn("size-5 text-primary transition-opacity duration-150", selected ? "opacity-100" : "opacity-0")}
                                strokeWidth={2.4}
                            />
                        }
                    />
                )
            })}
        </Group>
    )
}
