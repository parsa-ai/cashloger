"use client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { chartConfig } from "@/lib/chartConfigs"
import { useChartStore } from "@/store/useChartStore"
import { FormEvent, useState } from "react"
import { ButtonGroup } from "../ui/button-group"

export function DialogBox() {
    type ChartKey = Exclude<keyof typeof chartConfig, "visitors">

    const items = Object.entries(chartConfig)
        .filter(([key]) => key !== "visitors") as [ChartKey, (typeof chartConfig)[ChartKey]][]
    const firstKey = items[0][0]

    const [category, setCategory] = useState(firstKey)
    const [amount, setAmount] = useState("")
    const [open, setOpen] = useState(false)

    const chartData = useChartStore((state) => state.chartData)
    const increase = useChartStore((state) => state.increase)
    const decrease = useChartStore((state) => state.decrease)

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        const numericAmount = Number(amount)
        if (!numericAmount || numericAmount <= 0) return
        increase(category, numericAmount)
        setAmount("")
        setOpen(false)
    }
    const handleReset = (e: FormEvent) => {
        e.preventDefault()
        const numericAmount = Number(amount)
        if (!numericAmount || numericAmount <= 0) return
        decrease(category, numericAmount)
        setAmount("")
        setOpen(false)
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">ادیت خرج ها</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit} onReset={handleReset}>
                    <DialogHeader className="my-4 items-center">
                        <DialogTitle>ادیت خرج ها</DialogTitle>
                        <DialogDescription>
                            {"اینجا میتونی خرج یا ورودی جدیدت رو اضافه کنی"}
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup className="gap-5">
                        <Field>
                            <Label htmlFor="amount">مقدار</Label>
                            <Input id="amount" name="amount" type="number" placeholder="۱۰۰۰ تومان"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </Field>
                        <Field>
                            <Label htmlFor="username-1">دسته بندی</Label>
                            <Select name="category" dir="rtl" value={category} onValueChange={(value) => setCategory(value as ChartKey)}>
                                <SelectTrigger className="w-45">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom"
                                    avoidCollisions={false}>
                                    <SelectGroup >
                                        {items.map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                {value.label} {chartData.find((item) => item.browser === key)?.visitors ? `(${chartData.find((item) => item.browser === key)?.visitors})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>
                    <DialogFooter className="mt-7 justify-between sm:justify-between">
                        <ButtonGroup dir="ltr" >
                            <Button type="reset" variant="outline">حذف</Button>
                            <Button type="submit" variant="default">افزودن</Button>
                        </ButtonGroup>
                        <DialogClose asChild>
                            <Button variant="outline">بیخیال</Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
