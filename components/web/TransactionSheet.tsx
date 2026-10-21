"use client"

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { CalendarDays, PencilLine, Plus, Trash2 } from "lucide-react"
import { Popover } from "radix-ui"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogNav } from "@/components/ui/dialog"
import { CategoryAvatar } from "@/components/web/Avatars"
import { PersianCalendar } from "@/components/web/PersianCalendar"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { WheelPicker } from "@/components/web/WheelPicker"
import { LogEntry, LogKind } from "@/lib/types"
import { addDays, cn, defaultEntryDate, haptic, isSameDay } from "@/lib/utils"
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

// سه‌رقم‌سه‌رقم با ویرگول: 100,000
function groupDigits(digits: string) {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// فیلد مبلغ: ارقام فارسی هم پذیرفته و انگلیسی ذخیره می‌شوند؛ مکان‌نما بعد از ویرگول‌گذاری سر جایش می‌ماند
function AmountInput({
    digits,
    onChange,
    onSubmit,
    className,
}: {
    digits: string
    onChange: (digits: string) => void
    onSubmit: () => void
    className?: string
}) {
    const ref = useRef<HTMLInputElement>(null)
    // تعداد رقم‌های قبل از مکان‌نما، برای برگرداندنش بعد از رندر
    const caret = useRef<number | null>(null)
    const text = groupDigits(digits)

    useLayoutEffect(() => {
        const el = ref.current
        const count = caret.current
        if (!el || count === null) return
        caret.current = null
        let pos = 0
        for (let seen = 0; pos < el.value.length && seen < count; pos++) if (/\d/.test(el.value[pos])) seen++
        el.setSelectionRange(pos, pos)
    })

    return (
        <input
            ref={ref}
            type="text"
            inputMode="numeric"
            dir="ltr"
            autoComplete="off"
            value={text}
            onChange={(e) => {
                const raw = toLatinDigits(e.target.value)
                const before = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, "").length
                const next = raw.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS)
                caret.current = Math.min(before - (raw.replace(/\D/g, "").length - next.length), next.length)
                onChange(next)
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") return onSubmit()
                // پاک کردن روی ویرگول، رقم قبلش را پاک کند
                const el = e.currentTarget
                const pos = el.selectionStart ?? 0
                if (e.key === "Backspace" && pos === el.selectionEnd && el.value[pos - 1] === ",") el.setSelectionRange(pos - 1, pos - 1)
            }}
            placeholder="0"
            aria-label="مبلغ"
            enterKeyHint="done"
            style={{ width: `${Math.max(1, text.length) * 0.62 + 0.4}em` }}
            className={cn(
                "num max-w-full bg-transparent text-center leading-tight font-bold outline-none placeholder:text-muted-foreground/40",
                text.length > 11 ? "text-[30px]" : "text-[40px]",
                className
            )}
        />
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

    // تراکنش بی‌دسته‌ای که ویرایش می‌شود، روی چرخ گزینهٔ «بدون دسته» هم دارد
    const wheelItems = useMemo(
        () => (entry && !entry.key ? [{ id: NONE, label: "بدون دسته", color: undefined }, ...items] : items),
        [entry, items]
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

                {/* مبلغ: فیلد عددی ساده با جداکنندهٔ هزارگان */}
                <label className="flex items-baseline justify-center gap-1.5 py-2">
                    <AmountInput
                        digits={digits}
                        onChange={setDigits}
                        onSubmit={submit}
                        className={cn(amount > 0 && !isCost && "text-success")}
                    />
                    <span className="text-[15px] font-medium text-muted-foreground">تومان</span>
                </label>

                {/* دسته‌ها: چرخ انتخاب، پرکاربردها اول */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[13px] text-muted-foreground">دسته</span>
                        <Link href="/categories" onClick={close} className="press flex items-center gap-1 text-[13px] font-medium text-primary">
                            <Plus className="size-3.5" />
                            دسته جدید
                        </Link>
                    </div>
                    {wheelItems.length > 0 && (
                        <WheelPicker
                            key={kind}
                            label="دسته"
                            items={wheelItems}
                            value={category ?? NONE}
                            getKey={(c) => c.id}
                            onChange={(id) => setSelected(id === NONE ? null : id)}
                            render={(c, active) => (
                                <>
                                    <CategoryAvatar label={c.label} color={c.color} size={28} />
                                    <span className={cn("truncate", active && "font-semibold")}>{c.label}</span>
                                </>
                            )}
                        />
                    )}
                </div>

                {/* تاریخ و توضیح */}
                <div className="flex items-center gap-2">
                    {/* تقویم در یک پاپ‌اور شناور روی شیت باز می‌شود */}
                    <Popover.Root open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <Popover.Trigger asChild>
                        <button
                            type="button"
                            onClick={() => haptic()}
                            className={cn(
                                "press flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium transition-colors duration-200",
                                calendarOpen ? "bg-primary text-primary-foreground" : "bg-card"
                            )}
                        >
                            <CalendarDays className="size-[18px]" />
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
                    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-card px-4">
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
                </div>

                <Button size="lg" className="w-full" disabled={amount <= 0} onClick={submit}>
                    {entry ? "ذخیره تغییرات" : `ثبت ${noun}`}
                </Button>
            </div>
        </>
    )
}
