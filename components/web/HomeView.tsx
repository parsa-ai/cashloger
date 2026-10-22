"use client"

import { useMemo } from "react"
import { ArrowDown, ArrowUp, Plus } from "lucide-react"

import { AnimatedNumber } from "@/components/web/AnimatedNumber"
import { buildChartItems, CategoryBreakdown, SpendingChart } from "@/components/web/Chart"
import { CategoryAvatar } from "@/components/web/Avatars"
import { Group } from "@/components/web/Group"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { LogKind } from "@/lib/types"
import { cn, haptic } from "@/lib/utils"
import { useCategoriesByUsage, useMonthEntries } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import { useUiStore } from "@/store/useUiStore"
import useDateStore from "@/store/useYearStore"

function Stat({ label, value, kind }: { label: string; value: number; kind: LogKind }) {
    const openAdd = useUiStore((s) => s.openAdd)
    const Icon = kind === "income" ? ArrowDown : ArrowUp
    return (
        <button
            type="button"
            onClick={() => {
                haptic()
                openAdd(kind)
            }}
            aria-label={`ثبت ${label}`}
            className="press-row flex min-w-0 items-center gap-2.5 px-4 py-3 text-right"
        >
            <span
                className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full",
                    kind === "income" ? "bg-success/12 text-success" : "bg-fill text-foreground"
                )}
            >
                <Icon className="size-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[12px] text-muted-foreground">{label}</p>
                <p className="truncate text-[15px] font-semibold">
                    <AnimatedNumber value={value} />
                </p>
            </div>
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-tint text-primary">
                <Plus className="size-4" strokeWidth={2.4} />
            </span>
        </button>
    )
}


function SummaryCard({ income, costs }: { income: number; costs: number }) {
    const balance = income - costs

    return (
        <section className="overflow-hidden rounded-xl bg-card">
            <div className="px-4 pt-4 pb-3">
                <p className="text-[13px] text-muted-foreground">مانده این ماه</p>
                <p className={cn("mt-0.5 text-[34px] leading-tight font-bold", balance < 0 && "text-destructive")}>
                    <AnimatedNumber value={balance} />
                    <span className="ms-1.5 text-[15px] font-medium text-muted-foreground">تومان</span>
                </p>
            </div>
            <div className="grid grid-cols-2 border-t border-separator [&>:first-child]:border-e [&>:first-child]:border-separator">
                <Stat label="درآمد" value={income} kind="income" />
                <Stat label="هزینه" value={costs} kind="cost" />
            </div>
        </section>
    )
}

// ثبت سریع: لمس هر دسته شیت ثبت را با همان دسته باز می‌کند.
// همهٔ دسته‌ها بدون اسکرول دیده می‌شوند (پرکاربردترها اول)
function CategoryChips({ kind }: { kind: LogKind }) {
    const openAdd = useUiStore((s) => s.openAdd)
    const categories = useCategoriesByUsage(kind)
    if (categories.length === 0) return null

    const kindLabel = kind === "income" ? "درآمد" : "هزینه"

    return (
        <section>
            <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                            haptic()
                            openAdd(kind, c.id)
                        }}
                        aria-label={`ثبت ${kindLabel} در ${c.label}`}
                        className="press flex h-10 max-w-full items-center gap-2 rounded-full bg-card ps-1.5 pe-4 text-[14px] font-medium"
                    >
                        <CategoryAvatar label={c.label} color={c.color} size={28} />
                        <span className="max-w-32 truncate">{c.label}</span>
                    </button>
                ))}
            </div>
        </section>
    )
}

function HomeSkeleton() {
    return (
        <div className="space-y-6 pt-2">
            <div className="h-44 animate-pulse rounded-xl bg-card" />
            <div className="h-11 animate-pulse rounded-full bg-fill" />
            <div className="h-80 animate-pulse rounded-xl bg-card" />
        </div>
    )
}

export function HomeView() {
    const kind = useUiStore((s) => s.addKind)
    const setKind = useUiStore((s) => s.setAddKind)

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
        <div className="space-y-6 pt-2">
            <div className="space-y-6">
                <SummaryCard income={income} costs={costs} />
                <SegmentedControl
                    value={kind}
                    onChange={setKind}
                    options={[
                        { value: "cost", label: "هزینه‌ها" },
                        { value: "income", label: "درآمدها" },
                    ]}
                />
                <CategoryChips kind={kind} />
                <div className="overflow-hidden">
                    <SpendingChart key={kind} items={items} isCosts={kind === "cost"} />
                </div>
            </div>
            {items.length > 0 && (
                <Group>
                    <CategoryBreakdown key={kind} items={items} />
                </Group>
            )}
        </div>
    )
}
