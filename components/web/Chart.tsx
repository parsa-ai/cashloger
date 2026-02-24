"use client"

import { Pie, PieChart } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import { chartConfig, chartConfigIncome } from "@/lib/chartConfigs"
import { useLogStore } from "@/store/useChartStore"
import { convertToChartItem, getPersianYearMonth } from "@/lib/utils"
import { categories, categoriesIncome } from "@/lib/data"
import useDateStore from "@/store/useYearStore"

export const description = "چارت دایره‌ای هزینه‌ها و در امد ها را برای ماه انتخاب شده نمایش می‌دهد."

export function ChartPieLabelList({isCosts = true}: {isCosts?: boolean}) {
    const logs = useLogStore((state) => state.logs)
    const date = useDateStore((s) => s.date) || new Date()
    const { year: currentYear, month: currentMonth } = getPersianYearMonth(date);
    const monthlyLog = logs.find(log => log.year === currentYear)?.months.find(month => month.month === currentMonth)
    const chartData = monthlyLog ? convertToChartItem(monthlyLog, isCosts ? categories : categoriesIncome, isCosts) : []
    const isEmpty = chartData.every((entry: any) => entry.visitors === 0)
    const cardTitle = date.toLocaleString("fa-IR", { month: "short" }) + " " + date.toLocaleString("fa-IR", { year: "numeric" })
    const cardDescription = `نمودار ${isCosts ? "هزینه" : "درآمد"} های `
    if (isEmpty) {
        return (
            <Card className="flex flex-col gap-0">
                <CardHeader className="items-center pb-0 flex">
                    <CardDescription>{cardDescription}</CardDescription>
                    <CardTitle>{cardTitle}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pt-5">
                    <div className="text-muted-foreground">هیچ داده‌ای برای نمایش وجود ندارد.</div>
                </CardContent>
            </Card>
        )
    }
    return (
        <Card className="flex flex-col gap-0">
            <CardHeader className="items-center pb-0 flex">
                <CardDescription>{cardDescription}</CardDescription>
                <CardTitle>{cardTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-10">
                <ChartContainer
                    config={isCosts ? chartConfig : chartConfigIncome}
                    className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-90 pb-0"
                >
                    <PieChart>
                        <Pie className="translate-y-4" data={chartData} dataKey="visitors"
                            label={({ payload, ...props }) => {
                                if (payload.visitors === 0) return null
                                return (
                                    <text
                                        cx={props.cx}
                                        cy={props.cy + 16}
                                        x={props.x}
                                        y={props.y + 16}
                                        textAnchor={props.textAnchor}
                                        dominantBaseline={props.dominantBaseline}
                                        fill="var(--foreground)"
                                    >
                                        {payload.visitors.toLocaleString('fa-IR')}
                                    </text>
                                )
                            }}
                            labelLine={false} nameKey="category" />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="category" />}
                            className="translate-y-10 flex-wrap gap-2  *:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
