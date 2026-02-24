import { LogStore } from "@/lib/types";
import { getPersianYearMonth } from "@/lib/utils";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (entry) => {
        const { month, year } = getPersianYearMonth(entry.date);
        set((state) => {
          const logsCopy = [...state.logs];

          let yearIndex = logsCopy.findIndex((y) => y.year === year);

          if (yearIndex === -1) {
            logsCopy.push({
              year,
              months: [
                {
                  month,
                  entries: [entry],
                },
              ],
            });

            return { logs: logsCopy };
          }

          const yearData = logsCopy[yearIndex];
          let monthIndex = yearData.months.findIndex(
            (m) => m.month === month
          );

          if (monthIndex === -1) {
            yearData.months.push({
              month,
              entries: [entry],
            });
          } else {
            yearData.months[monthIndex].entries.push(entry);
          }

          logsCopy[yearIndex] = { ...yearData };

          return { logs: logsCopy };
        });
      },

      removeLog: (id) => {
        set((state) => {
          const logsCopy = state.logs
            .map((year) => ({
              ...year,
              months: year.months
                .map((month) => ({
                  ...month,
                  entries: month.entries.filter((entry) => entry.id !== id),
                }))
                .filter((month) => month.entries.length > 0),
            }))
            .filter((year) => year.months.length > 0);

          return { logs: logsCopy };
        });
      },

      updateLog: (updatedEntry) => {
        const { year, month } = getPersianYearMonth(updatedEntry.date);

        set((state) => {
          // اول حذف نسخه قبلی
          let logsCopy = state.logs
            .map((yearData) => ({
              ...yearData,
              months: yearData.months.map((monthData) => ({
                ...monthData,
                entries: monthData.entries.filter(
                  (entry) => entry.id !== updatedEntry.id
                ),
              })),
            }));

          // پاکسازی ماه و سال خالی
          logsCopy = logsCopy
            .map((yearData) => ({
              ...yearData,
              months: yearData.months.filter((m) => m.entries.length > 0),
            }))
            .filter((y) => y.months.length > 0);

          // حالا دوباره طبق تاریخ جدید اضافه می‌کنیم
          let yearIndex = logsCopy.findIndex((y) => y.year === year);

          if (yearIndex === -1) {
            logsCopy.push({
              year,
              months: [
                {
                  month,
                  entries: [updatedEntry],
                },
              ],
            });

            return { logs: logsCopy };
          }

          const yearData = logsCopy[yearIndex];
          let monthIndex = yearData.months.findIndex(
            (m) => m.month === month
          );

          if (monthIndex === -1) {
            yearData.months.push({
              month,
              entries: [updatedEntry],
            });
          } else {
            yearData.months[monthIndex].entries.push(updatedEntry);
          }

          logsCopy[yearIndex] = { ...yearData };

          return { logs: logsCopy };
        });
      },
    }),
    {
      name: "visitor-log-storage",
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        logs: state.logs,
      }),

      onRehydrateStorage: () => (state) => {
        if (!state) return;

        state.logs = state.logs.map((year) => ({
          ...year,
          months: year.months.map((month) => ({
            ...month,
            entries: month.entries.map((entry) => ({
              ...entry,
              date: new Date(entry.date),
            })),
          })),
        }));
      },
    }
  )
);