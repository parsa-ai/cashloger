"use client"

import { SubmitEvent, useState } from "react"
import { Check, Minus, Pencil, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogNav } from "@/components/ui/dialog"
import { CategoryAvatar } from "@/components/web/Avatars"
import { ColorPicker } from "@/components/web/ColorPicker"
import { Group, Row } from "@/components/web/Group"
import { MoneyInput } from "@/components/web/MoneyInput"
import { PersianCalendar } from "@/components/web/PersianCalendar"
import { suggestColor } from "@/lib/palette"
import { Goal } from "@/lib/types"
import { cn, formatAmountWords, formatMoney, haptic, MONEY_UNIT } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"

const FORM_ID = "goal-form"
const DAY = 24 * 60 * 60 * 1000

// موعد به شکل YYYY-MM-DD (تاریخ محلی، بدون ساعت) ذخیره می‌شود
function toDateKey(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function fromDateKey(key: string) {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, m - 1, d)
}

function formatDeadline(key: string) {
    return fromDateKey(key).toLocaleDateString("fa-IR", { day: "numeric", month: "long", year: "numeric" })
}

// چقدر مانده و تا موعد ماهی چقدر باید کنار گذاشت
function goalProgress(goal: Goal) {
    const remaining = Math.max(goal.target - goal.saved, 0)
    const ratio = Math.min(goal.saved / goal.target, 1)
    const done = remaining === 0

    let perMonth: number | null = null
    let overdue = false
    if (goal.deadline && !done) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const days = Math.round((fromDateKey(goal.deadline).getTime() - today.getTime()) / DAY)
        if (days < 0) overdue = true
        else perMonth = remaining / Math.max(1, Math.ceil(days / 30.44))
    }
    return { remaining, ratio, done, perMonth, overdue }
}

function ProgressBar({ ratio, color, className }: { ratio: number; color: string; className?: string }) {
    return (
        <span className={cn("block h-1 overflow-hidden rounded-full bg-fill", className)}>
            <span
                className="block h-full origin-right rounded-full"
                style={{ transform: `scaleX(${ratio})`, backgroundColor: color }}
            />
        </span>
    )
}

