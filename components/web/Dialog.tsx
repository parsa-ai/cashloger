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
import { useState } from "react"

export function DialogBox() {
    type ChartKey = Exclude<keyof typeof chartConfig, "visitors">

    const items = Object.entries(chartConfig)
        .filter(([key]) => key !== "visitors") as [ChartKey, (typeof chartConfig)[ChartKey]][]
    const firstKey = items[0][0]

    const [category, setCategory] = useState(firstKey)
    const [amount, setAmount] = useState("")
    const increase = useChartStore((state) => state.increase)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log(amount, category);
        const numericAmount = Number(amount)
        if (!numericAmount || numericAmount <= 0) return
        increase(category, numericAmount)
        setAmount("")
    }
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">ادیت خرج ها</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>ادیت خرج ها</DialogTitle>
                        <DialogDescription>
                            {"اینجا میتونی خرج یا ورودی جدیدت رو اضافه کنی"}
                        </DialogDescription>
                    </DialogHeader>
                    <FieldGroup className="gap-4">
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
                                        {
                                            items.map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value.label}
                                                </SelectItem>
                                            ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline">بیخیال</Button>
                        </DialogClose>
                        <Button type="submit">ذخیره تغییرات</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
