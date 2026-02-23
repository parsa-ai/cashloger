
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

type ChartItem = {
  browser: string
  visitors: number
  fill: string
}

type ChartStore = {
  chartData: ChartItem[]
  increase: (browser: string, amount?: number) => void
  decrease: (browser: string, amount?: number) => void
  reset: () => void
}

const initialData: ChartItem[] = [
  { browser: "fun", visitors: 0, fill: "var(--color-fun)" },
  { browser: "transportation", visitors: 0, fill: "var(--color-transportation)" },
  { browser: "cloths", visitors: 0, fill: "var(--color-cloths)" },
  { browser: "eats", visitors: 0, fill: "var(--color-eats)" },
  { browser: "saveing", visitors: 0, fill: "var(--color-saveing)" },
  { browser: "home", visitors: 0, fill: "var(--color-home)" },
  { browser: "car", visitors: 0, fill: "var(--color-car)" },
  { browser: "gift", visitors: 0, fill: "var(--color-gift)" },
  { browser: "health", visitors: 0, fill: "var(--color-health)" },
  { browser: "other", visitors: 0, fill: "var(--color-other)" },
]

export const useChartStore = create<ChartStore>()(
  persist(
    (set) => ({
      chartData: initialData,

      increase: (browser, amount = 1) =>
        set((state) => ({
          chartData: state.chartData.map((item) =>
            item.browser === browser
              ? { ...item, visitors: item.visitors + amount }
              : item
          ),
        })),

      decrease: (browser, amount = 1) =>
        set((state) => ({
          chartData: state.chartData.map((item) =>
            item.browser === browser
              ? {
                  ...item,
                  visitors: Math.max(0, item.visitors - amount),
                }
              : item
          ),
        })),

      reset: () => set({ chartData: initialData }),
    }),
    {
      name: "chart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)