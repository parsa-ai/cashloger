"use client"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon } from "lucide-react"
import { LogDetailsDialog } from "@/components/web/LogDetailsDialog"
import { useLogStore } from "@/store/useChartStore"
import useDateStore from "@/store/useYearStore"
import { getPersianYearMonth } from "@/lib/utils"
import { categories } from "@/lib/data"

export function LogsTable() {
    const logs = useLogStore((state) => state.logs)
    const removeLog = useLogStore((state) => state.removeLog)
    const updateLog = useLogStore((state) => state.updateLog)
    const date = useDateStore((s) => s.date) || new Date()
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
    function deleteItem(id : string) {
        removeLog(id)
    }
    return (
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
                        return (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{entry.date.toLocaleDateString("fa-IR")}</TableCell>
                                <TableCell className="font-medium">{entry.mode == "increase" ? "واریز" : "برداشت"}</TableCell>
                                <TableCell>{entry.visitors}</TableCell>
                                <TableCell className="font-medium">{categories.find(c => c.key === entry.key)?.label || "نامشخص"}</TableCell>
                                <TableCell className="font-medium flex justify-between items-center">
                                    <LogDetailsDialog cat={categories.find(c => c.key === entry.key)?.label || "نامشخص"} DialogDescriptionText={entry.description || undefined } />

                                    <DropdownMenu dir="rtl">
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8">
                                                <MoreHorizontalIcon />
                                                <span className="sr-only">منو</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {/* <DropdownMenuItem>ویرایش</DropdownMenuItem> */}
                                            {/* <DropdownMenuSeparator /> */}
                                            <DropdownMenuItem variant="destructive" className="text-right" onClick={()=>{deleteItem(entry.id)}}>
                                                حذف
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>


                            </TableRow>
                        )
                    })}
            </TableBody>
        </Table>
    )
}