function GoalDetail({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
    const updateGoal = useLogStore((s) => s.updateGoal)
    const [amount, setAmount] = useState<number | null>(null)
    const { remaining, ratio, done, perMonth, overdue } = goalProgress(goal)

    const change = (sign: 1 | -1) => {
        if (!amount) return
        const previous = goal.saved
        const saved = Math.max(previous + sign * amount, 0)
        updateGoal(goal.id, { saved })
        setAmount(null)

        const undo = { label: "برگرداندن", onClick: () => updateGoal(goal.id, { saved: previous }) }
        if (sign === 1 && saved >= goal.target && previous < goal.target) {
            haptic([10, 40, 10, 40, 10])
            toast(`به هدف «${goal.label}» رسیدی`, "success", undo)
        } else {
            haptic([10, 40, 10])
            toast(sign === 1 ? "به پس‌انداز اضافه شد" : "از پس‌انداز برداشته شد", "success", undo)
        }
    }

    return (
        <>
            <DialogNav
                title={goal.label}
                action={
                    <Button type="button" variant="secondary" size="icon" aria-label="ویرایش هدف" onClick={onEdit}>
                        <Pencil className="size-4" />
                    </Button>
                }
            />
            <DialogBody>
                <section className="rounded-xl bg-card p-4">
                    <div className="flex items-center gap-3">
                        <CategoryAvatar label={goal.label} color={goal.color} size={44} />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[28px] leading-tight font-bold">
                                <span className="num">{formatMoney(goal.saved)}</span>
                                <span className="ms-1.5 text-[15px] font-medium text-muted-foreground">{MONEY_UNIT}</span>
                            </p>
                            <p className="text-[13px] text-muted-foreground">
                                از <span className="num">{formatMoney(goal.target)}</span>
                            </p>
                        </div>
                        <span className={cn("num text-[15px] font-semibold", done && "text-success")}>
                            {Math.floor(ratio * 100).toLocaleString("fa-IR")}٪
                        </span>
                    </div>
                    <ProgressBar
                        ratio={ratio}
                        color={done ? "var(--success)" : goal.color}
                        className="mt-4 h-1.5"
                    />
                    <p className="mt-3 text-[13px] text-muted-foreground">
                        {done ? (
                            <span className="text-success">به هدف رسیدی</span>
                        ) : (
                            <>
                                <span className="num">{formatMoney(remaining)}</span> {MONEY_UNIT} مانده
                                {perMonth !== null && (
                                    <>
                                        {" · "}ماهی <span className="num">{formatMoney(perMonth)}</span> تا{" "}
                                        {formatDeadline(goal.deadline!)}
                                    </>
                                )}
                                {overdue && " · موعدش گذشته"}
                            </>
                        )}
                    </p>
                </section>

                <div className="space-y-3">
                    <Group title="واریز یا برداشت">
                        <MoneyInput value={amount} onChange={setAmount} placeholder="مبلغ" label="مبلغ واریز یا برداشت" />
                    </Group>
                    <div className="grid grid-cols-2 gap-3">
                        <Button type="button" disabled={!amount} onClick={() => change(1)}>
                            <Plus />
                            واریز
                        </Button>
                        <Button type="button" variant="secondary" disabled={!amount || goal.saved === 0} onClick={() => change(-1)}>
                            <Minus />
                            برداشت
                        </Button>
                    </div>
                </div>
            </DialogBody>
        </>
    )
}

function GoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
    const goals = useLogStore((s) => s.goals)
    const addGoal = useLogStore((s) => s.addGoal)
    const updateGoal = useLogStore((s) => s.updateGoal)
    const removeGoal = useLogStore((s) => s.removeGoal)

    const [label, setLabel] = useState(goal?.label ?? "")
    const [target, setTarget] = useState<number | null>(goal?.target ?? null)
    const [saved, setSaved] = useState<number | null>(null)
    const [deadline, setDeadline] = useState<string | null>(goal?.deadline ?? null)
    const [color, setColor] = useState(() => goal?.color ?? suggestColor(goals.map((g) => g.color)))
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const trimmed = label.trim()
    const valid = !!trimmed && !!target

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault()
        if (!valid) return
        if (goal) updateGoal(goal.id, { label: trimmed, target, deadline, color })
        else addGoal({ label: trimmed, target, saved: saved ?? 0, deadline, color })
        haptic([10, 40, 10])
        toast(goal ? "هدف ویرایش شد" : "هدف اضافه شد", "success")
        onDone()
    }

    const handleDelete = () => {
        if (!goal) return
        if (!confirmDelete) {
            setConfirmDelete(true)
            haptic()
            return
        }
        removeGoal(goal.id)
        toast("هدف حذف شد")
        onDone()
    }

    return (
        <>
            <DialogNav
                title={goal ? "ویرایش هدف" : "هدف پس‌انداز جدید"}
                action={
                    <Button type="submit" form={FORM_ID} size="icon" aria-label={goal ? "ذخیره" : "افزودن"} disabled={!valid}>
                        <Check />
                    </Button>
                }
            />
            <DialogBody>
                <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
                    <Group>
                        <div className="flex items-center gap-3 ps-3 pe-4">
                            <CategoryAvatar label={trimmed || "؟"} color={color} size={36} />
                            <input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="برای چی پس‌انداز می‌کنی؟"
                                maxLength={40}
                                enterKeyHint="next"
                                className="h-[52px] min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/70"
                            />
                        </div>
                    </Group>

                    <Group title="مبلغ هدف" footer={target ? formatAmountWords(target) : undefined}>
                        <MoneyInput value={target} onChange={setTarget} placeholder="۰" label="مبلغ هدف" />
                    </Group>

                    {!goal && (
                        <Group title="تا الان کنار گذاشته‌ام" footer="اختیاری؛ بعداً هم می‌توانی واریز کنی.">
                            <MoneyInput value={saved} onChange={setSaved} placeholder="۰" label="پس‌انداز فعلی" />
                        </Group>
                    )}

                    <Group footer={deadline ? undefined : "با موعد، می‌بینی ماهی چقدر باید کنار بگذاری."}>
                        <Row
                            onClick={() => {
                                haptic()
                                setCalendarOpen((o) => !o)
                            }}
                            title="موعد"
                            trailing={
                                <span className={cn("text-[15px]", deadline ? "text-primary" : "text-muted-foreground")}>
                                    {deadline ? formatDeadline(deadline) : "ندارد"}
                                </span>
                            }
                        />
                        {calendarOpen && (
                            <div className="border-t border-separator">
                                <PersianCalendar
                                    value={deadline ? fromDateKey(deadline) : new Date()}
                                    onChange={(d) => {
                                        setDeadline(toDateKey(d))
                                        setCalendarOpen(false)
                                    }}
                                />
                            </div>
                        )}
                        {deadline && (
                            <Row
                                onClick={() => {
                                    haptic()
                                    setDeadline(null)
                                    setCalendarOpen(false)
                                }}
                                title="بدون موعد"
                                tone="primary"
                            />
                        )}
                    </Group>

                    <Group title="رنگ">
                        <ColorPicker value={color} onChange={setColor} />
                    </Group>

                    {goal && (
                        <Group footer={confirmDelete ? "برای حذف دوباره بزن." : undefined}>
                            <Row
                                onClick={handleDelete}
                                tone="destructive"
                                title={<span className="block text-center font-medium">{confirmDelete ? "مطمئنم، حذف شود" : "حذف هدف"}</span>}
                            />
                        </Group>
                    )}
                </form>
            </DialogBody>
        </>
    )
}

