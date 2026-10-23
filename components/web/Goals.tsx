"use client"

import { SubmitEvent, useEffect, useMemo, useState } from "react"
import { Check, Minus, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react"
import { happy } from "blobatar/expression"

import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogNav } from "@/components/ui/dialog"
import { CategoryAvatar } from "@/components/web/Avatars"
import { ColorPicker } from "@/components/web/ColorPicker"
import { EmptyState } from "@/components/web/EmptyState"
import { Group, IconTile, Row } from "@/components/web/Group"
import { MoneyInput } from "@/components/web/MoneyInput"
import { PersianCalendar } from "@/components/web/PersianCalendar"
import { formatDeadline, fromDateKey, goalProgress, netSaved, toDateKey } from "@/lib/goals"
import { formatAmountWords, formatMoney } from "@/lib/money"
import { suggestColor } from "@/lib/palette"
import { Goal } from "@/lib/types"
import { cn, haptic } from "@/lib/utils"
import { useGoalBalances, useMonthEntries } from "@/store/selectors"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"
import { useMoneyUnit } from "@/store/useMoneyUnitStore"
import { useUiStore } from "@/store/useUiStore"
import useDateStore from "@/store/useYearStore"

const FORM_ID = "goal-form"

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

// واریز و برداشت‌های یک هدف، جدیدترین اول؛ حذف هر کدام با «برگرداندن»
function GoalHistory({ goalId }: { goalId: string }) {
    const unit = useMoneyUnit()
    const entries = useLogStore((s) => s.entries)
    const removeLog = useLogStore((s) => s.removeLog)
    const updateLog = useLogStore((s) => s.updateLog)

    const history = useMemo(
        () => entries.filter((e) => e.goal === goalId).sort((a, b) => b.date.getTime() - a.date.getTime()),
        [entries, goalId]
    )
    if (history.length === 0) return null

    return (
        <Group title="واریز و برداشت‌ها">
            {history.map((entry) => {
                const deposit = entry.mode === "decrease"
                const Icon = deposit ? Plus : Minus
                return (
                    <Row
                        key={entry.id}
                        leading={
                            <span
                                className={cn(
                                    "grid size-8 shrink-0 place-items-center rounded-full",
                                    deposit ? "bg-success/12 text-success" : "bg-fill text-foreground"
                                )}
                            >
                                <Icon className="size-4" strokeWidth={2.4} />
                            </span>
                        }
                        title={deposit ? "واریز" : "برداشت"}
                        subtitle={entry.date.toLocaleDateString("fa-IR", { day: "numeric", month: "long", year: "numeric" })}
                        trailing={
                            <span className="flex items-center gap-1">
                                <span className={cn("num text-[15px] font-semibold", deposit && "text-success")}>
                                    {deposit ? "+" : "−"}
                                    {formatMoney(entry.visitors, unit)}
                                </span>
                                <button
                                    type="button"
                                    aria-label="حذف"
                                    onClick={() => {
                                        haptic()
                                        removeLog(entry.id)
                                        toast("حذف شد", "default", { label: "برگرداندن", onClick: () => updateLog(entry) })
                                    }}
                                    className="press -me-2 grid size-9 place-items-center text-muted-foreground"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </span>
                        }
                    />
                )
            })}
        </Group>
    )
}

