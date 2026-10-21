"use client"

import { useState } from "react"
import { FileSpreadsheet, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogNav } from "@/components/ui/dialog"
import { Group, Row } from "@/components/web/Group"
import { exportToExcel } from "@/lib/exportExcel"
import { cn, formatMonthTitle, getPersianYearMonth, haptic } from "@/lib/utils"
import { useMonthEntries } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"
import useDateStore from "@/store/useYearStore"

type Scope = "month" | "all"

function Check({ on }: { on: boolean }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5 text-primary transition-opacity duration-150", on ? "opacity-100" : "opacity-0")}>
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function ExportSheet({ open, onOpenChange: setOpen }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [scope, setScope] = useState<Scope>("month")
    const [isExporting, setIsExporting] = useState(false)

    const allEntries = useLogStore((s) => s.entries)
    const categories = useLogStore((s) => s.categories)
    const date = useDateStore((s) => s.date) || new Date()
    const monthEntries = useMonthEntries(date)

    const entries = scope === "month" ? monthEntries : allEntries

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const { year, month } = getPersianYearMonth(date)
            const fileName = scope === "month" ? `cashlog-${year}-${month}.xlsx` : "cashlog-all.xlsx"
            await exportToExcel(entries, categories, fileName)
            haptic([10, 40, 10])
            toast("فایل اکسل آماده شد", "success")
            setOpen(false)
        } catch (err) {
            toast(err instanceof Error ? err.message : "خطا در ساخت فایل اکسل", "error")
        } finally {
            setIsExporting(false)
        }
    }

    const choose = (value: Scope) => {
        if (value !== scope) haptic()
        setScope(value)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogNav title="خروجی اکسل" />
                <DialogBody>
                    <Group
                        title="بازه"
                        footer="فایل سه برگه دارد: تراکنش‌ها، خلاصهٔ ماهانه و جمع هر دسته‌بندی."
                    >
                        <Row
                            onClick={() => choose("month")}
                            title={formatMonthTitle(date)}
                            subtitle={`${monthEntries.length.toLocaleString("fa-IR")} تراکنش`}
                            trailing={<Check on={scope === "month"} />}
                        />
                        <Row
                            onClick={() => choose("all")}
                            title="همهٔ داده‌ها"
                            subtitle={`${allEntries.length.toLocaleString("fa-IR")} تراکنش`}
                            trailing={<Check on={scope === "all"} />}
                        />
                    </Group>

                    <Button size="lg" className="w-full" disabled={isExporting || entries.length === 0} onClick={handleExport}>
                        {isExporting ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
                        دانلود فایل اکسل
                    </Button>
                </DialogBody>
            </DialogContent>
        </Dialog>
    )
}

export function ExportButton() {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button variant="tinted" size="icon" aria-label="خروجی اکسل" onClick={() => setOpen(true)}>
                <FileSpreadsheet />
            </Button>
            <ExportSheet open={open} onOpenChange={setOpen} />
        </>
    )
}
