import { ChartConfig } from "@/components/ui/chart";
import { ChartPieLabelList } from "@/components/web/Chart";

const chartData = [
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
const chartConfig = {
  visitors: {
    label: "Visitors",
  },

  fun: {
    label: "تفریح",
    color: "var(--chart-2)",
  },

  transportation: {
    label: "حمل و نقل",
    color: "var(--chart-3)",
  },

  cloths: {
    label: "پوشاک",
    color: "var(--chart-4)",
  },

  eats: {
    label: "خوراکی",
    color: "var(--chart-5)",
  },

  saveing: {
    label: "پس انداز",
    color: "var(--chart-6)",
  },

  home: {
    label: "خونه",
    color: "var(--chart-7)",
  },

  car: {
    label: "ماشین",
    color: "var(--chart-8)",
  },

  gift: {
    label: "هدیه",
    color: "var(--chart-9)",
  },

  health: {
    label: "سلامتی",
    color: "var(--chart-10)",
  },

  other: {
    label: "سایر",
    color: "var(--chart-1)",
  },


} satisfies ChartConfig


export default function Home() {
  return (
    <>
      <ChartPieLabelList chartConfig={chartConfig} chartData={chartData} />
    </>
  )
}
