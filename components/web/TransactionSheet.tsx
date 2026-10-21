"use client"

import { SubmitEvent, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { LogEntry, LogKind } from "@/lib/types"
import { cn, formatDayTitle, haptic } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"

// تبدیل ارقام فارسی/عربی به انگلیسی و حذف جداکننده‌ها
function parseAmount(text: string) {
    const ascii = text
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[^\d]/g, "")
    return ascii ? Number(ascii) : 0
}

interface TransactionSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    kind: LogKind
    date: Date
    // اگر داده شود، فرم در حالت ویرایش است
    entry?: LogEntry
}

export function TransactionSheet(props: TransactionSheetProps) {
    // با هر بار باز شدن، فرم از نو ساخته می‌شود (ولی موقع بسته شدن محتوا تا آخر انیمیشن می‌ماند)
    const [prevOpen, setPrevOpen] = useState(props.open)
    const [formKey, setFormKey] = useState(0)
    if (props.open !== prevOpen) {
        setPrevOpen(props.open)
        if (props.open) setFormKey((k) => k + 1)
    }

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent>
                <TransactionForm key={formKey} {...props} />
            </DialogContent>
        </Dialog>
    )
}

function TransactionForm({ onOpenChange, kind: initialKind, date, entry }: TransactionSheetProps) {
    const kind: LogKind = entry ? (entry.mode === "increase" ? "income" : "cost") : initialKind
    const isCost = kind === "cost"
    const noun = isCost ? "هزینه" : "درآمد"

    const allCategories = useLogStore((s) => s.categories)
    const addLog = useLogStore((s) => s.addLog)
    const updateLog = useLogStore((s) => s.updateLog)
    const removeLog = useLogStore((s) => s.removeLog)

    const items = useMemo(() => allCategories.filter((c) => c.kind === kind), [allCategories, kind])

    const [amount, setAmount] = useState(entry ? entry.visitors : 0)
    const [selected, setSelected] = useState<string | null>(entry ? entry.key : null)
    const [description, setDescription] = useState(entry?.description ?? "")
    const [confirmDelete, setConfirmDelete] = useState(false)

    const category = selected && items.some((c) => c.id === selected) ? selected : entry ? null : items[0]?.id ?? null

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault()
        if (amount <= 0) return

        const data = {
            key: category,
            visitors: amount,
            description: description.trim() || undefined,
            mode: (isCost ? "decrease" : "increase") as LogEntry["mode"],
        }
        if (entry) {
            updateLog({ ...entry, ...data })
            toast(`${noun} ویرایش شد`, "success")
        } else {
            addLog({ ...data, date })
            toast(`${noun} ثبت شد`, "success")
        }
        haptic([10, 40, 10])
        onOpenChange(false)
    }

    const handleDelete = () => {
        if (!entry) return
        if (!confirmDelete) {
            setConfirmDelete(true)
            haptic()
            return
        }
        removeLog(entry.id)
        toast("تراکنش حذف شد")
        onOpenChange(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
                <DialogTitle>{entry ? `ویرایش ${noun}` : `${noun} جدید`}</DialogTitle>
                <DialogDescription>{formatDayTitle(entry?.date ?? date)}</DialogDescription>
            </DialogHeader>

            <label className="block rounded-3xl bg-muted px-4 py-5 text-center">
                <span className="sr-only">مبلغ</span>
                <input
                    autoFocus={!entry}
                    inputMode="numeric"
                    required
                    value={amount ? amount.toLocaleString("fa-IR") : ""}
                    onChange={(e) => setAmount(parseAmount(e.target.value))}
                    placeholder="۰"
                    className={cn(
                        "w-full bg-transparent text-center text-4xl font-extrabold tabular-nums outline-none placeholder:text-muted-foreground/40",
                        isCost ? "text-foreground" : "text-success"
                    )}
                />
                <span className="text-sm text-muted-foreground">تومان</span>
            </label>

            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-medium text-muted-foreground">دسته‌بندی</span>
                    <Link
                        href="/categories"
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-1 text-xs font-medium text-primary"
                    >
                        <Plus className="size-3.5" />
                        مدیریت دسته‌ها
                    </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                    {items.map((item, i) => {
                        const active = item.id === category
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    haptic()
                                    setSelected(item.id)
                                }}
                                className={cn(
                                    "pressable stagger flex h-9 animate-item-in items-center gap-2 rounded-full border px-3 text-sm transition-colors duration-300",
                                    active ? "border-transparent font-semibold text-white" : "bg-card"
                                )}
                                style={{
                                    "--i": i,
                                    backgroundColor: active ? item.color : undefined,
                                } as React.CSSProperties}
                            >
                                {!active && <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />}
                                {item.label}
                            </button>
                        )
                    })}
                    {items.length === 0 && (
                        <p className="text-sm text-muted-foreground">هنوز دسته‌بندی‌ای نساختی.</p>
                    )}
                </div>
            </div>

            <Textarea
                placeholder={isCost ? "چیکار کردی پولاتو؟" : "از کجا رسید؟"}
                className="max-h-28"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex gap-2 pb-2">
                {entry && (
                    <Button
                        type="button"
                        variant={confirmDelete ? "destructive" : "secondary"}
                        size="lg"
                        onClick={handleDelete}
                        className={cn("transition-all duration-300", confirmDelete ? "flex-1" : "w-12 px-0")}
                        aria-label="حذف"
                    >
                        <Trash2 />
                        {confirmDelete && <span className="animate-item-in">مطمئنی؟ حذف کن</span>}
                    </Button>
                )}
                <Button type="submit" size="lg" className="flex-1" disabled={amount <= 0}>
                    {entry ? "ذخیره تغییرات" : `ثبت ${noun}`}
                </Button>
            </div>
        </form>
    )
}
