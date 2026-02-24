import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { EyeClosedIcon, EyeIcon } from "lucide-react"

const initDis = " اینجا می‌تونی توضیحات کامل تراکنش رو ببینی. اگر توضیحی اضافه شده باشه، اینجا نمایش داده میشه. اگر هم چیزی اضافه نشده باشه، این پیام رو می‌بینی."

export function LogDetailsDialog({ cat = "توضیحات", DialogDescriptionText = initDis }: { cat?: string, DialogDescriptionText?: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="size-10">
                    {DialogDescriptionText === initDis ?
                        <EyeClosedIcon /> :
                        <EyeIcon />
                    }
                </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" showCloseButton={false}>
                <DialogHeader >
                    <DialogTitle className="text-right">{cat}</DialogTitle>
                    <DialogDescription className="text-right no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
                        {DialogDescriptionText}
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
