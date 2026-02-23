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
import { chartConfig } from "@/lib/chartConfigs"
import { useLogStore } from "@/store/useChartStore"
import { convertToChartItem } from "@/lib/utils"
import { categories } from "@/lib/data"

export const description = "A pie chart with a label"


export function ChartPieLabelList() {
    const logs = useLogStore((state) => state.logs)
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const monthlyLog = logs.find(log => log.year === currentYear)?.months.find(month => month.month === currentMonth)
    const chartData = monthlyLog ? convertToChartItem(monthlyLog, categories) : []
    const isEmpty = chartData.every((entry: any) => entry.visitors === 0)
    if (isEmpty) {
        return (
            <Card className="flex flex-col gap-0">
                <CardHeader className="items-center pb-0 flex">
                    <CardDescription>نمودار خرج های</CardDescription>
                    <CardTitle>{new Date().toLocaleString("fa-IR", { month: "short" })} ماه</CardTitle>
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
                <CardDescription>نمودار خرج های</CardDescription>
                <CardTitle>{new Date().toLocaleString("fa-IR", { month: "short" })} ماه</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-10">
                <ChartContainer
                    config={chartConfig}
                    className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-90 pb-0"
                >
                    <PieChart>
                        <Pie className="translate-y-4" data={chartData} dataKey="visitors"
                            label={({ payload, ...props }) => {
                                return (
                                    <text
                                        cx={props.cx}
                                        cy={props.cy+16}
                                        x={props.x}
                                        y={props.y+16}
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
