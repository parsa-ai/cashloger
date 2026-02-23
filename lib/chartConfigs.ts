import { ChartConfig } from "@/components/ui/chart";
import { categories } from "@/lib/data";
import { convertToChartConfig } from "@/lib/utils";

const chartConfig = convertToChartConfig(categories) satisfies ChartConfig

export { chartConfig }