// اهداف پس‌انداز در خانه: پیشرفت هر هدف، لمس برای واریز/برداشت یا ویرایش
export function Goals() {
    const goals = useLogStore((s) => s.goals)
    const [open, setOpen] = useState(false)
    // نسخهٔ آخر هدف باز شده تا اگر حذف شد، شیت هنگام بسته شدن همان را نشان دهد
    const [opened, setOpened] = useState<Goal | undefined>()
    const [editing, setEditing] = useState(false)
    const [sheetKey, setSheetKey] = useState(0)

    const selected = opened && (goals.find((g) => g.id === opened.id) ?? opened)

    const openSheet = (goal?: Goal) => {
        haptic()
        setOpened(goal)
        setEditing(!goal)
        setSheetKey((k) => k + 1)
        setOpen(true)
    }

    return (
        <>
            <Group
                title="اهداف پس‌انداز"
                footer={goals.length === 0 ? "برای چیزی که می‌خواهی بخری هدف بگذار و پیشرفتش را ببین." : undefined}
            >
                {goals.map((goal) => {
                    const { ratio, done } = goalProgress(goal)
                    return (
                        <Row
                            key={goal.id}
                            onClick={() => openSheet(goal)}
                            leading={<CategoryAvatar label={goal.label} color={goal.color} size={32} />}
                            title={goal.label}
                            subtitle={
                                <span className="flex items-center gap-2">
                                    <ProgressBar ratio={ratio} color={done ? "var(--success)" : goal.color} className="flex-1" />
                                    <span className={cn("num w-10 text-left", done && "text-success")}>
                                        {Math.floor(ratio * 100).toLocaleString("fa-IR")}٪
                                    </span>
                                </span>
                            }
                            trailing={
                                <span className="text-left leading-tight">
                                    <span className="num block text-[15px] font-semibold">{formatMoney(goal.saved)}</span>
                                    <span className="block text-[12px] text-muted-foreground">
                                        از <span className="num">{formatMoney(goal.target)}</span>
                                    </span>
                                </span>
                            }
                        />
                    )
                })}
                <Row
                    onClick={() => openSheet()}
                    leading={
                        <span className="grid size-8 place-items-center rounded-full bg-tint text-primary">
                            <Plus className="size-5" />
                        </span>
                    }
                    title="هدف جدید"
                    tone="primary"
                />
            </Group>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    {editing || !selected ? (
                        <GoalForm key={sheetKey} goal={selected} onDone={() => setOpen(false)} />
                    ) : (
                        <GoalDetail key={sheetKey} goal={selected} onEdit={() => setEditing(true)} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
