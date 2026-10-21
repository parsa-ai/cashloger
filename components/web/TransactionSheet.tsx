"use client"

import { SubmitEvent, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogNav } from "@/components/ui/dialog"
import { CategoryAvatar } from "@/components/web/Avatars"
import { Group, Row } from "@/components/web/Group"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { LogEntry, LogKind } from "@/lib/types"
import { addDays, cn, defaultEntryDate, formatDayTitle, haptic, isSameDay } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"
import { useUiStore } from "@/store/useUiStore"
import useDateStore from "@/store/useYearStore"

const FORM_ID = "transaction-form"

// تبدیل ارقام فارسی/عربی به انگلیسی و حذف جداکننده‌ها
function parseAmount(text: string) {
    const ascii = text
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[^\d]/g, "")
    return ascii ? Math.min(Number(ascii), 999_999_999_999) : 0
}

// شیت سراسری ثبت و ویرایش تراکنش + دکمهٔ شناور «افزودن»
export function TransactionSheetHost() {
    const pathname = usePathname()
    const open = useUiStore((s) => s.sheetOpen)
    const setOpen = useUiStore((s) => s.setSheetOpen)
    const openAdd = useUiStore((s) => s.openAdd)
    const sheetKey = useUiStore((s) => s.sheetKey)
    const showFab = pathname === "/" || pathname === "/logs"

    return (
        <>
            {showFab && (
                <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),0.5rem)+62px)] z-30">
                    <div className="mx-auto flex max-w-2xl justify-end px-4">
                        <button
                            type="button"
                            aria-label="تراکنش جدید"
                            onClick={() => {
                                haptic()
                                openAdd()
                            }}
                            className="press-scale pointer-events-auto grid size-14 animate-fade-in place-items-center rounded-full bg-primary text-primary-foreground shadow-float"
                        >
                            <Plus className="size-7" strokeWidth={2.2} />
                        </button>
                    </div>
                </div>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <TransactionForm key={sheetKey} />
                </DialogContent>
            </Dialog>
        </>
    )
}

