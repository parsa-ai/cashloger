"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { sad, surprised } from "blobatar/expression"

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
    const [query, setQuery] = useState("")
    const setAddKind = useUiStore((s) => s.setAddKind)

    const isLoading = useLogStore((s) => s.isLoading)
    const categories = useLogStore((s) => s.categories)
    const date = useDateStore((s) => s.date) || new Date()
    const entries = useMonthEntries(date)

    // گروه‌بندی بر اساس روز، جدیدترین اول
    const days = useMemo(() => {
        // جستجو در اسم دسته، توضیح و مبلغ (ارقام فارسی هم)
        const q = query.trim().replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[,٬]/g, "")
        const labels = new Map(categories.map((c) => [c.id, c.label]))
        const filtered = entries.filter((e) => {
            if (filter !== "all" && (filter === "cost" ? e.mode !== "decrease" : e.mode !== "increase")) return false
            if (!q) return true
            return (
                (e.key ? labels.get(e.key) ?? "" : "").includes(q) ||
                (e.description ?? "").includes(q) ||
                String(e.visitors).includes(q)
            )
        })
        const groups = new Map<string, LogEntry[]>()
        for (const entry of [...filtered].sort((a, b) => b.date.getTime() - a.date.getTime())) {
            const key = entry.date.toDateString()
            groups.set(key, [...(groups.get(key) ?? []), entry])
        }
        return [...groups.values()]
    }, [entries, filter, query, categories])

    return (
        <div className="space-y-4">
            <MonthBar trailing={<ExportButton />} />
            <label className="flex h-10 items-center gap-2 rounded-full bg-card px-3.5">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="جستجو در دسته، توضیح یا مبلغ"
                    enterKeyHint="search"
                    className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:hidden"
                />
                {query && (
                    <button type="button" onClick={() => setQuery("")} aria-label="پاک کردن جستجو" className="press grid size-6 place-items-center rounded-full bg-fill-strong">
                        <X className="size-3.5" />
                    </button>
                )}
            </label>
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
                query.trim() ? (
                    <EmptyState expression={surprised} title="چیزی پیدا نشد" description="یه کلمهٔ دیگه امتحان کن." />
                ) : (
                    <EmptyState expression={sad} title="تراکنشی برای این ماه نیست" description="با دکمهٔ + یکی ثبت کن." />
                )
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
