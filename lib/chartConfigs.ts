import { ChartConfig } from "@/components/ui/chart";
import { categories, categoriesIncome } from "@/lib/data";
import { convertToChartConfig } from "@/lib/utils";

const chartConfig = convertToChartConfig(categories) satisfies ChartConfig
const chartConfigIncome = convertToChartConfig(categoriesIncome) satisfies ChartConfig

export { chartConfig, chartConfigIncome }
