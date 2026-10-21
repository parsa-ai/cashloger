import { getPersianYearMonth } from "@/lib/utils"
import { LogEntry } from "@/lib/types"
import { useLogStore } from "@/store/useChartStore"

const EMPTY: LogEntry[] = []

// تراکنش‌های ماه شمسیِ تاریخ داده‌شده
export function useMonthEntries(date: Date) {
    const { year, month } = getPersianYearMonth(date)
    return useLogStore(
        (s) => s.logs.find((y) => y.year === year)?.months.find((m) => m.month === month)?.entries ?? EMPTY
    )
}
