import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Category, ChartItem, MonthlyLog } from "@/lib/types";
import { ChartConfig } from "@/components/ui/chart";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertToChartConfig(categories: Category[]) {
  const result: ChartConfig = {};
  categories.forEach(item => {
    if (item.key) {
      result[item.key] = {
        label: item.label,
        color: item.color || undefined
      };
    }
  });
  return result;
}

export function convertToChartItem(monthlyLog: MonthlyLog, categories: Category[]): ChartItem[] {
  const chartItems: ChartItem[] = [];
  categories.forEach(category => {
    let totalVisitors = 0;
    const fill = category.fill || category.key ? `var(--color-${category.key})` : "var(--color-default)";
    monthlyLog.entries.forEach(entry => {
      if (entry.key === category.key) {
        totalVisitors += entry.visitors;
      }
    });
    chartItems.push({
      category: category.label,
      visitors: totalVisitors,
      fill: fill
    });
  });
  return chartItems;
}

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