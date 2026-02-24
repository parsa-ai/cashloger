import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import CostIncomes from "./CostIncomes"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"

export function ChartTabs() {
  return (
    <Tabs defaultValue="costs" dir={"rtl"}>
      <div className="flex justify-between">
        <TabsList >
          <TabsTrigger value="costs">هزینه ها</TabsTrigger>
          <TabsTrigger value="incomes">درآمد ها</TabsTrigger>
        </TabsList>
        <Link href="/logs" className={buttonVariants({ variant: "outline" })}>
         لاگ این ماه
        </Link>
      </div>
      <TabsContent value="costs">
        <CostIncomes isCosts={true} />
      </TabsContent>
      <TabsContent value="incomes">
        <CostIncomes isCosts={false} />
      </TabsContent>
    </Tabs>
  )
}
