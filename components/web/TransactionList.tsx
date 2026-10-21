"use client"

import { useMemo, useState } from "react"
import { ReceiptText } from "lucide-react"

import { ExportButton } from "@/components/web/ExportSheet"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { TransactionSheet } from "@/components/web/TransactionSheet"
import { UNCATEGORIZED_COLOR } from "@/lib/palette"
import { LogEntry } from "@/lib/types"
import { cn, formatDayTitle, formatMoney, haptic, UNCATEGORIZED_LABEL } from "@/lib/utils"
import { useMonthEntries } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import useDateStore from "@/store/useYearStore"

type Filter = "all" | "cost" | "income"

export function TransactionList() {
    const [filter, setFilter] = useState<Filter>("all")
    const [editing, setEditing] = useState<LogEntry | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    const isLoading = useLogStore((s) => s.isLoading)
    const categories = useLogStore((s) => s.categories)
    const date = useDateStore((s) => s.date) || new Date()
    const entries = useMonthEntries(date)

    // گروه‌بندی بر اساس روز، جدیدترین اول
    const days = useMemo(() => {
        const filtered = entries.filter(
            (e) => filter === "all" || (filter === "cost" ? e.mode === "decrease" : e.mode === "increase")
        )
        const groups = new Map<string, LogEntry[]>()
        for (const entry of [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime())) {
            const key = entry.date.toDateString()
            groups.set(key, [...(groups.get(key) ?? []), entry])
        }
        return [...groups.values()]
    }, [entries, filter])

    let index = 0

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <SegmentedControl
                    className="flex-1"
                    value={filter}
                    onChange={setFilter}
                    options={[
                        { value: "all", label: "همه" },
                        { value: "cost", label: "هزینه" },
                        { value: "income", label: "درآمد" },
                    ]}
                />
                <ExportButton />
            </div>

            {isLoading && <div className="h-64 animate-pulse rounded-3xl bg-muted" />}

            {!isLoading && days.length === 0 && (
                <div className="flex animate-item-in flex-col items-center gap-3 py-20 text-center text-muted-foreground">
                    <span className="grid size-14 place-items-center rounded-full bg-muted">
                        <ReceiptText className="size-6" />
                    </span>
                    <p className="text-sm">تراکنشی برای این ماه نیست.</p>
                </div>
            )}

            {days.map((dayEntries) => {
                const dayTotal = dayEntries.reduce(
                    (sum, e) => sum + (e.mode === "increase" ? e.visitors : -e.visitors),
                    0
                )
                return (
                    <section key={dayEntries[0].date.toDateString()} className="space-y-1.5">
                        <div className="flex items-center justify-between px-4 text-[13px] text-muted-foreground">
                            <h2 className="font-medium">{formatDayTitle(dayEntries[0].date)}</h2>
                            <span className="tabular-nums">{formatMoney(dayTotal)}</span>
                        </div>
                        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card">
                            {dayEntries.map((entry) => {
                                const category = categories.find((c) => c.id === entry.key)
                                const color = category?.color ?? UNCATEGORIZED_COLOR
                                const label = category?.label ?? UNCATEGORIZED_LABEL
                                const isIncome = entry.mode === "increase"
                                return (
                                    <li
                                        key={entry.id}
                                        className="stagger animate-item-in"
                                        style={{ "--i": index++ } as React.CSSProperties}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                haptic()
                                                setEditing(entry)
                                                setSheetOpen(true)
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-right transition-colors active:bg-muted"
                                        >
                                            <span
                                                className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
                                                style={{ backgroundColor: color }}
                                            >
                                                {label.charAt(0)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-medium">{label}</span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {entry.description || (isIncome ? "واریز" : "برداشت")}
                                                </span>
                                            </span>
                                            <span
                                                className={cn(
                                                    "font-bold tabular-nums",
                                                    isIncome ? "text-success" : "text-foreground"
                                                )}
                                            >
                                                {isIncome ? "+" : "−"}
                                                {formatMoney(entry.visitors)}
                                            </span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                )
            })}

            <TransactionSheet
                open={sheetOpen && !!editing}
                onOpenChange={setSheetOpen}
                kind={editing?.mode === "increase" ? "income" : "cost"}
                date={editing?.date ?? date}
                entry={editing ?? undefined}
            />
        </div>
    )
}
