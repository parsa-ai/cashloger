"use client"

import { Cell, Pie, PieChart } from "recharts"
import { ChevronLeft } from "lucide-react"
import { surprised } from "blobatar/expression"

import { ChartContainer } from "@/components/ui/chart"
import { AnimatedNumber } from "@/components/web/AnimatedNumber"
import { CategoryAvatar } from "@/components/web/Avatars"
import { EmptyState } from "@/components/web/EmptyState"
import { Row } from "@/components/web/Group"
import { useViewActive } from "@/components/web/ViewActive"
import { formatMoney } from "@/lib/money"
import { UNCATEGORIZED_COLOR } from "@/lib/palette"
import { Category, ChartItem, LogEntry } from "@/lib/types"
import { cn, UNCATEGORIZED_LABEL } from "@/lib/utils"
import { useMoneyUnit } from "@/store/useMoneyUnitStore"

export function buildChartItems(entries: LogEntry[], categories: Category[], isCosts: boolean): ChartItem[] {
    const mode = isCosts ? "decrease" : "increase"
    const totals = new Map<string | null, number>()
    for (const entry of entries) {
        if (entry.mode !== mode) continue
        const key = entry.key && categories.some((c) => c.id === entry.key) ? entry.key : null
        totals.set(key, (totals.get(key) ?? 0) + entry.visitors)
    }

    const items: ChartItem[] = categories
        .filter((c) => totals.get(c.id))
        .map((c) => ({ id: c.id, category: c.label, visitors: totals.get(c.id)!, fill: c.color }))

    const uncategorized = totals.get(null)
    if (uncategorized) {
        items.push({ id: "uncategorized", category: UNCATEGORIZED_LABEL, visitors: uncategorized, fill: UNCATEGORIZED_COLOR })
    }
    return items.sort((a, b) => b.visitors - a.visitors)
}

export function SpendingChart({ items, isCosts, onOpen }: { items: ChartItem[]; isCosts: boolean; onOpen?: () => void }) {
    const total = items.reduce((sum, item) => sum + item.visitors, 0)
    const active = useViewActive()

    if (items.length === 0) {
        return (
            <EmptyState
                expression={surprised}
                title={isCosts ? "این ماه هنوز خرجی نکردی" : "این ماه هنوز درآمدی ثبت نشده"}
                description="یکی از دسته‌های بالا رو لمس کن تا اولین تراکنش ثبت بشه."
            />
        )
    }

    const Wrapper = onOpen ? "button" : "div"
    const preview = items.slice(0, 3)

    return (
        <Wrapper
            {...(onOpen && {
                type: "button" as const,
                onClick: onOpen,
                "aria-label": `جزئیات ${isCosts ? "هزینه‌ها" : "درآمدها"} به تفکیک دسته`,
            })}
            className={cn(
                "animate-fade-in relative block w-full rounded-xl py-5",
                onOpen && "press-row bg-card outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            )}
        >
            <div className="relative mx-auto aspect-square w-full max-w-44">
                {active && (
                <ChartContainer config={{}} className="aspect-square size-full">
                    <PieChart>
                        <Pie
                            data={items}
                            dataKey="visitors"
                            nameKey="category"
                            innerRadius="72%"
                            outerRadius="100%"
                            paddingAngle={items.length > 1 ? 1.5 : 0}
                            cornerRadius={4}
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                            animationDuration={700}
                            animationEasing="ease-out"
                        >
                            {items.map((item) => (
                                <Cell key={item.id} fill={item.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
                )}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold">
                        <AnimatedNumber value={total} />
                    </span>
                </div>
            </div>
            {/* نشانهٔ بدون متن: دسته‌های اصلی روی هم + فلش «بیشتر» مثل ردیف‌های لیست */}
            {onOpen && (
                <span aria-hidden className="absolute end-3 bottom-3 flex items-center gap-1 rounded-full bg-fill py-1 ps-1 pe-1.5">
                    <span className="flex -space-x-1.5">
                        {preview.map((item) => (
                            <CategoryAvatar
                                key={item.id}
                                label={item.category}
                                color={item.fill}
                                size={22}
                                className="rounded-full ring-2 ring-fill"
                            />
                        ))}
                    </span>
                    <ChevronLeft className="size-4 text-muted-foreground" strokeWidth={2.4} />
                </span>
            )}
        </Wrapper>
    )
}

export function CategoryBreakdown({ items }: { items: ChartItem[] }) {
    const unit = useMoneyUnit()
    const total = items.reduce((sum, item) => sum + item.visitors, 0)

    return (
        <div>
            {items.map((item) => {
                const percent = total ? Math.round((item.visitors / total) * 100) : 0
                return (
                    <Row
                        key={item.id}
                        leading={<CategoryAvatar label={item.category} color={item.fill} size={32} />}
                        title={item.category}
                        subtitle={
                            <span className="flex items-center gap-2">
                                <span className="h-1 flex-1 overflow-hidden rounded-full bg-fill">
                                    <span
                                        className="block h-full rounded-full transition-[width] duration-500 ease-out"
                                        style={{ width: `${percent}%`, backgroundColor: item.fill }}
                                    />
                                </span>
                                <span className="num w-8 text-left">{percent.toLocaleString("fa-IR")}٪</span>
                            </span>
                        }
                        trailing={<span className="num text-[15px] font-semibold">{formatMoney(item.visitors, unit)}</span>}
                    />
                )
            })}
        </div>
    )
}
