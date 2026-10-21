"use client"

import { useState } from "react"
import { FileSpreadsheet, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { exportToExcel } from "@/lib/exportExcel"
import { formatMonthTitle, getPersianYearMonth, haptic } from "@/lib/utils"
import { useMonthEntries } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"
import useDateStore from "@/store/useYearStore"

type Scope = "month" | "all"

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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <span className="mx-auto mb-1 grid size-14 animate-pop place-items-center rounded-2xl bg-success/15 text-success">
                        <FileSpreadsheet className="size-7" />
                    </span>
                    <DialogTitle>خروجی اکسل</DialogTitle>
                    <DialogDescription>
                        تراکنش‌ها، خلاصهٔ ماهانه و جمع هر دسته‌بندی در یک فایل
                    </DialogDescription>
                </DialogHeader>

                <SegmentedControl
                    value={scope}
                    onChange={setScope}
                    options={[
                        { value: "month", label: formatMonthTitle(date) },
                        { value: "all", label: "همهٔ داده‌ها" },
                    ]}
                />

                <p className="text-center text-sm text-muted-foreground">
                    {entries.length.toLocaleString("fa-IR")} تراکنش
                </p>

                <Button size="lg" className="mb-2 w-full" disabled={isExporting || entries.length === 0} onClick={handleExport}>
                    {isExporting ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
                    دانلود فایل اکسل
                </Button>
            </DialogContent>
        </Dialog>
    )
}

export function ExportButton() {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button
                variant="tinted"
                size="icon"
                className="shrink-0 rounded-xl"
                aria-label="خروجی اکسل"
                onClick={() => setOpen(true)}
            >
                <FileSpreadsheet />
            </Button>
            <ExportSheet open={open} onOpenChange={setOpen} />
        </>
    )
}
