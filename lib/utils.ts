import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const UNCATEGORIZED_LABEL = "بدون دسته‌بندی"

// ساختن formatter گران است و برای هر تراکنش صدا زده می‌شود
const persianFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "2-digit",
  day: "numeric",
});

function persianParts(date: Date) {
  const parts = persianFormatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return { year: get("year").replace(/\D/g, ""), month: get("month"), day: Number(get("day")) };
}

export function getPersianYearMonth(date: Date) {
  const { year, month } = persianParts(date);
  return { year, month };
}

export function isSamePersianMonth(a: Date, b: Date) {
  const pa = getPersianYearMonth(a);
  const pb = getPersianYearMonth(b);
  return pa.year === pb.year && pa.month === pb.month;
}

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// روز اول ماه شمسیِ تاریخ داده‌شده (ساعت همان تاریخ حفظ می‌شود)
export function startOfPersianMonth(date: Date) {
  return addDays(date, 1 - persianParts(date).day);
}

// یک ماه شمسی جلو یا عقب، روی روز اول ماه
export function shiftPersianMonth(date: Date, months: number) {
  let result = startOfPersianMonth(date);
  for (let i = 0; i < Math.abs(months); i++) {
    result = months > 0 ? startOfPersianMonth(addDays(result, 32)) : startOfPersianMonth(addDays(result, -1));
  }
  return result;
}

// تاریخ پیش‌فرض تراکنش جدید وقتی کاربر ماه دیگری را نگاه می‌کند:
// ماه جاری ← همین الان، ماه گذشته ← روز آخر آن ماه، ماه آینده ← روز اول آن ماه
export function defaultEntryDate(viewDate: Date) {
  const now = new Date();
  if (isSamePersianMonth(viewDate, now)) return now;
  const start = startOfPersianMonth(viewDate);
  start.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
  if (start > now) return start;
  return addDays(shiftPersianMonth(start, 1), -1);
}

export function formatMoney(value: number) {
  return Math.round(value).toLocaleString("fa-IR")
}

// واحد اصلی همهٔ مبالغ (ورودی، نمایش و ذخیره)
export const MONEY_UNIT = "هزار تومان"

// مبلغ (به هزار تومان) به زبان خودمانی: ۱۲۵۰ ← «۱ میلیون و ۲۵۰ هزار تومان»
export function formatAmountWords(thousands: number) {
  const value = thousands * 1000
  if (value < 1000) return ""
  const units: [number, string][] = [[1e12, "هزار میلیارد"], [1e9, "میلیارد"], [1e6, "میلیون"], [1e3, "هزار"]]
  const parts: string[] = []
  let rest = Math.floor(value)
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

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("fa-IR", { month: "long", year: "numeric" })
}

export function formatDayTitle(date: Date) {
  return date.toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })
}

// لرزش کوتاه برای بازخورد لمسی (روی دستگاه‌هایی که پشتیبانی می‌کنند)
export function haptic(pattern: number | number[] = 8) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // پشتیبانی نمی‌شود
  }
}
