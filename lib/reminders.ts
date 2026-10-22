// ساعت‌های یادآوری به صورت «دقیقه از نیمه‌شب» نگه داشته می‌شوند (۲۱:۰۰ ← ۱۲۶۰)

export const MAX_REMINDERS = 4
export const DEFAULT_TIMEZONE = "Asia/Tehran"
// یادآوری تا این چند دقیقه بعد از ساعتش هنوز فرستاده می‌شود (کرون هر ۵ دقیقه اجرا می‌شود)
export const REMINDER_WINDOW = 30

export const REMINDER_PRESETS = [13 * 60, 18 * 60, 21 * 60, 23 * 60]
export const DEFAULT_REMINDERS = [21 * 60]

const two = (n: number) => n.toLocaleString("fa-IR", { minimumIntegerDigits: 2, useGrouping: false })

export function formatTime(minutes: number) {
    return `${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`
}

export function formatTimes(times: number[]) {
    return [...times].sort((a, b) => a - b).map(formatTime).join("، ")
}

export function deviceTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE
    } catch {
        return DEFAULT_TIMEZONE
    }
}

// دقیقهٔ فعلی روز در منطقهٔ زمانی کاربر
export function minutesIn(timezone: string, date = new Date()) {
    const format = (timeZone: string) =>
        new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date)
    let parts
    try {
        parts = format(timezone)
    } catch {
        parts = format(DEFAULT_TIMEZONE)
    }
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
    return get("hour") * 60 + get("minute")
}

// آیا یکی از ساعت‌ها در همین پنجره رسیده؟ (از نیمه‌شب هم رد می‌شود: ۲۳:۵۰ تا ۰۰:۲۰)
export function isDue(times: number[], now: number) {
    return times.some((t) => (now - t + 1440) % 1440 < REMINDER_WINDOW)
}

const MESSAGES = [
    "امروز چی خرج کردی؟ یه دقیقه وقت بذار ثبتش کن.",
    "خرج و دخل امروز رو ثبت کردی؟",
    "قبل از اینکه یادت بره، تراکنش‌های امروز رو بنویس.",
    "حساب امروز رو ببند؛ چند ثانیه بیشتر طول نمی‌کشه.",
]

export function reminderMessage() {
    return {
        title: "کش لاگر",
        body: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        url: "/?add=1",
    }
}
