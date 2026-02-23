import { ChartConfig } from "@/components/ui/chart";

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

export { chartConfig }
