"use client"

import { CategoryAvatar } from "@/components/web/Avatars"
import { Row } from "@/components/web/Group"
import { Category, LogEntry } from "@/lib/types"
import { cn, formatMoney, haptic, UNCATEGORIZED_LABEL } from "@/lib/utils"
import { useUiStore } from "@/store/useUiStore"

export function TransactionRow({ entry, category, showDate }: { entry: LogEntry; category?: Category; showDate?: boolean }) {
    const openEdit = useUiStore((s) => s.openEdit)
    const isIncome = entry.mode === "increase"
    const label = category?.label ?? UNCATEGORIZED_LABEL
    const when = showDate
        ? entry.date.toLocaleDateString("fa-IR", { day: "numeric", month: "long" })
        : entry.date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })

    return (
        <Row
            onClick={() => {
                haptic()
                openEdit(entry)
            }}
            leading={<CategoryAvatar label={label} color={category?.color} size={40} />}
            title={label}
            subtitle={entry.description ? `${entry.description} · ${when}` : when}
            trailing={
                <span className={cn("num text-[15px] font-semibold", isIncome && "text-success")}>
                    {isIncome ? "+" : "−"}
                    {formatMoney(entry.visitors)}
                </span>
            }
        />
    )
}
