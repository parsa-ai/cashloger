"use client"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, ScrollText, Trash } from "lucide-react"
import { LogDetailsDialog } from "@/components/web/LogDetailsDialog"
import { useLogStore } from "@/store/useChartStore"
import useDateStore from "@/store/useYearStore"
import { getPersianYearMonth } from "@/lib/utils"
import { categories, categoriesIncome } from "@/lib/data"
import Link from "next/link"

function LogsTableData({ date }: { date: Date }) {
    const logs = useLogStore((state) => state.logs)
    const removeLog = useLogStore((state) => state.removeLog)
    const { year: currentYear, month: currentMonth } = getPersianYearMonth(date);
    const monthlyLog = logs.find(log => log.year === currentYear)?.months.find(month => month.month === currentMonth)
    const entries = monthlyLog ? monthlyLog.entries : []

    if (entries.length === 0) {
        return (
            <div className="text-muted-foreground text-center py-10">
                هیچ داده‌ای برای نمایش وجود ندارد.
            </div>
        )
    }
    function deleteItem(id: string) {
        removeLog(id)
    }

    return (
        <>

            <Table dir="rtl" className=" **:text-right">
                <TableHeader>
                    <TableRow>
                        <TableHead >تاریخ</TableHead>
                        <TableHead >نوع</TableHead>
                        <TableHead>مبلغ</TableHead>
                        <TableHead>دسته بندی</TableHead>
                        <TableHead>توضیحات</TableHead>

                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        entries.map((entry, index) => {
                            let categoryLabel = ""
                            if (entry.mode === "decrease") {
                                categoryLabel = categories.find(c => c.key === entry.key)?.label || "نامشخص"
                            }
                            else {
                                categoryLabel = categoriesIncome.find(c => c.key === entry.key)?.label || "نامشخص"
                            }
                            return (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{entry.date.toLocaleDateString("fa-IR")}</TableCell>
                                    <TableCell className="font-medium">{entry.mode == "increase" ? "واریز" : "برداشت"}</TableCell>
                                    <TableCell>{entry.visitors.toLocaleString("fa-IR")}</TableCell>
                                    <TableCell className="font-medium">{categoryLabel}</TableCell>
                                    <TableCell className="font-medium flex justify-between items-center">
                                        <LogDetailsDialog cat={categoryLabel} DialogDescriptionText={entry.description || undefined} />

                                        <Button variant="outline" className="text-right size-10" onClick={() => { deleteItem(entry.id) }}>
                                            <Trash />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                </TableBody>
            </Table>
        </>
    )
}


export function LogsTable() {
    const date = useDateStore((s) => s.date) || new Date()
    const cardTitle = date.toLocaleString("fa-IR", { month: "short" }) + " " + date.toLocaleString("fa-IR", { year: "numeric" })

    return (
        <>
            <div className="flex justify-between items-center  mb-4 text-muted-foreground border-b border-dashed pb-4">
                <h3 className="font-bold   flex gap-2 items-center "><ScrollText size={18} />لیست تراکنش‌های {cardTitle}</h3>
                <Link href='/' className="text-sm flex items-center gap-1"><span className="mb-1">خانه</span><ChevronLeft size={16} /> </Link>
            </div>
            <LogsTableData date={date} />
        </>
    )
}