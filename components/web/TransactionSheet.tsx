"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { CalendarDays, Delete, PencilLine, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogNav } from "@/components/ui/dialog"
import { CategoryAvatar } from "@/components/web/Avatars"
import { PersianCalendar } from "@/components/web/PersianCalendar"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { LogEntry, LogKind } from "@/lib/types"
import { addDays, cn, defaultEntryDate, formatAmountWords, haptic, isSameDay } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"
import { useUiStore } from "@/store/useUiStore"
import useDateStore from "@/store/useYearStore"

const MAX_DIGITS = 12
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const

// شیت سراسری ثبت و ویرایش تراکنش (دکمهٔ + در نوار تب بازش می‌کند)
export function TransactionSheetHost() {
    const open = useUiStore((s) => s.sheetOpen)
    const setOpen = useUiStore((s) => s.setSheetOpen)
    const sheetKey = useUiStore((s) => s.sheetKey)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <TransactionForm key={sheetKey} />
            </DialogContent>
        </Dialog>
    )
}

function shortDay(date: Date) {
    const today = new Date()
    if (isSameDay(date, today)) return "امروز"
    if (isSameDay(date, addDays(today, -1))) return "دیروز"
    return date.toLocaleDateString("fa-IR", { weekday: "short", day: "numeric", month: "short" })
}

function Keypad({ onKey }: { onKey: (key: (typeof KEYS)[number] | "clear") => void }) {
    const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

    return (
        <div dir="ltr" className="grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
                <button
                    key={key}
                    type="button"
                    aria-label={key === "back" ? "پاک کردن" : undefined}
                    onClick={() => onKey(key)}
                    // نگه داشتن دکمهٔ پاک کردن، کل مبلغ را پاک می‌کند
                    onPointerDown={() => {
                        if (key !== "back") return
                        holdTimer.current = setTimeout(() => {
                            holdTimer.current = undefined
                            onKey("clear")
                        }, 500)
                    }}
                    onPointerUp={() => clearTimeout(holdTimer.current)}
                    onPointerLeave={() => clearTimeout(holdTimer.current)}
                    className={cn(
                        "num grid h-[52px] place-items-center rounded-xl text-[24px] font-medium transition-colors duration-200 active:bg-fill-strong active:duration-0",
                        key === "back" ? "text-foreground/70" : "bg-card"
                    )}
                >
                    {key === "back" ? <Delete className="size-6" /> : Number(key).toLocaleString("fa-IR", { minimumIntegerDigits: key.length })}
                </button>
            ))}
        </div>
    )
}

