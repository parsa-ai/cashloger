export type LogKind = "cost" | "income";

export interface LogEntry {
    id : string;
    // category id, null when its category was deleted
    key: string | null;
    date: Date;
    visitors: number;
    description?: string;
    mode: "increase" | "decrease";
    // واریز به هدف پس‌انداز (decrease) یا برداشت از آن (increase)؛ این‌ها دسته ندارند
    goal?: string | null;
}
export interface MonthlyLog {
    month: string;
    entries: LogEntry[];
}

export interface YearlyLog {
    year: string;
    months: MonthlyLog[];
}

export interface Category {
    id: string;
    kind: LogKind;
    label: string;
    color: string;
    // بودجهٔ ماهانه (فقط دسته‌های هزینه)؛ null یعنی بدون بودجه
    budget?: number | null;
}

export interface Goal {
    id: string;
    label: string;
    target: number;
    // مبلغی که پیش از ثبت هدف کنار گذاشته شده بود؛ بقیه از تراکنش‌های هدف جمع می‌شود
    saved: number;
    color: string;
    // تاریخ میلادی به شکل YYYY-MM-DD؛ null یعنی بدون موعد
    deadline: string | null;
}

export interface ChartItem {
    id: string;
    category: string;
    visitors: number;
    fill: string;
}
