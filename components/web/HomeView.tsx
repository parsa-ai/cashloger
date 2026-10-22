"use client"

import { useMemo } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

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
    const Icon = kind === "income" ? ArrowDown : ArrowUp
    return (
        <div className="flex min-w-0 items-center gap-2.5 px-4 py-3">
            <span
                aria-hidden
                className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full",
                    kind === "income" ? "bg-success/12 text-success" : "bg-fill text-foreground"
                )}
            >
                <Icon className="size-4" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[12px] text-muted-foreground">{label}</p>
                <p className={cn("truncate text-[15px] font-semibold", kind === "income" && "text-success")}>
                    <AnimatedNumber value={value} />
                </p>
            </div>
        </div>
    )
}

// خلاصهٔ ماه: مانده، درآمد و هزینه، و اینکه چه سهمی از درآمد خرج شده
function SummaryCard({ income, costs }: { income: number; costs: number }) {
    const balance = income - costs
    const spent = income > 0 ? Math.round((costs / income) * 100) : null

    return (
        <section aria-label="خلاصهٔ این ماه" className="overflow-hidden rounded-xl bg-card">
            <div className="px-4 pt-4 pb-3">
                <p className="text-[13px] text-muted-foreground">مانده این ماه</p>
                <p className={cn("mt-0.5 text-[34px] leading-tight font-bold", balance < 0 && "text-destructive")}>
                    <AnimatedNumber value={balance} />
                    <span className="ms-1.5 text-[15px] font-medium text-muted-foreground">تومان</span>
                </p>
                {spent !== null && (
                    <div className="mt-3 space-y-1.5">
                        <div
                            role="meter"
                            aria-label="سهم هزینه از درآمد"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.min(spent, 100)}
                            className="h-1.5 overflow-hidden rounded-full bg-fill"
                        >
                            <div
                                className={cn("h-full rounded-full", spent > 100 ? "bg-destructive" : "bg-primary")}
                                style={{ width: `${Math.min(spent, 100)}%` }}
                            />
                        </div>
                        <p className="text-[12px] text-muted-foreground">
                            <span className="num">{spent.toLocaleString("fa-IR")}٪</span> درآمد این ماه خرج شده
                        </p>
                    </div>
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
            <h2 className="mb-1.5 px-4 text-[13px] text-muted-foreground">ثبت سریع {kindLabel}</h2>
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
            {/* نمای کلی ماه به نوع انتخاب‌شده بستگی ندارد، پس بالای سوییچ می‌آید */}
            <SummaryCard income={income} costs={costs} />

            <div className="space-y-6">
                <SegmentedControl
                    value={kind}
                    onChange={setKind}
                    options={[
                        { value: "cost", label: "هزینه‌ها" },
                        { value: "income", label: "درآمدها" },
                    ]}
                />
                <CategoryChips kind={kind} />
                <div className="overflow-hidden rounded-xl bg-card">
                    <SpendingChart key={kind} items={items} isCosts={kind === "cost"} />
                </div>
            </div>

            {/* ریز دسته‌ها ممکن است بلند باشد؛ آخر صفحه تا چیزی را پایین هل ندهد */}
            {items.length > 0 && (
                <Group title={`ریز ${kind === "cost" ? "هزینه‌ها" : "درآمدها"}`}>
                    <CategoryBreakdown key={kind} items={items} />
                </Group>
            )}
        </div>
    )
}
