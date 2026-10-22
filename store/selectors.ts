import { useMemo } from "react"

import { getPersianYearMonth } from "@/lib/utils"
import { LogEntry, LogKind } from "@/lib/types"
import { useLogStore } from "@/store/useChartStore"

const EMPTY: LogEntry[] = []

// تراکنش‌های ماه شمسیِ تاریخ داده‌شده
export function useMonthEntries(date: Date) {
    const { year, month } = getPersianYearMonth(date)
    return useLogStore(
        (s) => s.logs.find((y) => y.year === year)?.months.find((m) => m.month === month)?.entries ?? EMPTY
    )
}

// دسته‌های یک نوع، پرکاربردترها اول (هم‌تعدادها به ترتیب ساخت)
export function useCategoriesByUsage(kind: LogKind) {
    const categories = useLogStore((s) => s.categories)
    const entries = useLogStore((s) => s.entries)
    return useMemo(() => {
        const counts = new Map<string, number>()
        for (const e of entries) if (e.key) counts.set(e.key, (counts.get(e.key) ?? 0) + 1)
        return categories
            .filter((c) => c.kind === kind)
            .map((c, i) => ({ c, i, n: counts.get(c.id) ?? 0 }))
            .sort((a, b) => b.n - a.n || a.i - b.i)
            .map(({ c }) => c)
    }, [categories, entries, kind])
}