function TransactionForm() {
    const entry = useUiStore((s) => s.editing) ?? undefined
    const addKind = useUiStore((s) => s.addKind)
    const setOpen = useUiStore((s) => s.setSheetOpen)
    const viewDate = useDateStore((s) => s.date) || new Date()

    const allCategories = useLogStore((s) => s.categories)
    const allEntries = useLogStore((s) => s.entries)
    const addLog = useLogStore((s) => s.addLog)
    const updateLog = useLogStore((s) => s.updateLog)
    const removeLog = useLogStore((s) => s.removeLog)

    const [kind, setKind] = useState<LogKind>(entry ? (entry.mode === "increase" ? "income" : "cost") : addKind)
    const [digits, setDigits] = useState(entry ? String(entry.visitors) : "")
    const [selected, setSelected] = useState<string | null>(entry ? entry.key : null)
    const [date, setDate] = useState(() => entry?.date ?? defaultEntryDate(viewDate))
    const [description, setDescription] = useState(entry?.description ?? "")
    const [panel, setPanel] = useState<"keypad" | "date">("keypad")

    const amount = digits ? Number(digits) : 0
    const isCost = kind === "cost"
    const noun = isCost ? "هزینه" : "درآمد"

    // دسته‌های پرکاربردتر اول؛ اولی پیش‌فرض تراکنش جدید است
    const items = useMemo(() => {
        const counts = new Map<string, number>()
        for (const e of allEntries) if (e.key) counts.set(e.key, (counts.get(e.key) ?? 0) + 1)
        return allCategories
            .filter((c) => c.kind === kind)
            .map((c, i) => ({ c, i, n: counts.get(c.id) ?? 0 }))
            .sort((a, b) => b.n - a.n || a.i - b.i)
            .map(({ c }) => c)
    }, [allCategories, allEntries, kind])

    const category = selected && items.some((c) => c.id === selected) ? selected : entry && kind === (entry.mode === "increase" ? "income" : "cost") ? null : items[0]?.id ?? null


    const close = () => setOpen(false)

    const pressKey = (key: (typeof KEYS)[number] | "clear") => {
        haptic(5)
        setDigits((d) => {
            if (key === "clear") return ""
            if (key === "back") return d.slice(0, -1)
            if (!d && (key === "0" || key === "000")) return d
            return (d + key).slice(0, MAX_DIGITS)
        })
    }

    const submit = () => {
        if (amount <= 0) {
            haptic([20, 30, 20])
            return
        }
        const data = {
            key: category,
            visitors: amount,
            date,
            description: description.trim() || undefined,
            mode: (isCost ? "decrease" : "increase") as LogEntry["mode"],
        }
        if (entry) {
            const previous = entry
            updateLog({ ...entry, ...data })
            toast(`${noun} ویرایش شد`, "success", { label: "برگرداندن", onClick: () => updateLog(previous) })
        } else {
            const id = addLog(data)
            toast(`${noun} ثبت شد`, "success", { label: "برگرداندن", onClick: () => removeLog(id) })
        }
        haptic([10, 40, 10])
        close()
    }

    const handleDelete = () => {
        if (!entry) return
        const removed = entry
        removeLog(entry.id)
        haptic([10, 40, 10])
        toast("تراکنش حذف شد", "default", { label: "برگرداندن", onClick: () => updateLog(removed) })
        close()
    }

    // کیبورد فیزیکی (دسکتاپ): عدد، پاک کردن و Enter
    const submitRef = useRef(submit)
    const keyRef = useRef(pressKey)
    useEffect(() => {
        submitRef.current = submit
        keyRef.current = pressKey
    })
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).closest("input, textarea")) return
            const digit = e.key.replace(/[۰-۹]/, (d) => String(d.charCodeAt(0) - 0x06f0))
            if (/^\d$/.test(digit)) keyRef.current(digit as (typeof KEYS)[number])
            else if (e.key === "Backspace") keyRef.current("back")
            else if (e.key === "Enter") submitRef.current()
            else return
            e.preventDefault()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    const words = formatAmountWords(amount)

    return (
        <>
            <DialogNav
                title={entry ? `ویرایش ${noun}` : `${noun} جدید`}
                action={
                    entry && (
                        <Button type="button" variant="plain" size="nav" className="text-destructive" aria-label="حذف تراکنش" onClick={handleDelete}>
                            <Trash2 className="size-5" />
                        </Button>
                    )
                }
            />

            <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-3">
                <SegmentedControl
                    size="lg"
                    value={kind}
                    onChange={(k) => {
                        setKind(k)
                        setSelected(null)
                    }}
                    options={[
                        { value: "cost", label: "هزینه" },
                        { value: "income", label: "درآمد" },
                    ]}
                />

                {/* مبلغ؛ لمسش صفحه‌کلید اعداد را برمی‌گرداند */}
                <button type="button" onClick={() => setPanel("keypad")} className="flex flex-col items-center py-1">
                    <span
                        className={cn(
                            "num flex items-baseline gap-1.5 text-[40px] leading-tight font-bold",
                            !amount && "text-muted-foreground/40",
                            amount > 0 && !isCost && "text-success"
                        )}
                    >
                        {amount ? amount.toLocaleString("fa-IR") : "۰"}
                        <span className="text-[15px] font-medium text-muted-foreground">تومان</span>
                    </span>
                    <span className="h-5 text-[13px] text-muted-foreground">{words && `${words} تومان`}</span>
                </button>

                {/* دسته‌ها: تراشه با اسم کامل، پرکاربردها اول */}
                <div className="no-scrollbar -mx-1 flex max-h-[136px] flex-wrap gap-2 overflow-y-auto px-1 py-0.5">
                    {items.map((item) => {
                        const active = item.id === category
                        return (
                            <button
                                key={item.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => {
                                    if (!active) haptic()
                                    setSelected(item.id)
                                }}
                                className={cn(
                                    "press flex h-10 items-center gap-2 rounded-full ps-1 pe-3.5 text-[14px] transition-[background-color,color,box-shadow] duration-200",
                                    active ? "bg-tint font-semibold text-primary ring-[1.5px] ring-primary" : "bg-card"
                                )}
                            >
                                <CategoryAvatar label={item.label} color={item.color} size={32} />
                                {item.label}
                            </button>
                        )
                    })}
                    <Link
                        href="/categories"
                        onClick={close}
                        className="press flex h-10 items-center gap-1.5 rounded-full border border-dashed border-primary/40 px-3.5 text-[14px] text-primary"
                    >
                        <Plus className="size-4" />
                        دسته جدید
                    </Link>
                </div>

                {/* تاریخ و توضیح */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            haptic()
                            setPanel((p) => (p === "date" ? "keypad" : "date"))
                        }}
                        aria-expanded={panel === "date"}
                        className={cn(
                            "press flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors duration-200",
                            panel === "date" ? "bg-primary text-primary-foreground" : "bg-card"
                        )}
                    >
                        <CalendarDays className="size-[18px]" />
                        <span key={date.toDateString()} className="animate-fade-in">{shortDay(date)}</span>
                    </button>
                    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-card px-4">
                        <PencilLine className="size-4 shrink-0 text-muted-foreground" />
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onFocus={() => setPanel("keypad")}
                            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                            placeholder="توضیح (اختیاری)"
                            maxLength={500}
                            enterKeyHint="done"
                            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                        />
                    </label>
                </div>

                {/* صفحه‌کلید اعداد یا تقویم، جای هم */}
                {panel === "date" ? (
                    <PersianCalendar
                        value={date}
                        onChange={(d) => {
                            setDate(d)
                            setPanel("keypad")
                        }}
                    />
                ) : (
                    <Keypad onKey={pressKey} />
                )}

                <Button size="lg" className="w-full" disabled={amount <= 0} onClick={submit}>
                    {entry ? "ذخیره تغییرات" : `ثبت ${noun}`}
                </Button>
            </div>
        </>
    )
}
