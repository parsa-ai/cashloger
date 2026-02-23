import { ChartPieLabelList } from "@/components/web/Chart";
import { DialogBox } from "@/components/web/Dialog";

export default function Home() {
  return (
    <section className="w-full h-full flex flex-col  gap-4">
      <ChartPieLabelList />
      <DialogBox/>
    </section>
  )
}