function GoalDetail({ goal, saved, onEdit }: { goal: Goal; saved: number; onEdit: () => void }) {
    const unit = useMoneyUnit()
    const addLog = useLogStore((s) => s.addLog)
    const removeLog = useLogStore((s) => s.removeLog)
    const [amount, setAmount] = useState<number | null>(null)
    const { remaining, ratio, done, perMonth, overdue } = goalProgress(goal, saved)

    // واریز یک هزینه از موجودی است و برداشت پول را به موجودی برمی‌گرداند؛ هر دو در تراکنش‌ها دیده می‌شوند
    const change = (sign: 1 | -1) => {
        if (!amount) return
        const value = sign === 1 ? amount : Math.min(amount, saved)
        if (value <= 0) return
        const id = addLog({
            key: null,
            goal: goal.id,
            visitors: value,
            date: new Date(),
            mode: sign === 1 ? "decrease" : "increase",
        })
        setAmount(null)

        const undo = { label: "برگرداندن", onClick: () => removeLog(id) }
        if (sign === 1 && saved + value >= goal.target && saved < goal.target) {
            haptic([10, 40, 10, 40, 10])
            toast(`به هدف «${goal.label}» رسیدی`, "success", undo)
        } else {
            haptic([10, 40, 10])
            toast(sign === 1 ? "از موجودی به پس‌انداز رفت" : "به موجودی برگشت", "success", undo)
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
                                <span className="num">{formatMoney(saved, unit)}</span>
                                <span className="ms-1.5 text-[15px] font-medium text-muted-foreground">{unit.label}</span>
                            </p>
                            <p className="text-[13px] text-muted-foreground">
                                از <span className="num">{formatMoney(goal.target, unit)}</span>
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
                                <span className="num">{formatMoney(remaining, unit)}</span> {unit.label} مانده
                                {perMonth !== null && (
                                    <>
                                        {" · "}ماهی <span className="num">{formatMoney(perMonth, unit)}</span> تا{" "}
                                        {formatDeadline(goal.deadline!)}
                                    </>
                                )}
                                {overdue && " · موعدش گذشته"}
                            </>
                        )}
                    </p>
                </section>

                <div className="space-y-3">
                    <Group title="واریز یا برداشت" footer="واریز از موجودی ماه کم می‌شود و برداشت به آن برمی‌گردد.">
                        <MoneyInput value={amount} onChange={setAmount} placeholder="مبلغ" label="مبلغ واریز یا برداشت" />
                    </Group>
                    <div className="grid grid-cols-2 gap-3">
                        <Button type="button" disabled={!amount} onClick={() => change(1)}>
                            <Plus />
                            واریز
                        </Button>
                        <Button type="button" variant="secondary" disabled={!amount || saved === 0} onClick={() => change(-1)}>
                            <Minus />
                            برداشت
                        </Button>
                    </div>
                </div>

                <GoalHistory goalId={goal.id} />
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
                        <Group
                            title="تا الان کنار گذاشته‌ام"
                            footer="اختیاری؛ پولی که از قبل جدا کرده‌ای و از موجودی کم نمی‌شود. بعداً هم می‌توانی واریز کنی."
                        >
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
                                    future
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
                        <Group
                            footer={
                                confirmDelete
                                    ? "برای حذف دوباره بزن. واریز و برداشت‌هایش هم حذف می‌شوند و پولش به موجودی برمی‌گردد."
                                    : undefined
                            }
                        >
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

// شیت هدف: جزئیات (واریز/برداشت) یا فرم ساخت و ویرایش
function GoalSheet() {
    const goals = useLogStore((s) => s.goals)
    const balances = useGoalBalances()
    const open = useUiStore((s) => s.goalOpen)
    const goalId = useUiStore((s) => s.goalId)
    const editing = useUiStore((s) => s.goalEditing)
    const sheetKey = useUiStore((s) => s.goalKey)
    const setOpen = useUiStore((s) => s.setGoalOpen)
    const setEditing = useUiStore((s) => s.setGoalEditing)

    // با ترک صفحهٔ اهداف بسته شود تا برگشتن به آن دوباره بازش نکند
    useEffect(() => () => setOpen(false), [setOpen])

    // نسخهٔ آخر هدف باز شده تا اگر حذف شد، شیت هنگام بسته شدن همان را نشان دهد
    const [last, setLast] = useState<Goal | undefined>()
    const found = goalId ? goals.find((g) => g.id === goalId) : undefined
    if (found && found !== last) setLast(found)
    const selected = goalId ? found ?? (last?.id === goalId ? last : undefined) : undefined

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                {editing || !selected ? (
                    <GoalForm key={sheetKey} goal={selected} onDone={() => setOpen(false)} />
                ) : (
                    <GoalDetail
                        key={sheetKey}
                        goal={selected}
                        saved={balances.get(selected.id) ?? selected.saved}
                        onEdit={() => setEditing(true)}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}

// صفحهٔ اهداف پس‌انداز: جمع پس‌انداز، پیشرفت هر هدف، لمس برای واریز/برداشت یا ویرایش
export function GoalsView() {
    const unit = useMoneyUnit()
    const goals = useLogStore((s) => s.goals)
    const balances = useGoalBalances()
    const openGoal = useUiStore((s) => s.openGoal)
    const date = useDateStore((s) => s.date) || new Date()
    const month = netSaved(useMonthEntries(date))

    const total = goals.reduce((sum, g) => sum + (balances.get(g.id) ?? 0), 0)

    const open = (id?: string) => {
        haptic()
        openGoal(id)
    }

    return (
        <div className="space-y-6 pt-2">
            {goals.length === 0 ? (
                <EmptyState
                    expression={happy}
                    title="هنوز هدفی نداری"
                    description="برای چیزی که می‌خواهی بخری هدف بگذار؛ هر واریز از موجودی‌ات کم می‌شود و پیشرفتش را می‌بینی."
                />
            ) : (
                <section className="rounded-xl bg-card px-4 pt-4 pb-3">
                    <p className="text-[13px] text-muted-foreground">جمع پس‌انداز</p>
                    <p className="text-[34px] leading-tight font-bold">
                        <span className="num">{formatMoney(total, unit)}</span>
                        <span className="ms-1.5 text-[15px] font-medium text-muted-foreground">{unit.label}</span>
                    </p>
                    {month !== 0 && (
                        <p className="mt-1 text-[13px] text-muted-foreground">
                            این ماه <span className="num">{formatMoney(Math.abs(month), unit)}</span>{" "}
                            {month > 0 ? "کنار گذاشتی" : "برداشتی"}
                        </p>
                    )}
                </section>
            )}

            <Group>
                {goals.map((goal) => {
                    const saved = balances.get(goal.id) ?? 0
                    const { ratio, done } = goalProgress(goal, saved)
                    return (
                        <Row
                            key={goal.id}
                            onClick={() => open(goal.id)}
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
                                    <span className="num block text-[15px] font-semibold">{formatMoney(saved, unit)}</span>
                                    <span className="block text-[12px] text-muted-foreground">
                                        از <span className="num">{formatMoney(goal.target, unit)}</span>
                                    </span>
                                </span>
                            }
                        />
                    )
                })}
                <Row
                    onClick={() => open()}
                    leading={
                        <span className="grid size-8 place-items-center rounded-full bg-tint text-primary">
                            <Plus className="size-5" />
                        </span>
                    }
                    title="هدف جدید"
                    tone="primary"
                />
            </Group>

            <GoalSheet />
        </div>
    )
}

// ردیف کوچک اهداف در صفحهٔ اصلی که صفحهٔ اهداف را باز می‌کند
export function GoalsLink() {
    const unit = useMoneyUnit()
    const goals = useLogStore((s) => s.goals)
    const balances = useGoalBalances()

    const saved = goals.reduce((sum, g) => sum + Math.min(balances.get(g.id) ?? 0, g.target), 0)
    const target = goals.reduce((sum, g) => sum + g.target, 0)
    const total = goals.reduce((sum, g) => sum + (balances.get(g.id) ?? 0), 0)

    return (
        <Group>
            <Row
                href="/goals"
                leading={
                    <IconTile color="oklch(0.65 0.16 25)">
                        <PiggyBank />
                    </IconTile>
                }
                title="اهداف پس‌انداز"
                subtitle={
                    goals.length === 0
                        ? "برای خریدهای بزرگ هدف بگذار"
                        : `${goals.length.toLocaleString("fa-IR")} هدف · ${Math.floor((saved / target) * 100).toLocaleString("fa-IR")}٪`
                }
                trailing={goals.length > 0 && <span className="num text-[15px] text-muted-foreground">{formatMoney(total, unit)}</span>}
            />
        </Group>
    )
}
