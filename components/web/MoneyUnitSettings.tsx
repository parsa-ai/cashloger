"use client"

import { ChevronsUpDown, Coins } from "lucide-react"

import { Group, IconTile, Row } from "@/components/web/Group"
import { getMoneyUnit, MONEY_UNITS, MoneyUnitId } from "@/lib/money"
import { haptic } from "@/lib/utils"
import { useMoneyUnitStore } from "@/store/useMoneyUnitStore"

// انتخاب واحد پول برای نمایش و ورود مبالغ (مبالغ همیشه به تومان ذخیره می‌شوند).
// یک select بومی و نامرئی روی ردیف است تا روی گوشی انتخابگر خود سیستم باز شود
export function MoneyUnitSettings() {
    const unit = useMoneyUnitStore((s) => s.unit)
    const setUnit = useMoneyUnitStore((s) => s.setUnit)

    return (
        <Group footer="فقط نحوهٔ نمایش و ورود مبلغ عوض می‌شود؛ مبالغ ثبت‌شده تغییری نمی‌کنند.">
            <Row
                className="press-row relative"
                leading={<IconTile color="oklch(0.7 0.16 75)"><Coins /></IconTile>}
                title="واحد پول"
                trailing={
                    <>
                        <span className="flex items-center gap-1 text-[15px] text-muted-foreground">
                            {getMoneyUnit(unit).label}
                            <ChevronsUpDown className="size-4 text-muted-foreground/60" />
                        </span>
                        <select
                            value={unit}
                            onChange={(e) => {
                                haptic()
                                setUnit(e.target.value as MoneyUnitId)
                            }}
                            aria-label="واحد پول"
                            className="absolute inset-0 cursor-pointer opacity-0"
                        >
                            {MONEY_UNITS.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.label}
                                </option>
                            ))}
                        </select>
                    </>
                }
            />
        </Group>
    )
}
