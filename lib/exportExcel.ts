import { oklchToHex, UNCATEGORIZED_COLOR } from "@/lib/palette"
import { MoneyUnit, toUnit, unitDecimals } from "@/lib/money"
import { Category, Goal, LogEntry } from "@/lib/types"
import { getPersianYearMonth, UNCATEGORIZED_LABEL } from "@/lib/utils"

const MONEY_FORMAT = "#,##0"

// اعداد اعشاری (در واحدهای هزار/میلیون تومان) با ممیز، بقیه بدون «.» اضافه
function formatMoneyCells(row: import("exceljs").Row, keys: string[]) {
    for (const key of keys) {
        const cell = row.getCell(key)
        if (typeof cell.value === "number" && !Number.isInteger(cell.value)) cell.numFmt = "#,##0.###"
    }
}

function persianDate(date: Date) {
    return date.toLocaleDateString("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" })
}

function persianMonthName(date: Date) {
    return date.toLocaleDateString("fa-IR", { month: "long", year: "numeric" })
}

function argb(color: string) {
    const hex = oklchToHex(color) ?? "#999999"
    return "FF" + hex.slice(1).toUpperCase()
}

// ساخت فایل اکسل (راست‌به‌چپ) با سه شیت: تراکنش‌ها، خلاصهٔ ماهانه و دسته‌بندی‌ها
export async function exportToExcel(
    entries: LogEntry[],
    categories: Category[],
    goals: Goal[],
    fileName: string,
    unit: MoneyUnit
) {
    const { default: ExcelJS } = await import("exceljs")

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Cash Logger"
    workbook.created = new Date()

    const money = (toman: number) => Number(toUnit(toman, unit).toFixed(unitDecimals(unit)))
    // تراکنش هدف به جای دسته، خود هدف را نشان می‌دهد
    const categoryOf = (entry: LogEntry): { label: string; color: string } | undefined =>
        entry.goal ? goals.find((g) => g.id === entry.goal) : categories.find((c) => c.id === entry.key)
    const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime())

    const styleHeader = (sheet: import("exceljs").Worksheet) => {
        const header = sheet.getRow(1)
        header.font = { bold: true, color: { argb: "FFFFFFFF" } }
        header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B4252" } }
        header.alignment = { vertical: "middle", horizontal: "center" }
        header.height = 22
        sheet.views = [{ rightToLeft: true, state: "frozen", ySplit: 1 }]
    }

    // ۱) تراکنش‌ها
    const txSheet = workbook.addWorksheet("تراکنش‌ها")
    txSheet.columns = [
        { header: "تاریخ (شمسی)", key: "fa", width: 14 },
        { header: "تاریخ (میلادی)", key: "date", width: 14, style: { numFmt: "yyyy-mm-dd" } },
        { header: "نوع", key: "kind", width: 10 },
        { header: "دسته‌بندی", key: "category", width: 18 },
        { header: `مبلغ (${unit.label})`, key: "amount", width: 16, style: { numFmt: MONEY_FORMAT } },
        { header: "توضیحات", key: "description", width: 40 },
    ]
    for (const entry of sorted) {
        const category = categoryOf(entry)
        const isIncome = entry.mode === "increase"
        const row = txSheet.addRow({
            fa: persianDate(entry.date),
            date: entry.date,
            kind: entry.goal ? (isIncome ? "برداشت از پس‌انداز" : "پس‌انداز") : isIncome ? "درآمد" : "هزینه",
            category: category?.label ?? UNCATEGORIZED_LABEL,
            amount: money(isIncome ? entry.visitors : -entry.visitors),
            description: entry.description ?? "",
        })
        row.getCell("category").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: argb(category?.color ?? UNCATEGORIZED_COLOR) },
        }
        row.getCell("category").font = { color: { argb: "FFFFFFFF" }, bold: true }
        formatMoneyCells(row, ["amount"])
        row.getCell("amount").font = { color: { argb: isIncome ? "FF1E8E4E" : "FFC0392B" } }
    }
    styleHeader(txSheet)
    txSheet.autoFilter = { from: "A1", to: "F1" }

    // ۲) خلاصهٔ ماهانه
    const monthSheet = workbook.addWorksheet("خلاصه ماهانه")
    monthSheet.columns = [
        { header: "ماه", key: "month", width: 18 },
        { header: `درآمد (${unit.label})`, key: "income", width: 16, style: { numFmt: MONEY_FORMAT } },
        { header: `هزینه (${unit.label})`, key: "cost", width: 16, style: { numFmt: MONEY_FORMAT } },
        { header: `پس‌انداز (${unit.label})`, key: "saved", width: 16, style: { numFmt: MONEY_FORMAT } },
        { header: `مانده (${unit.label})`, key: "balance", width: 16, style: { numFmt: MONEY_FORMAT } },
    ]
    const months = new Map<string, { label: string; income: number; cost: number; saved: number }>()
    for (const entry of sorted) {
        const { year, month } = getPersianYearMonth(entry.date)
        const key = `${year}-${month}`
        const item = months.get(key) ?? { label: persianMonthName(entry.date), income: 0, cost: 0, saved: 0 }
        if (entry.goal) item.saved += entry.mode === "decrease" ? entry.visitors : -entry.visitors
        else if (entry.mode === "increase") item.income += entry.visitors
        else item.cost += entry.visitors
        months.set(key, item)
    }
    for (const item of months.values()) {
        const balance = item.income - item.cost - item.saved
        const row = monthSheet.addRow({
            month: item.label,
            income: money(item.income),
            cost: money(item.cost),
            saved: money(item.saved),
            balance: money(balance),
        })
        formatMoneyCells(row, ["income", "cost", "saved", "balance"])
        row.getCell("balance").font = { bold: true, color: { argb: balance >= 0 ? "FF1E8E4E" : "FFC0392B" } }
    }
    styleHeader(monthSheet)

    // ۳) جمع هر دسته‌بندی
    const catSheet = workbook.addWorksheet("دسته‌بندی‌ها")
    catSheet.columns = [
        { header: "دسته‌بندی", key: "label", width: 20 },
        { header: "نوع", key: "kind", width: 10 },
        { header: "تعداد", key: "count", width: 10 },
        { header: `مجموع (${unit.label})`, key: "total", width: 16, style: { numFmt: MONEY_FORMAT } },
    ]
    const rows = [...categories, null].map((category) => {
        const matching = entries.filter((e) =>
            category ? e.key === category.id : !e.goal && !categories.some((c) => c.id === e.key)
        )
        return { category, matching }
    })
    for (const { category, matching } of rows) {
        if (!category && matching.length === 0) continue
        const row = catSheet.addRow({
            label: category?.label ?? UNCATEGORIZED_LABEL,
            kind: category ? (category.kind === "income" ? "درآمد" : "هزینه") : "—",
            count: matching.length,
            total: money(matching.reduce((sum, e) => sum + e.visitors, 0)),
        })
        formatMoneyCells(row, ["total"])
        row.getCell("label").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: argb(category?.color ?? UNCATEGORIZED_COLOR) },
        }
        row.getCell("label").font = { color: { argb: "FFFFFFFF" }, bold: true }
    }
    styleHeader(catSheet)

    const buffer = await workbook.xlsx.writeBuffer()
    const type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    const file = new File([buffer], fileName, { type })

    // روی موبایل منوی اشتراک‌گذاری سیستم (با گزینهٔ ذخیره در فایل‌ها) به جای باز شدن مستقیم فایل
    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: fileName })
            return
        } catch (err) {
            // کاربر منو را بست
            if (err instanceof DOMException && err.name === "AbortError") return
            // مثلاً ساخت فایل طول کشید و مرورگر اجازهٔ share بدون لمس تازه را نداد؛ دانلود معمولی
        }
    }

    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}
