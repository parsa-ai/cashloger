"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { CalendarDays, Delete, PencilLine, Plus, Trash2 } from "lucide-react"
import { Popover } from "radix-ui"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogNav } from "@/components/ui/dialog"
import { PersianCalendar } from "@/components/web/PersianCalendar"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { navigate } from "@/lib/nav"
import { UNCATEGORIZED_COLOR } from "@/lib/palette"
import { LogEntry, LogKind } from "@/lib/types"
import { addDays, cn, defaultEntryDate, formatAmountWords, haptic, isSameDay } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"
import { useUiStore } from "@/store/useUiStore"
import useDateStore from "@/store/useYearStore"

const MAX_DIGITS = 12
const NONE = ""

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

// ارقام فارسی و عربی را به انگلیسی برمی‌گرداند
function toLatinDigits(text: string) {
    return text.replace(/[۰-۹٠-٩]/g, (d) => String(d.charCodeAt(0) - (d >= "۰" ? 0x06f0 : 0x0660)))
}

// افزودن رقم به مبلغ: صفر اول نمی‌گیرد و از سقف رقم‌ها رد نمی‌شود
function pushDigits(digits: string, add: string) {
    return (digits + add).replace(/^0+/, "").slice(0, MAX_DIGITS)
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"] as const

// صفحه‌کلید عددی؛ چیدمان مثل ماشین‌حساب گوشی (۱ بالا چپ)
function Numpad({ onKey }: { onKey: (key: (typeof KEYS)[number]) => void }) {
    return (
        <div dir="ltr" className="grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
                <button
                    key={key}
                    type="button"
                    aria-label={key === "back" ? "پاک کردن" : undefined}
                    onClick={() => {
                        haptic(4)
                        onKey(key)
                    }}
                    className="press num grid h-[52px] place-items-center rounded-xl bg-card text-[24px] font-medium select-none"
                >
                    {key === "back" ? (
                        <Delete className="size-6 text-muted-foreground" />
                    ) : (
                        Number(key).toLocaleString("fa-IR", { minimumIntegerDigits: key.length, useGrouping: false })
                    )}
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
    const [calendarOpen, setCalendarOpen] = useState(false)

    const amount = digits ? Number(digits) : 0
    const isCost = kind === "cost"
    const noun = isCost ? "هزینه" : "درآمد"
    const entryKind = entry ? (entry.mode === "increase" ? "income" : "cost") : null

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

    const category =
        selected && items.some((c) => c.id === selected)
            ? selected
            : entry && kind === entryKind
              ? null
              : items[0]?.id ?? null

    // تراکنش بی‌دسته‌ای که ویرایش می‌شود، گزینهٔ «بدون دسته» هم دارد
    const chips = useMemo(
        () =>
            entry && !entry.key && kind === entryKind
                ? [{ id: NONE, label: "بدون دسته", color: UNCATEGORIZED_COLOR }, ...items]
                : items,
        [entry, entryKind, items, kind]
    )

    const close = () => setOpen(false)

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

    const pressKey = (key: (typeof KEYS)[number]) => {
        if (key === "back") setDigits((d) => d.slice(0, -1))
        else setDigits((d) => pushDigits(d, key))
    }

    // روی دسکتاپ با کیبورد هم می‌شود مبلغ را زد
    const submitRef = useRef(submit)
    useLayoutEffect(() => {
        submitRef.current = submit
    })
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement
            if (target.closest("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return
            const key = toLatinDigits(e.key)
            if (/^\d$/.test(key)) setDigits((d) => pushDigits(d, key))
            else if (e.key === "Backspace") setDigits((d) => d.slice(0, -1))
            else if (e.key === "Enter" && !target.closest("button")) submitRef.current()
            else return
            e.preventDefault()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    // دستهٔ انتخاب‌شده همیشه در دید باشد
    const chipsRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        chipsRef.current
            ?.querySelector<HTMLElement>("[aria-pressed=true]")
            ?.scrollIntoView({ block: "nearest", inline: "nearest" })
    }, [category])

    const words = formatAmountWords(amount)

    return (
        <>
            <DialogNav
                title={entry ? `ویرایش ${noun}` : `${noun} جدید`}
                action={
                    <Button type="button" size="sm" className="h-9 rounded-full px-4 text-[15px]" disabled={amount <= 0} onClick={submit}>
                        ذخیره
                    </Button>
                }
            />

            <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-1 pb-3">
                <SegmentedControl
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

                {/* ۱) مبلغ: مهم‌ترین چیز صفحه */}
                <div className="flex flex-col items-center py-1" aria-live="polite">
                    <p className="flex items-baseline gap-2">
                        <span
                            className={cn(
                                "num leading-none font-bold tracking-tight transition-colors duration-200",
                                digits.length > 9 ? "text-[36px]" : "text-[46px]",
                                amount === 0 ? "text-muted-foreground/40" : !isCost && "text-success"
                            )}
                        >
                            {amount.toLocaleString("fa-IR")}
                        </span>
                        <span className="text-[16px] font-medium text-muted-foreground">تومان</span>
                    </p>
                    <p className="mt-1.5 h-5 text-[13px] text-muted-foreground">{words && `${words} تومان`}</p>
                </div>

                {/* ۲) دسته */}
                <div ref={chipsRef} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                    {chips.map((c) => {
                        const on = (category ?? NONE) === c.id
                        return (
                            <button
                                key={c.id}
                                type="button"
                                aria-pressed={on}
                                onClick={() => {
                                    if (!on) haptic()
                                    setSelected(c.id === NONE ? null : c.id)
                                }}
                                className={cn(
                                    "press flex h-9 shrink-0 items-center gap-2 rounded-full ps-2.5 pe-3.5 text-[14px] whitespace-nowrap transition-colors duration-200",
                                    on ? "bg-foreground font-semibold text-background" : "bg-card"
                                )}
                            >
                                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.label}
                            </button>
                        )
                    })}
                    <button
                        type="button"
                        onClick={() => {
                            close()
                            navigate("/categories")
                        }}
                        className="press flex h-9 shrink-0 items-center gap-1 rounded-full bg-tint ps-2.5 pe-3.5 text-[14px] font-medium whitespace-nowrap text-primary"
                    >
                        <Plus className="size-4" />
                        {chips.length === 0 ? "افزودن دسته" : "دسته"}
                    </button>
                </div>

                {/* ۳) جزئیات: تاریخ، توضیح، حذف */}
                <div className="flex items-center gap-2">
                    {/* تقویم در یک پاپ‌اور شناور روی شیت باز می‌شود */}
                    <Popover.Root open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <Popover.Trigger asChild>
                            <button
                                type="button"
                                onClick={() => haptic()}
                                className={cn(
                                    "press flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition-colors duration-200",
                                    calendarOpen ? "bg-primary text-primary-foreground" : "bg-card"
                                )}
                            >
                                <CalendarDays className="size-4" />
                                <span key={date.toDateString()} className="animate-fade-in">{shortDay(date)}</span>
                            </button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                side="top"
                                align="start"
                                sideOffset={8}
                                collisionPadding={16}
                                className="z-[60] w-[min(340px,calc(100vw-32px))] origin-(--radix-popover-content-transform-origin) overflow-hidden rounded-2xl shadow-float outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                            >
                                <PersianCalendar
                                    value={date}
                                    onChange={(d) => {
                                        setDate(d)
                                        setCalendarOpen(false)
                                    }}
                                />
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                    <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-card px-3.5">
                        <PencilLine className="size-4 shrink-0 text-muted-foreground" />
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onFocus={() => setCalendarOpen(false)}
                            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                            placeholder="توضیح (اختیاری)"
                            maxLength={500}
                            enterKeyHint="done"
                            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                        />
                    </label>
                    {entry && (
                        <button
                            type="button"
                            aria-label="حذف تراکنش"
                            onClick={handleDelete}
                            className="press grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive"
                        >
                            <Trash2 className="size-[18px]" />
                        </button>
                    )}
                </div>

                {/* ۴) صفحه‌کلید عددی */}
                <Numpad onKey={pressKey} />
            </div>
        </>
    )
}
