import CostIncomes from "@/components/web/CostIncomes";

export default function Home() {
  return (
    <>
      <CostIncomes isCosts={true} />
      <CostIncomes isCosts={false} />
    </>
  )
}
