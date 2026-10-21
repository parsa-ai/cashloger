// پالت ۶۴ رنگی دسته‌بندی‌ها: ۱۶ فام × ۴ تن با روشنایی و اشباع یکسان در هر تن
// تا همهٔ رنگ‌ها کنار هم هماهنگ دیده شوند.

export const PALETTE_HUES = [25, 45, 65, 85, 105, 130, 150, 170, 190, 210, 230, 250, 270, 290, 315, 345]

export const PALETTE_TONES = [
    { l: 0.86, c: 0.09 },
    { l: 0.76, c: 0.14 },
    { l: 0.65, c: 0.18 },
    { l: 0.52, c: 0.16 },
]

export const PALETTE: string[] = PALETTE_TONES.flatMap((tone) =>
    PALETTE_HUES.map((hue) => `oklch(${tone.l} ${tone.c} ${hue})`)
)

export const UNCATEGORIZED_COLOR = "oklch(0.7 0 0)"

// رنگ‌های قدیمی (var(--chart-N)) قبل از اجرای مایگریشن رنگ‌ها
const LEGACY_HUES = [25, 65, 105, 130, 170, 210, 250, 290, 315, 345]

export function normalizeColor(color: string) {
    if (/^oklch\([0-9. ]{5,30}\)$/.test(color)) return color
    const legacy = color.match(/^var\(--chart-(\d+)\)$/)
    const hue = legacy ? LEGACY_HUES[Number(legacy[1]) - 1] : undefined
    return `oklch(0.65 0.18 ${hue ?? 230})`
}

// رنگی از پالت که کمتر از بقیه بین دسته‌های موجود استفاده شده (اولویت با تن سوم)
export function suggestColor(usedColors: string[]) {
    const ordered = [
        ...PALETTE.slice(32, 48),
        ...PALETTE.slice(16, 32),
        ...PALETTE.slice(48, 64),
        ...PALETTE.slice(0, 16),
    ]
    let best = ordered[0]
    let bestCount = Infinity
    for (const color of ordered) {
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
    const match = color.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/)
    if (!match) return null

    const L = parseFloat(match[1]) / (match[2] ? 100 : 1)
    const C = parseFloat(match[3])
    const h = (parseFloat(match[4]) * Math.PI) / 180
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