function TransactionForm() {
    const entry = useUiStore((s) => s.editing) ?? undefined
    const addKind = useUiStore((s) => s.addKind)
    const setOpen = useUiStore((s) => s.setSheetOpen)
    const viewDate = useDateStore((s) => s.date) || new Date()

    const allCategories = useLogStore((s) => s.categories)
    const addLog = useLogStore((s) => s.addLog)
    const updateLog = useLogStore((s) => s.updateLog)
    const removeLog = useLogStore((s) => s.removeLog)

    const [kind, setKind] = useState<LogKind>(entry ? (entry.mode === "increase" ? "income" : "cost") : addKind)
    const [amount, setAmount] = useState(entry ? entry.visitors : 0)
    const [selected, setSelected] = useState<string | null>(entry ? entry.key : null)
    const [date, setDate] = useState(() => entry?.date ?? defaultEntryDate(viewDate))
    const [description, setDescription] = useState(entry?.description ?? "")
    const [confirmDelete, setConfirmDelete] = useState(false)

    const isCost = kind === "cost"
    const noun = isCost ? "هزینه" : "درآمد"
    const items = useMemo(() => allCategories.filter((c) => c.kind === kind), [allCategories, kind])
    // دستهٔ انتخاب‌شده باید از همین نوع باشد؛ برای تراکنش جدید اولی پیش‌فرض است
    const category = selected && items.some((c) => c.id === selected) ? selected : entry ? null : items[0]?.id ?? null

    const today = new Date()
    const canGoForward = !isSameDay(date, today) && date < today

    const close = () => setOpen(false)

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault()
        if (amount <= 0) return

        const data = {
            key: category,
            visitors: amount,
            date,
            description: description.trim() || undefined,
            mode: (isCost ? "decrease" : "increase") as LogEntry["mode"],
        }
        if (entry) {
            updateLog({ ...entry, ...data })
            toast(`${noun} ویرایش شد`, "success")
        } else {
            addLog(data)
            toast(`${noun} ثبت شد`, "success")
        }
        haptic([10, 40, 10])
        close()
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
        close()
    }

    const shiftDay = (days: number) => {
        haptic()
        setDate((d) => addDays(d, days))
    }

    return (
        <>
            <DialogNav
                title={entry ? `ویرایش ${noun}` : `${noun} جدید`}
                action={
                    <Button type="submit" form={FORM_ID} variant="plain" size="nav" disabled={amount <= 0}>
                        {entry ? "ذخیره" : "ثبت"}
                    </Button>
                }
            />
            <DialogBody>
                <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
                    {!entry && (
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
                    )}

                    <label className="block py-2 text-center">
                        <span className="sr-only">مبلغ</span>
                        <input
                            inputMode="numeric"
                            enterKeyHint="done"
                            value={amount ? amount.toLocaleString("fa-IR") : ""}
                            onChange={(e) => setAmount(parseAmount(e.target.value))}
                            placeholder="۰"
                            className={cn(
                                "num w-full bg-transparent text-center text-[40px] leading-tight font-bold outline-none placeholder:text-muted-foreground/40",
                                !isCost && "text-success"
                            )}
                        />
                        <span className="text-[13px] text-muted-foreground">تومان</span>
                    </label>

                    <Group
                        title="دسته‌بندی"
                        action={
                            <Link href="/categories" onClick={close} className="press flex items-center gap-0.5 text-[13px] text-primary">
                                <Plus className="size-3.5" />
                                مدیریت
                            </Link>
                        }
                    >
                        {items.length === 0 ? (
                            <p className="p-4 text-center text-[13px] text-muted-foreground">هنوز دسته‌بندی‌ای نساختی.</p>
                        ) : (
                            <div className="grid grid-cols-4 gap-x-1 gap-y-3 px-2 py-3 sm:grid-cols-5">
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
                                            className="press flex min-w-0 flex-col items-center gap-1.5"
                                        >
                                            <span
                                                className={cn(
                                                    "rounded-full p-[3px] ring-2 transition-[box-shadow] duration-200",
                                                    active ? "ring-primary" : "ring-transparent"
                                                )}
                                            >
                                                <CategoryAvatar label={item.label} color={item.color} size={44} />
                                            </span>
                                            <span
                                                className={cn(
                                                    "w-full truncate text-center text-[12px] transition-colors duration-200",
                                                    active ? "font-semibold text-primary" : "text-muted-foreground"
                                                )}
                                            >
                                                {item.label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </Group>

                    <Group>
                        <Row
                            title="تاریخ"
                            trailing={
                                <span className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => shiftDay(-1)}
                                        aria-label="روز قبل"
                                        className="press grid size-8 place-items-center rounded-full bg-fill text-primary"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                    <span key={date.toDateString()} className="min-w-28 animate-fade-in text-center text-[15px] text-primary">
                                        {isSameDay(date, today) ? "امروز" : formatDayTitle(date)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => shiftDay(1)}
                                        disabled={!canGoForward}
                                        aria-label="روز بعد"
                                        className="press grid size-8 place-items-center rounded-full bg-fill text-primary transition-opacity disabled:opacity-30"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                </span>
                            }
                        />
                        <div className="px-4 py-1">
                            <textarea
                                placeholder={isCost ? "توضیح (مثلاً ناهار با بچه‌ها)" : "توضیح (مثلاً حقوق مهر)"}
                                rows={1}
                                maxLength={500}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="field-sizing-content block max-h-32 min-h-11 w-full resize-none bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted-foreground/70"
                            />
                        </div>
                    </Group>

                    {entry && (
                        <Group footer={confirmDelete ? "برای حذف همیشگی دوباره بزن." : undefined}>
                            <Row
                                onClick={handleDelete}
                                tone="destructive"
                                title={<span className="block text-center font-medium">{confirmDelete ? "مطمئنم، حذف شود" : "حذف تراکنش"}</span>}
                            />
                        </Group>
                    )}
                </form>
            </DialogBody>
        </>
    )
}
