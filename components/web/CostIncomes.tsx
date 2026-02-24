import { ChartPieLabelList } from "@/components/web/Chart";
import { DialogBox } from "@/components/web/Dialog";

function CostIncomes({isCosts = true}: {isCosts?: boolean}) {
    return (
        <section className="w-full h-full flex flex-col  gap-4">
            <ChartPieLabelList isCosts={isCosts} />
            <DialogBox isCosts={isCosts} />
        </section>
    )
}

export default CostIncomes