"use client"

import { useMemo, useState } from "react"
import { sad } from "blobatar/expression"

import { ExportButton } from "@/components/web/ExportSheet"
import { EmptyState } from "@/components/web/EmptyState"
import { Group } from "@/components/web/Group"
import { MonthBar } from "@/components/web/MonthBar"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { TransactionRow } from "@/components/web/TransactionRow"
import { LogEntry } from "@/lib/types"
import { formatDayTitle, formatMoney } from "@/lib/utils"
import { useMonthEntries } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import { useUiStore } from "@/store/useUiStore"
import useDateStore from "@/store/useYearStore"

type Filter = "all" | "cost" | "income"

export function TransactionList() {
    const [filter, setFilter] = useState<Filter>("all")
    const setAddKind = useUiStore((s) => s.setAddKind)

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

    return (
        <div className="space-y-4">
            <MonthBar trailing={<ExportButton />} />
            <div>
                <SegmentedControl
                    value={filter}
                    onChange={(value) => {
                        setFilter(value)
                        if (value !== "all") setAddKind(value)
                    }}
                    options={[
                        { value: "all", label: "همه" },
                        { value: "cost", label: "هزینه" },
                        { value: "income", label: "درآمد" },
                    ]}
                />
            </div>

            {isLoading && <div className="h-64 animate-pulse rounded-xl bg-card" />}

            {!isLoading && days.length === 0 && (
                <EmptyState expression={sad} title="تراکنشی برای این ماه نیست" description="با دکمهٔ + یکی ثبت کن." />
            )}

            <div className="space-y-6 pt-2">
                {days.map((dayEntries) => {
                    const dayTotal = dayEntries.reduce(
                        (sum, e) => sum + (e.mode === "increase" ? e.visitors : -e.visitors),
                        0
                    )
                    return (
                        <Group
                            key={dayEntries[0].date.toDateString()}
                            title={formatDayTitle(dayEntries[0].date)}
                            action={
                                <span className="num text-[13px] text-muted-foreground">
                                    {dayTotal > 0 ? "+" : dayTotal < 0 ? "−" : ""}
                                    {formatMoney(Math.abs(dayTotal))}
                                </span>
                            }
                        >
                            {dayEntries.map((entry) => (
                                <TransactionRow key={entry.id} entry={entry} category={categories.find((c) => c.id === entry.key)} />
                            ))}
                        </Group>
                    )
                })}
            </div>
        </div>
    )
}
