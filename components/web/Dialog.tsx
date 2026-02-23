"use client"

import { FormEvent, useMemo, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { ButtonGroup } from "@/components/ui/button-group"
import { chartConfig } from "@/lib/chartConfigs"
import { useLogStore } from "@/store/useChartStore"

export function DialogBox() {
    type ChartKey = Exclude<keyof typeof chartConfig, "visitors">

    const items = Object.entries(chartConfig)
        .filter(([key]) => key !== "visitors") as [
            ChartKey,
            (typeof chartConfig)[ChartKey]
        ][]

    const firstKey = items[0][0]

    const [category, setCategory] = useState<ChartKey>(firstKey)
    const [amount, setAmount] = useState("")
    const [description, setDescription] = useState("")
    const [open, setOpen] = useState(false)

    const logs = useLogStore((s) => s.logs)
    const addLog = useLogStore((s) => s.addLog)

    /**
     * محاسبه مجموع هر دسته برای نمایش کنار SelectItem
     */
    const categoryTotals = useMemo(() => {
        const totals: Record<string, number> = {}

        logs.forEach((year) => {
            year.months.forEach((month) => {
                month.entries.forEach((entry) => {
                    if (!totals[entry.key]) {
                        totals[entry.key] = 0
                    }

                    totals[entry.key] +=
                        entry.mode === "increase"
                            ? entry.visitors
                            : -entry.visitors
                })
            })
        })

        return totals
    }, [logs])

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        const numericAmount = Number(amount)
        if (!numericAmount || numericAmount <= 0) return

        addLog({
            key: category, 
            date: new Date(),
            visitors: numericAmount,
            description,
            mode : "increase", 
        })

        setAmount("")
        setDescription("")
        setOpen(false)
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">ادیت خرج ها</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="my-4 items-center">
                        <DialogTitle>افزودن خرج ها</DialogTitle>
                        <DialogDescription>
                            اینجا میتونی خرج جدیدت رو اضافه کنی
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup className="gap-5">
                        <Field>
                            <Label htmlFor="amount">مقدار*</Label>
                            <Input
                                id="amount"
                                type="number"
                                required
                                placeholder="۱۰۰ تومان"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </Field>

                        <Field>
                            <Label>دسته بندی*</Label>
                            <Select
                                required
                                dir="rtl"
                                value={category}
                                onValueChange={(value) =>
                                    setCategory(value as ChartKey)
                                }
                            >
                                <SelectTrigger className="w-45">
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent
                                    position="popper"
                                    side="bottom"
                                    avoidCollisions={false}
                                >
                                    <SelectGroup>
                                        {items.map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                {value.label}
                                                {categoryTotals[key]
                                                    ? ` (${categoryTotals[key]})`
                                                    : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <Label htmlFor="description">توضیحات</Label>
                            <Textarea
                                id="description"
                                placeholder="توضیحات خرج ها"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                            />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-7 justify-between sm:justify-between">
                        <ButtonGroup dir="ltr">
                            <Button type="submit" variant="default">
                                افزودن خرج
                            </Button>
                        </ButtonGroup>

                        <DialogClose asChild>
                            <Button variant="outline">بیخیال</Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}