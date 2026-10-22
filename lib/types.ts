export type LogKind = "cost" | "income";

export interface LogEntry {
    id : string;
    // category id, null when its category was deleted
    key: string | null;
    date: Date;
    visitors: number;
    description?: string;
    mode: "increase" | "decrease";
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

export interface ChartItem {
    id: string;
    category: string;
    visitors: number;
    fill: string;
}
