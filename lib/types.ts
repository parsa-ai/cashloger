export interface LogEntry {
    id : string;
    key: string;
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

export interface LogStore {
    logs: YearlyLog[];

    addLog: (entry: LogEntry) => void;
    removeLog: (id: string) => void;
    updateLog: (entry: LogEntry) => void;
}

export interface Category {
    label: string;
    key?: string;
    color?: string;
    fill?: string;
}

export interface ChartItem {
    category: string;
    visitors: number;
    fill: string;
}