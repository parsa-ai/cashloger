"use client"

import { SubmitEvent, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { chartConfig } from "@/lib/chartConfigs"
import { getPersianYearMonth } from "@/lib/utils"

import { useLogStore } from "@/store/useChartStore"
import useDateStore from "@/store/useYearStore"

export function DialogBox({ isCosts = true }: { isCosts?: boolean }) {
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

    const date = useDateStore((s) => s.date) || new Date()

    const { month } = getPersianYearMonth(date)
    const monthData = logs.find(log => log.year === getPersianYearMonth(date).year)?.months.find(m => m.month === month)

    const categoryTotals = useMemo(() => {
        const totals: Record<string, number> = {}

        monthData?.entries.forEach((entry) => {
            if (!totals[entry.key]) {
                totals[entry.key] = 0
            }
            if (isCosts && entry.mode === "decrease") {
                totals[entry.key] += entry.visitors
            }
            if (!isCosts && entry.mode === "increase") {
                totals[entry.key] += entry.visitors
            }
        })
        return totals
    }, [logs, date])

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault()
        const numericAmount = Number(amount)
        if (!numericAmount || numericAmount <= 0) return

        addLog({
            id: crypto.randomUUID(),
            key: category,
            date: date || new Date(),
            visitors: numericAmount,
            description,
            mode: isCosts ? "decrease" : "increase",
        })

        setAmount("")
        setDescription("")
        setOpen(false)
    }


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">افزودن {isCosts ? "هزینه" : "درآمد"} جدید</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-sm">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="my-4 items-center">
                        <DialogTitle>افزودن {isCosts ? "هزینه" : "درآمد"} جدید</DialogTitle>
                        <DialogDescription>
                            اینجا میتونی {isCosts ? "هزینه" : "درآمد"} جدیدت رو اضافه کنی
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
                                placeholder="چیکار کردی پولاتو ؟"
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                            />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-7">
                        <Button type="submit" variant="default" className="w-full">
                            افزودن {isCosts ? "هزینه" : "درآمد"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}