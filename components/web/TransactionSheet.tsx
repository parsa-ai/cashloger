"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { CalendarDays, Check, Delete, PencilLine, Plus, Trash2 } from "lucide-react"
import { Popover } from "radix-ui"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogNav } from "@/components/ui/dialog"
import { CategoryAvatar } from "@/components/web/Avatars"
import { PersianCalendar } from "@/components/web/PersianCalendar"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { WheelPicker } from "@/components/web/WheelPicker"
import { navigate } from "@/lib/nav"
import { LogEntry, LogKind } from "@/lib/types"
import { cleanInput, formatInput, fromUnit, toUnitInput, unitDecimals } from "@/lib/money"
import { addDays, cn, defaultEntryDate, haptic, isSameDay } from "@/lib/utils"
import { useCategoriesByUsage } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import { useMoneyUnit } from "@/store/useMoneyUnitStore"
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

type NumpadKey = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "000" | "." | "0" | "back"

const DIGIT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

// صفحه‌کلید عددی ساده (بدون کاشی، مثل شماره‌گیر گوشی)؛ ۱ بالا چپ.
// در واحدهای اعشاری (هزار/میلیون تومان) دکمهٔ «۰۰۰» جایش را به ممیز می‌دهد
function Numpad({ decimal, onKey }: { decimal: boolean; onKey: (key: NumpadKey) => void }) {
    const keys: NumpadKey[] = [...DIGIT_KEYS, decimal ? "." : "000", "0", "back"]
    return (
        <div dir="ltr" className="grid grid-cols-3">
            {keys.map((key) => (
                <button
                    key={key}
                    type="button"
                    aria-label={key === "back" ? "پاک کردن" : undefined}
                    onClick={() => {
                        haptic(4)
                        onKey(key)
                    }}
                    className="press num grid h-12 place-items-center rounded-xl text-[26px] font-medium select-none active:bg-fill"
                >
                    {key === "back" ? (
                        <Delete className="size-6 text-muted-foreground" />
                    ) : key === "." ? (
                        "٫"
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
    const addCategory = useUiStore((s) => s.addCategory)
    const setOpen = useUiStore((s) => s.setSheetOpen)
    const viewDate = useDateStore((s) => s.date) || new Date()

    const addLog = useLogStore((s) => s.addLog)
    const updateLog = useLogStore((s) => s.updateLog)
    const removeLog = useLogStore((s) => s.removeLog)

    const [kind, setKind] = useState<LogKind>(entry ? (entry.mode === "increase" ? "income" : "cost") : addKind)
    const unit = useMoneyUnit()
    const decimal = unitDecimals(unit) > 0
    // مبلغ به واحد انتخابی، به شکل رشتهٔ خام مثل «12.5»
    const [digits, setDigits] = useState(entry ? toUnitInput(entry.visitors, unit) : "")
    const [selected, setSelected] = useState<string | null>(entry ? entry.key : addCategory)
    const [date, setDate] = useState(() => entry?.date ?? defaultEntryDate(viewDate))
    const [description, setDescription] = useState(entry?.description ?? "")
    const [calendarOpen, setCalendarOpen] = useState(false)

    const amount = digits ? fromUnit(Number(digits), unit) : 0
    const isCost = kind === "cost"
    const noun = isCost ? "هزینه" : "درآمد"
    const entryKind = entry ? (entry.mode === "increase" ? "income" : "cost") : null

    // دسته‌های پرکاربردتر اول؛ اولی پیش‌فرض تراکنش جدید است
    const items = useCategoriesByUsage(kind)

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
                ? [{ id: NONE, label: "بدون دسته", color: undefined as string | undefined }, ...items]
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

    // افزودن رقم به مبلغ: صفر اول نمی‌گیرد و از سقف رقم‌ها و اعشار واحد رد نمی‌شود
    const push = (add: string) => setDigits((d) => cleanInput(d + add, unit, MAX_DIGITS))

    const pressKey = (key: NumpadKey) => {
        if (key === "back") setDigits((d) => d.slice(0, -1))
        else push(key)
    }

    // روی دسکتاپ با کیبورد هم می‌شود مبلغ را زد
    const submitRef = useRef(submit)
    const pushRef = useRef(push)
    useLayoutEffect(() => {
        submitRef.current = submit
        pushRef.current = push
    })
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement
            if (target.closest("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return
            const key = toLatinDigits(e.key)
            if (/^\d$/.test(key) || (decimal && /^[.٫]$/.test(key))) pushRef.current(key)
            else if (e.key === "Backspace") setDigits((d) => d.slice(0, -1))
            else if (e.key === "Enter" && !target.closest("button")) submitRef.current()
            else return
            e.preventDefault()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [decimal])

    return (
        <>
            <DialogNav
                title={entry ? `ویرایش ${noun}` : `${noun} جدید`}
                center={
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
                        className="h-9 w-44 text-[14px]"
                    />
                }
                action={
                    <Button type="button" size="icon" aria-label="ذخیره" disabled={amount <= 0} onClick={submit}>
                        <Check />
                    </Button>
                }
            />

            {/* همه‌چیز بدون اسکرول در یک صفحه جا می‌شود */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-2">
                {/* ۱) مبلغ: بزرگ‌ترین چیز صفحه */}
                <p className="flex h-[68px] items-center justify-center gap-2" aria-live="polite">
                    <span
                        className={cn(
                            "num leading-none font-bold tracking-tight transition-colors duration-200",
                            digits.length > 9 ? "text-[38px]" : "text-[48px]",
                            amount === 0 ? "text-muted-foreground/35" : !isCost && "text-success"
                        )}
                    >
                        {formatInput(digits) || "۰"}
                    </span>
                    <span className="text-[15px] font-medium text-muted-foreground">{unit.label}</span>
                </p>

                {/* ۲) جزئیات در یک کارت: دسته (چرخ)، بعد تاریخ و توضیح */}
                <div className="overflow-hidden rounded-2xl bg-card">
                    <div className="flex items-center">
                        {chips.length > 0 ? (
                            <WheelPicker
                                key={kind}
                                label="دسته"
                                items={chips}
                                value={category ?? NONE}
                                getKey={(c) => c.id}
                                onChange={(id) => setSelected(id === NONE ? null : id)}
                                render={(c, active) => (
                                    <>
                                        <CategoryAvatar label={c.label} color={c.color} size={24} />
                                        <span className={cn("truncate", active && "font-semibold")}>{c.label}</span>
                                    </>
                                )}
                                className="min-w-0 flex-1"
                            />
                        ) : (
                            <p className="flex-1 py-4 text-center text-[14px] text-muted-foreground">هنوز دسته‌ای نداری</p>
                        )}
                        <button
                            type="button"
                            aria-label="دستهٔ جدید"
                            onClick={() => {
                                close()
                                navigate("/categories")
                            }}
                            className="press me-2 grid size-9 shrink-0 place-items-center rounded-full bg-tint text-primary"
                        >
                            <Plus className="size-[18px]" />
                        </button>
                    </div>

                    <div className="flex h-11 items-center border-t border-separator">
                        {/* تقویم در یک پاپ‌اور شناور روی شیت باز می‌شود */}
                        <Popover.Root open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <Popover.Trigger asChild>
                                <button
                                    type="button"
                                    onClick={() => haptic()}
                                    className={cn(
                                        "press flex h-full shrink-0 items-center gap-1.5 border-e border-separator px-4 text-[14px] font-medium transition-colors duration-200",
                                        calendarOpen && "text-primary"
                                    )}
                                >
                                    <CalendarDays className="size-4 text-muted-foreground" />
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
                        <label className="flex h-full min-w-0 flex-1 items-center gap-2 px-4">
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
                                className="press grid h-full shrink-0 place-items-center border-s border-separator px-4 text-destructive"
                            >
                                <Trash2 className="size-[18px]" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ۳) صفحه‌کلید عددی */}
                <Numpad decimal={decimal} onKey={pressKey} />
            </div>
        </>
    )
}
