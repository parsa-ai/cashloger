"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Coins } from "lucide-react"
import { Popover } from "radix-ui"

import { Group, IconTile, Row } from "@/components/web/Group"
import { formatMoney, getMoneyUnit, MONEY_UNITS } from "@/lib/money"
import { cn, haptic } from "@/lib/utils"
import { useMoneyUnitStore } from "@/store/useMoneyUnitStore"

const SAMPLE = 125_000

export function MoneyUnitSettings() {
    const unit = useMoneyUnitStore((s) => s.unit)
    const setUnit = useMoneyUnitStore((s) => s.setUnit)
    const [open, setOpen] = useState(false)

    return (
        <Group>
            <Popover.Root open={open} onOpenChange={setOpen} >
                <Row
                    onClick={() => {
                        haptic()
                        setOpen(true)
                    }}
                    leading={<IconTile color="oklch(0.7 0.16 75)"><Coins /></IconTile>}
                    title="واحد پول"
                    trailing={
                        <Popover.Anchor asChild>
                            <span
                                className={cn(
                                    "flex items-center gap-1 text-[15px] transition-colors duration-200",
                                    open ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {getMoneyUnit(unit).label}
                                <ChevronsUpDown className="size-4 opacity-60" />
                            </span>
                        </Popover.Anchor>
                    }
                />
                <Popover.Portal>
                    <Popover.Content
                        side="bottom"
                        align="end"
                        sideOffset={10}
                        collisionPadding={16}
                        dir="rtl"
                        role="menu"
                        aria-label="واحد پول"
                        className="z-[60] w-60 origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-2xl bg-card shadow-float outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                    >
                        {MONEY_UNITS.map((u) => {
                            const selected = u.id === unit
                            return (
                                <button
                                    key={u.id}
                                    type="button"
                                    role="menuitemradio"
                                    aria-checked={selected}
                                    onClick={() => {
                                        if (!selected) {
                                            haptic()
                                            setUnit(u.id)
                                        }
                                        setOpen(false)
                                    }}
                                    className="press-row flex w-full items-center gap-3 border-b border-separator px-4 py-2.5 text-right last:border-b-0"
                                >
                                    <Check
                                        aria-hidden
                                        strokeWidth={2.6}
                                        className={cn("size-4 shrink-0 text-primary", !selected && "invisible")}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className={cn("block text-[15px]", selected && "font-semibold")}>{u.label}</span>
                                        <span className="num block truncate text-[12px] text-muted-foreground">
                                            {formatMoney(SAMPLE, u)} {u.label}
                                        </span>
                                    </span>
                                </button>
                            )
                        })}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </Group>
    )
}
