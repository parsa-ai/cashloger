// واحدهای نمایش و ورود مبلغ. همهٔ مبالغ همیشه به «تومان» ذخیره می‌شوند و فقط موقع نمایش/ورود تبدیل می‌شوند.
export const MONEY_UNITS = [
    { id: "rial", label: "ریال", factor: 0.1 },
    { id: "toman", label: "تومان", factor: 1 },
    { id: "thousand", label: "هزار تومان", factor: 1e3 },
    { id: "million", label: "میلیون تومان", factor: 1e6 },
] as const

export type MoneyUnit = (typeof MONEY_UNITS)[number]
export type MoneyUnitId = MoneyUnit["id"]

export const DEFAULT_MONEY_UNIT: MoneyUnitId = "thousand"

export function getMoneyUnit(id: string | null | undefined): MoneyUnit {
    return MONEY_UNITS.find((u) => u.id === id) ?? MONEY_UNITS.find((u) => u.id === DEFAULT_MONEY_UNIT)!
}

// تعداد رقم اعشاری که در این واحد معنی دارد (هزار تومان: ۳، میلیون تومان: ۶)
export function unitDecimals(unit: MoneyUnit) {
    return unit.factor > 1 ? Math.round(Math.log10(unit.factor)) : 0
}

// تومان ← عدد در واحد انتخابی
export function toUnit(toman: number, unit: MoneyUnit) {
    return toman / unit.factor
}

// عدد در واحد انتخابی ← تومان (همیشه عدد صحیح)
export function fromUnit(value: number, unit: MoneyUnit) {
    return Math.round(value * unit.factor)
}

// نمایش مبلغ (تومان) در واحد انتخابی؛ اعشار حداکثر ۳ رقم
export function formatMoney(toman: number, unit: MoneyUnit) {
    return toUnit(toman, unit).toLocaleString("fa-IR", { maximumFractionDigits: Math.min(3, unitDecimals(unit)) })
}

// مقدار خام برای ویرایش (بدون جداکننده و با دقت کامل)، مثل «12.5»
export function toUnitInput(toman: number, unit: MoneyUnit) {
    return String(Number(toUnit(toman, unit).toFixed(unitDecimals(unit))))
}

// رشتهٔ ورودی کاربر (ارقام لاتین و «.») با جداکنندهٔ هزارگان و ارقام فارسی، بدون حذف «.» آخر
export function formatInput(raw: string) {
    if (!raw) return ""
    const [int, frac] = raw.split(".")
    const grouped = Number(int || "0").toLocaleString("fa-IR")
    if (frac === undefined) return grouped
    const fracFa = frac.replace(/\d/g, (d) => String.fromCharCode(0x06f0 + Number(d)))
    return `${grouped}٫${fracFa}`
}

// ارقام فارسی/عربی و ممیز را به لاتین تبدیل می‌کند و فقط عدد معتبر در این واحد نگه می‌دارد
export function cleanInput(text: string, unit: MoneyUnit, maxDigits = 12) {
    const latin = text
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[٫,،/]/g, (c) => (c === "٫" || c === "/" ? "." : ""))
    const decimals = unitDecimals(unit)
    const [intRaw, ...rest] = latin.split(".")
    const int = intRaw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, maxDigits)
    if (!decimals || rest.length === 0) return int.replace(/^0+/, "")
    const frac = rest.join("").replace(/\D/g, "").slice(0, decimals)
    return `${int || "0"}.${frac}`
}

// مبلغ به زبان خودمانی و به تومان: ۱۲۵۰۰۰۰ ← «۱ میلیون و ۲۵۰ هزار تومان»
export function formatAmountWords(toman: number) {
    const units: [number, string][] = [[1e12, "هزار میلیارد"], [1e9, "میلیارد"], [1e6, "میلیون"], [1e3, "هزار"]]
    const parts: string[] = []
    let rest = Math.floor(toman)
    for (const [size, name] of units) {
        const count = Math.floor(rest / size)
        if (count > 0) {
            parts.push(`${count.toLocaleString("fa-IR")} ${name}`)
            rest -= count * size
        }
    }
    if (rest > 0) parts.push(rest.toLocaleString("fa-IR"))
    return `${parts.join(" و ")} تومان`
}
