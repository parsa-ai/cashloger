"use client"
import { Separator } from "@/components/ui/separator";
import { getPersianYearMonth } from "@/lib/utils";
import { useLogStore } from "@/store/useChartStore";
import useDateStore from "@/store/useYearStore";
import { useMemo } from "react";

function Toutal() {

    const logs = useLogStore((s) => s.logs)
    const date = useDateStore((s) => s.date) || new Date()

    const { costs, income, toutal, isIncomePositive } = useMemo(() => {
        const { year, month } = getPersianYearMonth(date)

        const yearData = logs.find(log => log.year === year)
        const monthData = yearData?.months.find(m => m.month === month)
        
        const costs = monthData?.entries.reduce((total, entry) => {
            if (entry.mode === "decrease") {
                return total + entry.visitors
            }
            return total
        }, 0) || 0

        const income = monthData?.entries.reduce((total, entry) => {
            if (entry.mode === "increase") {
                return total + entry.visitors
            }
            return total
        }, 0) || 0
        const toutal = income - costs
        const isIncomePositive = toutal >= 0

        const formattedCosts = costs.toLocaleString("fa-IR")
        const formattedIncome = income.toLocaleString("fa-IR")
        const formatted = toutal.toLocaleString("fa-IR")
        return { costs: formattedCosts, income: formattedIncome, toutal: formatted, isIncomePositive }
    }, [logs, date])

    return (
        <div className="flex h-5 items-center justify-between gap-4 text-sm mx-auto w-full mt-5">
            <div>
                <span>مجموع هزینه ها </span>
                <span>{costs}</span>
            </div>
            <Separator orientation="vertical" />
            <div>
                <span>موجودی حساب </span>
                <span className={isIncomePositive ? "text-green-500" : "text-red-500"}>{toutal}</span>
            </div>
            <Separator orientation="vertical" />
            <div>
                <span>مجموع واریزی ها </span>
                <span>{income}</span>
            </div>
        </div>
    )
}

export default Toutal