import { LogStore } from "@/lib/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: (entry) => {
        const year = entry.date.getFullYear().toString();
        const month = (entry.date.getMonth() + 1).toString().padStart(2, "0");

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

      clearLogs: () => set({ logs: [] }),
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