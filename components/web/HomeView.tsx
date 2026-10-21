"use client"

import { useMemo, useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react"

import { AnimatedNumber } from "@/components/web/AnimatedNumber"
import { buildChartItems, SpendingChart } from "@/components/web/Chart"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { TransactionSheet } from "@/components/web/TransactionSheet"
import { LogKind } from "@/lib/types"
import { cn, formatMonthTitle, haptic } from "@/lib/utils"
import { useMonthEntries } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import useDateStore from "@/store/useYearStore"

function SummaryCard({ income, costs, date }: { income: number; costs: number; date: Date }) {
    const balance = income - costs

    return (
        <section className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/25">
            <div
                aria-hidden
                className="absolute -top-16 -left-10 size-48 rounded-full bg-white/15 blur-2xl"
            />
            <div className="relative space-y-1">
                <p className="text-sm opacity-80">موجودی {formatMonthTitle(date)}</p>
                <p className="text-4xl font-extrabold tracking-tight">
                    <AnimatedNumber value={balance} />
                    <span className="mr-1.5 text-base font-medium opacity-70">تومان</span>
                </p>
            </div>
            <div className="relative mt-5 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-2xl bg-white/15 p-3 backdrop-blur">
                    <span className="grid size-8 place-items-center rounded-full bg-white/20">
                        <ArrowDownLeft className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs opacity-80">درآمد</p>
                        <p className="truncate font-bold"><AnimatedNumber value={income} /></p>
                    </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white/15 p-3 backdrop-blur">
                    <span className="grid size-8 place-items-center rounded-full bg-white/20">
                        <ArrowUpRight className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-xs opacity-80">هزینه</p>
                        <p className="truncate font-bold"><AnimatedNumber value={costs} /></p>
                    </div>
                </div>
            </div>
        </section>
    )
}

function HomeSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-44 animate-pulse rounded-3xl bg-muted" />
            <div className="h-10 animate-pulse rounded-xl bg-muted" />
            <div className="h-80 animate-pulse rounded-3xl bg-muted" />
        </div>
    )
}

export function HomeView() {
    const [kind, setKind] = useState<LogKind>("cost")
    const [sheetOpen, setSheetOpen] = useState(false)

    const isLoading = useLogStore((s) => s.isLoading)
    const categories = useLogStore((s) => s.categories)
    const date = useDateStore((s) => s.date) || new Date()
    const entries = useMonthEntries(date)

    const { income, costs } = useMemo(() => {
        let income = 0
        let costs = 0
        for (const entry of entries) {
            if (entry.mode === "increase") income += entry.visitors
            else costs += entry.visitors
        }
        return { income, costs }
    }, [entries])

    const items = useMemo(
        () => buildChartItems(entries, categories.filter((c) => c.kind === kind), kind === "cost"),
        [entries, categories, kind]
    )

    if (isLoading) return <HomeSkeleton />

    return (
        <div className="space-y-4">
            <SummaryCard income={income} costs={costs} date={date} />

            <SegmentedControl
                value={kind}
                onChange={setKind}
                options={[
                    { value: "cost", label: "هزینه‌ها" },
                    { value: "income", label: "درآمدها" },
                ]}
            />

            <section className="rounded-3xl bg-card p-5">
                <SpendingChart key={kind} items={items} isCosts={kind === "cost"} />
            </section>

            <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),0.5rem)+4.75rem)] z-30">
                <div className="mx-auto flex max-w-2xl justify-end px-4">
                    <button
                        type="button"
                        onClick={() => {
                            haptic()
                            setSheetOpen(true)
                        }}
                        className={cn(
                            "pressable pointer-events-auto flex h-14 animate-pop items-center gap-2 rounded-full px-5 font-semibold text-white shadow-xl",
                            kind === "cost" ? "bg-primary shadow-primary/30" : "bg-success shadow-success/30"
                        )}
                    >
                        <Plus className="size-5" strokeWidth={2.5} />
                        <span key={kind} className="animate-item-in">
                            {kind === "cost" ? "هزینه جدید" : "درآمد جدید"}
                        </span>
                    </button>
                </div>
            </div>

            <TransactionSheet open={sheetOpen} onOpenChange={setSheetOpen} kind={kind} date={date} />
        </div>
    )
}
