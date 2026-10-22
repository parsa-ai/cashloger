import { SWATCHES } from "@/lib/palette"
import { LogKind } from "@/lib/types"

export interface BaseCategory {
    kind: LogKind
    label: string
    color: string
}

const swatch = (i: number) => SWATCHES[i % SWATCHES.length]

// دسته‌های پایه‌ای که کاربر جدید در خوش‌آمدگویی از بینشان انتخاب می‌کند
export const BASE_CATEGORIES: BaseCategory[] = [
    { kind: "cost", label: "خوراکی", color: swatch(4) },
    { kind: "cost", label: "خونه", color: swatch(7) },
    { kind: "cost", label: "قبوض", color: swatch(3) },
    { kind: "cost", label: "حمل و نقل", color: swatch(6) },
    { kind: "cost", label: "خرید", color: swatch(10) },
    { kind: "cost", label: "تفریح", color: swatch(2) },
    { kind: "cost", label: "سلامتی", color: swatch(0) },
    { kind: "cost", label: "پوشاک", color: swatch(11) },
    { kind: "cost", label: "ماشین", color: swatch(9) },
    { kind: "cost", label: "آموزش", color: swatch(8) },
    { kind: "cost", label: "هدیه", color: swatch(1) },
    { kind: "cost", label: "سایر", color: swatch(5) },
    { kind: "income", label: "حقوق", color: swatch(4) },
    { kind: "income", label: "فریلنسری", color: swatch(7) },
    { kind: "income", label: "فروش", color: swatch(1) },
    { kind: "income", label: "پاداش", color: swatch(3) },
    { kind: "income", label: "سرمایه‌گذاری", color: swatch(5) },
    { kind: "income", label: "اجاره", color: swatch(9) },
    { kind: "income", label: "هدیه", color: swatch(11) },
    { kind: "income", label: "سایر", color: swatch(0) },
]

export const MIN_ONBOARDING_CATEGORIES = 3
