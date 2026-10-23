"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { Dialog, DialogBody, DialogContent, DialogNav } from "@/components/ui/dialog"
import { AnimatedNumber } from "@/components/web/AnimatedNumber"
import { buildChartItems, CategoryBreakdown, SpendingChart } from "@/components/web/Chart"
import { CategoryAvatar } from "@/components/web/Avatars"
import { GoalsLink } from "@/components/web/Goals"
import { Group, Row } from "@/components/web/Group"
import { NavLink } from "@/components/web/NavLink"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { formatMoney } from "@/lib/money"
import { Category, LogEntry, LogKind } from "@/lib/types"
import { cn, haptic } from "@/lib/utils"
import { useCategoriesByUsage, useMonthEntries } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import { useUiStore } from "@/store/useUiStore"
import useDateStore from "@/store/useYearStore"
import { useMoneyUnit } from "@/store/useMoneyUnitStore"

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
           
        </button>
    )
}


// موجودی = درآمد − هزینه − آنچه به اهداف پس‌انداز رفته
function SummaryCard({ income, costs, saved }: { income: number; costs: number; saved: number }) {
    const unit = useMoneyUnit()
    const balance = income - costs - saved

    return (
        <section className="overflow-hidden rounded-xl bg-card">
            <div className="px-4 pt-4 pb-3">
                <p className={cn("mt-0.5 text-[34px] leading-tight font-bold", balance < 0 ? "text-destructive" : "text-success")}>
                    <AnimatedNumber value={balance} />
                    <span className="ms-1.5 text-[15px] font-medium text-muted-foreground">{unit.label}</span>
                </p>
                {saved !== 0 && (
                    <NavLink href="/goals" className="press mt-0.5 inline-block text-[13px] text-muted-foreground">
                        <span className="num">{formatMoney(Math.abs(saved), unit)}</span>{" "}
                        {saved > 0 ? "به پس‌انداز رفت" : "از پس‌انداز برگشت"}
                    </NavLink>
                )}
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

// بودجهٔ ماهانهٔ هر دسته: چقدر از آن در این ماه خرج شده
function Budgets({ entries, categories }: { entries: LogEntry[]; categories: Category[] }) {
    const unit = useMoneyUnit()
    const openAdd = useUiStore((s) => s.openAdd)

    const rows = useMemo(() => {
        const spent = new Map<string, number>()
        for (const e of entries) if (e.mode === "decrease" && e.key) spent.set(e.key, (spent.get(e.key) ?? 0) + e.visitors)
        return categories
            .filter((c) => c.kind === "cost" && c.budget)
            .map((c) => ({ category: c, budget: c.budget!, spent: spent.get(c.id) ?? 0 }))
            .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
    }, [entries, categories])

    if (rows.length === 0) return null

    return (
        <Group title="بودجهٔ این ماه">
            {rows.map(({ category, budget, spent }) => {
                const over = spent > budget
                const percent = Math.round((spent / budget) * 100)
                return (
                    <Row
                        key={category.id}
                        onClick={() => {
                            haptic()
                            openAdd("cost", category.id)
                        }}
                        leading={<CategoryAvatar label={category.label} color={category.color} size={32} />}
                        title={category.label}
                        subtitle={
                            <span className="flex items-center gap-2">
                                <span className="h-1 flex-1 overflow-hidden rounded-full bg-fill">
                                    <span
                                        className="block h-full origin-right rounded-full"
                                        style={{
                                            transform: `scaleX(${Math.min(spent / budget, 1)})`,
                                            backgroundColor: over ? "var(--destructive)" : category.color,
                                        }}
                                    />
                                </span>
                                <span className={cn("num w-10 text-left", over && "text-destructive")}>
                                    {percent.toLocaleString("fa-IR")}٪
                                </span>
                            </span>
                        }
                        trailing={
                            <span className="text-left leading-tight">
                                <span className={cn("num block text-[15px] font-semibold", over && "text-destructive")}>
                                    {formatMoney(over ? spent - budget : budget - spent, unit)}
                                </span>
                                <span className="block text-[12px] text-muted-foreground">{over ? "بیشتر از بودجه" : "مانده"}</span>
                            </span>
                        }
                    />
                )
            })}
        </Group>
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

    const [breakdownOpen, setBreakdownOpen] = useState(false)

    const isLoading = useLogStore((s) => s.isLoading)
    const categories = useLogStore((s) => s.categories)
    const date = useDateStore((s) => s.date) || new Date()
    const entries = useMonthEntries(date)

    const { income, costs, saved } = useMemo(() => {
        let income = 0
        let costs = 0
        let saved = 0
        for (const entry of entries) {
            if (entry.goal) saved += entry.mode === "decrease" ? entry.visitors : -entry.visitors
            else if (entry.mode === "increase") income += entry.visitors
            else costs += entry.visitors
        }
        return { income, costs, saved }
    }, [entries])

    const items = useMemo(
        () => buildChartItems(entries, categories.filter((c) => c.kind === kind), kind === "cost"),
        [entries, categories, kind]
    )

    if (isLoading) return <HomeSkeleton />

    return (
        <div className="space-y-6 pt-2">
            <div className="space-y-6">
                <SummaryCard income={income} costs={costs} saved={saved} />
                <SegmentedControl
                    value={kind}
                    onChange={setKind}
                    options={[
                        { value: "cost", label: "هزینه‌ها" },
                        { value: "income", label: "درآمدها" },
                    ]}
                />
                <CategoryChips kind={kind} />
            </div>
            <div className="overflow-hidden">
                <SpendingChart
                    key={kind}
                    items={items}
                    isCosts={kind === "cost"}
                    onOpen={() => {
                        haptic()
                        setBreakdownOpen(true)
                    }}
                />
            </div>
            {kind === "cost" && <Budgets entries={entries} categories={categories} />}
            <GoalsLink />

            <Dialog open={breakdownOpen && items.length > 0} onOpenChange={setBreakdownOpen}>
                <DialogContent>
                    <DialogNav title={kind === "cost" ? "هزینه‌ها" : "درآمدها"} />
                    <DialogBody>
                        <Group>
                            <CategoryBreakdown items={items} />
                        </Group>
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </div>
    )
}
