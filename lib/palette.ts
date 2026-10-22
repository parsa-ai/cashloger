// پالت ۶۴ رنگی دسته‌بندی‌ها: ۱۶ فام × ۴ تن.
// هر رنگ نزدیک به بیشترین اشباع ممکن در sRGB برای فام خودش است تا همه به یک اندازه «تیز» باشند،
// و روشنایی هر فام به سمت روشن‌ترین نقطهٔ طبیعی‌اش کشیده شده (زرد گِلی و آبی بی‌رنگ نمی‌شود).
// مقادیر با اسکریپت تولید شده‌اند؛ دستی عوضشان نکن.

export const PALETTE_ROWS: string[][] = [
    ["oklch(0.713 0.162 25)", "oklch(0.744 0.149 45)", "oklch(0.776 0.154 65)", "oklch(0.816 0.15 90)", "oklch(0.85 0.17 120)", "oklch(0.818 0.17 145)", "oklch(0.827 0.157 165)", "oklch(0.832 0.132 185)", "oklch(0.816 0.125 205)", "oklch(0.771 0.131 230)", "oklch(0.71 0.138 255)", "oklch(0.643 0.17 275)", "oklch(0.67 0.17 295)", "oklch(0.708 0.17 315)", "oklch(0.733 0.17 340)", "oklch(0.717 0.169 5)"],
    ["oklch(0.655 0.22 25)", "oklch(0.69 0.189 45)", "oklch(0.725 0.156 65)", "oklch(0.77 0.151 90)", "oklch(0.808 0.184 120)", "oklch(0.773 0.22 145)", "oklch(0.783 0.158 165)", "oklch(0.788 0.133 185)", "oklch(0.77 0.126 205)", "oklch(0.72 0.138 230)", "oklch(0.653 0.181 255)", "oklch(0.578 0.22 275)", "oklch(0.608 0.22 295)", "oklch(0.65 0.22 315)", "oklch(0.678 0.22 340)", "oklch(0.66 0.22 5)"],
    ["oklch(0.605 0.22 25)", "oklch(0.64 0.176 45)", "oklch(0.675 0.145 65)", "oklch(0.72 0.141 90)", "oklch(0.758 0.173 120)", "oklch(0.723 0.218 145)", "oklch(0.733 0.148 165)", "oklch(0.738 0.125 185)", "oklch(0.72 0.118 205)", "oklch(0.67 0.128 230)", "oklch(0.603 0.191 255)", "oklch(0.528 0.22 275)", "oklch(0.558 0.22 295)", "oklch(0.6 0.22 315)", "oklch(0.628 0.22 340)", "oklch(0.61 0.22 5)"],
    ["oklch(0.548 0.2 25)", "oklch(0.579 0.156 45)", "oklch(0.611 0.129 65)", "oklch(0.651 0.125 90)", "oklch(0.685 0.153 120)", "oklch(0.653 0.193 145)", "oklch(0.662 0.131 165)", "oklch(0.667 0.111 185)", "oklch(0.651 0.105 205)", "oklch(0.606 0.114 230)", "oklch(0.545 0.169 255)", "oklch(0.478 0.2 275)", "oklch(0.505 0.2 295)", "oklch(0.543 0.2 315)", "oklch(0.568 0.2 340)", "oklch(0.552 0.2 5)"],
]

export const PALETTE: string[] = PALETTE_ROWS.flat()

// رنگ‌هایی که موقع ساختن یا ویرایش دسته پیشنهاد می‌شوند: ۱۲ فام پررنگ و از هم جدا.
// رنگ دسته‌هایی که قبلاً از کل پالت انتخاب شده‌اند همان‌طور می‌ماند.
export const SWATCHES: string[] = [0, 1, 2, 3, 5, 7, 9, 10, 11, 12, 13, 14].map((i) => PALETTE_ROWS[1][i])

export const UNCATEGORIZED_COLOR = "oklch(0.68 0.01 260)"

interface Oklch {
    l: number
    c: number
    h: number
}

export function parseOklch(color: string): Oklch | null {
    const match = color.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/)
    if (!match) return null
    return {
        l: parseFloat(match[1]) / (match[2] ? 100 : 1),
        c: parseFloat(match[3]),
        h: parseFloat(match[4]),
    }
}

// فاصلهٔ ادراکی دو رنگ در فضای OKLab
function distance(a: Oklch, b: Oklch) {
    const ah = (a.h * Math.PI) / 180
    const bh = (b.h * Math.PI) / 180
    return Math.hypot(a.l - b.l, a.c * Math.cos(ah) - b.c * Math.cos(bh), a.c * Math.sin(ah) - b.c * Math.sin(bh))
}

const PARSED = PALETTE.map((color) => ({ color, value: parseOklch(color)! }))

// رنگ‌های قدیمی (var(--chart-N)) قبل از اجرای مایگریشن رنگ‌ها
const LEGACY_HUES = [25, 65, 105, 130, 170, 210, 250, 290, 315, 345]

// هر رنگ ذخیره‌شده (از نسخه‌های قبلی پالت هم) به نزدیک‌ترین رنگ پالت فعلی نگاشت می‌شود
export function normalizeColor(color: string) {
    if (PALETTE.includes(color)) return color
    const legacy = color.match(/^var\(--chart-(\d+)\)$/)
    const target = legacy
        ? { l: 0.65, c: 0.18, h: LEGACY_HUES[Number(legacy[1]) - 1] ?? 255 }
        : parseOklch(color) ?? { l: 0.65, c: 0.18, h: 255 }
    let best = PARSED[0]
    for (const item of PARSED) {
        if (distance(item.value, target) < distance(best.value, target)) best = item
    }
    return best.color
}

export function colorHue(color: string) {
    return parseOklch(color)?.h ?? 255
}

// رنگی از رنگ‌های پیشنهادی که کمتر از بقیه بین دسته‌های موجود استفاده شده
export function suggestColor(usedColors: string[]) {
    let best = SWATCHES[0]
    let bestCount = Infinity
    for (const color of SWATCHES) {
        const count = usedColors.filter((c) => c === color).length
        if (count < bestCount) {
            best = color
            bestCount = count
        }
    }
    return best
}

// تبدیل oklch به hex برای جاهایی که CSS نیست (مثل اکسل)
export function oklchToHex(color: string): string | null {
    const parsed = parseOklch(color)
    if (!parsed) return null

    const { l: L, c: C } = parsed
    const h = (parsed.h * Math.PI) / 180
    const a = C * Math.cos(h)
    const b = C * Math.sin(h)

    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

    const linear = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ]

    return (
        "#" +
        linear
            .map((x) => {
                const v = Math.min(1, Math.max(0, x))
                const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
                return Math.round(srgb * 255).toString(16).padStart(2, "0")
            })
            .join("")
    )
}
