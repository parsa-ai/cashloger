import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const UNCATEGORIZED_LABEL = "بدون دسته‌بندی"

export function getPersianYearMonth(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find(p => p.type === "year")!.value;
  const month = parts.find(p => p.type === "month")!.value;

  return { year, month };
}

export function formatMoney(value: number) {
  return Math.round(value).toLocaleString("fa-IR")
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
