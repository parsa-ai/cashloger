"use client"

import { Cell, Label, Pie, PieChart } from "recharts"

import { ChartContainer } from "@/components/ui/chart"
import { AnimatedNumber } from "@/components/web/AnimatedNumber"
import { UNCATEGORIZED_COLOR } from "@/lib/palette"
import { Category, ChartItem, LogEntry } from "@/lib/types"
import { formatMoney, UNCATEGORIZED_LABEL } from "@/lib/utils"
import { PieChartIcon } from "lucide-react"

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

export function SpendingChart({ items, isCosts }: { items: ChartItem[]; isCosts: boolean }) {
    const total = items.reduce((sum, item) => sum + item.visitors, 0)

    if (items.length === 0) {
        return (
            <div className="flex animate-item-in flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                <span className="grid size-14 place-items-center rounded-full bg-muted">
                    <PieChartIcon className="size-6" />
                </span>
                <p className="text-sm">
                    این ماه هنوز {isCosts ? "هزینه‌ای" : "درآمدی"} ثبت نشده.
                </p>
            </div>
        )
    }

    return (
        <div className="animate-item-in space-y-5">
            <ChartContainer config={{}} className="mx-auto aspect-square max-h-60">
                <PieChart>
                    <Pie
                        data={items}
                        dataKey="visitors"
                        nameKey="category"
                        innerRadius="68%"
                        outerRadius="100%"
                        paddingAngle={items.length > 1 ? 2 : 0}
                        cornerRadius={6}
                        stroke="none"
                        animationDuration={900}
                        animationEasing="ease-out"
                    >
                        {items.map((item) => (
                            <Cell key={item.id} fill={item.fill} />
                        ))}
                        <Label
                            content={({ viewBox }) => {
                                if (!viewBox || !("cx" in viewBox)) return null
                                return (
                                    <foreignObject x={(viewBox.cx ?? 0) - 80} y={(viewBox.cy ?? 0) - 30} width={160} height={60}>
                                        <div className="flex h-full flex-col items-center justify-center">
                                            <span className="text-xs text-muted-foreground">
                                                مجموع {isCosts ? "هزینه" : "درآمد"}
                                            </span>
                                            <span className="text-xl font-extrabold">
                                                <AnimatedNumber value={total} />
                                            </span>
                                        </div>
                                    </foreignObject>
                                )
                            }}
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>

            <ul className="space-y-3">
                {items.map((item, i) => {
                    const percent = total ? (item.visitors / total) * 100 : 0
                    return (
                        <li key={item.id} className="stagger animate-item-in space-y-1.5" style={{ "--i": i } as React.CSSProperties}>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span className="flex-1 truncate font-medium">{item.category}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {Math.round(percent).toLocaleString("fa-IR")}٪
                                </span>
                                <span className="w-24 text-left font-semibold tabular-nums">{formatMoney(item.visitors)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full origin-right animate-[bar-grow_900ms_var(--ease-ios)_both] rounded-full transition-[width] duration-700 ease-ios"
                                    style={{ width: `${percent}%`, backgroundColor: item.fill }}
                                />
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
