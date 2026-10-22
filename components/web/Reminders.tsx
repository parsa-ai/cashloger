"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Loader2, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogNav } from "@/components/ui/dialog"
import { Group, IconTile, Row } from "@/components/web/Group"
import { WheelPicker } from "@/components/web/WheelPicker"
import { PushStatus, enablePush, loadReminderTimes, pushStatus, refreshPush, saveReminderTimes } from "@/lib/push"
import { MAX_REMINDERS, REMINDER_PRESETS, formatTime, formatTimes } from "@/lib/reminders"
import { cn, haptic } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"
import { useUiStore } from "@/store/useUiStore"

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)
const two = (n: number) => n.toLocaleString("fa-IR", { minimumIntegerDigits: 2, useGrouping: false })

export function pushStatusHint(status: PushStatus | null) {
    switch (status) {
        case "needs-install":
            return "برای گرفتن اعلان، اول برنامه رو به صفحهٔ اصلی اضافه کن (Share ← Add to Home Screen)."
        case "unsupported":
            return "این مرورگر اعلان پشتیبانی نمی‌کنه."
        case "denied":
            return "اجازهٔ اعلان رد شده؛ از تنظیمات مرورگر یا گوشی برای کش لاگر روشنش کن."
        default:
            return null
    }
}

// انتخاب ساعت‌های یادآوری: چند ساعت آماده + ساعت دلخواه با چرخ
export function ReminderPicker({ value, onChange }: { value: number[]; onChange: (times: number[]) => void }) {
    const [custom, setCustom] = useState(false)
    const [hour, setHour] = useState(20)
    const [minute, setMinute] = useState(30)

    const full = value.length >= MAX_REMINDERS
    const chips = [...new Set([...REMINDER_PRESETS, ...value])].sort((a, b) => a - b)

    const toggle = (t: number) => {
        haptic()
        if (value.includes(t)) onChange(value.filter((v) => v !== t))
        else if (!full) onChange([...value, t])
        else toast(`حداکثر ${MAX_REMINDERS.toLocaleString("fa-IR")} یادآوری`, "error")
    }

    const addCustom = () => {
        const t = hour * 60 + minute
        if (!value.includes(t)) {
            if (full) {
                toast(`حداکثر ${MAX_REMINDERS.toLocaleString("fa-IR")} یادآوری`, "error")
                return
            }
            onChange([...value, t])
        }
        haptic()
        setCustom(false)
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {chips.map((t) => {
                    const on = value.includes(t)
                    return (
                        <button
                            key={t}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(t)}
                            className={cn(
                                "press flex h-10 items-center gap-2 rounded-full ps-3 pe-4 text-[15px] transition-colors duration-200",
                                on ? "bg-tint font-semibold text-primary" : "bg-card"
                            )}
                        >
                            <span
                                className={cn(
                                    "grid size-5 place-items-center rounded-full transition-colors duration-200",
                                    on ? "bg-primary text-primary-foreground" : "bg-fill"
                                )}
                            >
                                {on && <Check className="size-3 animate-pop" strokeWidth={3.5} />}
                            </span>
                            <span className="num">{formatTime(t)}</span>
                        </button>
                    )
                })}
                {!custom && (
                    <button
                        type="button"
                        onClick={() => setCustom(true)}
                        className="press flex h-10 items-center gap-1.5 rounded-full border border-dashed border-primary/40 ps-3 pe-4 text-[15px] text-primary"
                    >
                        <Plus className="size-4" />
                        ساعت دیگر
                    </button>
                )}
            </div>

            {custom && (
                <div className="animate-page-in space-y-3 rounded-xl bg-card p-3">
                    {/* ساعت از چپ به راست خوانده می‌شود: ساعت : دقیقه */}
                    <div dir="ltr" className="flex items-center gap-2">
                        <WheelPicker
                            className="flex-1"
                            label="ساعت"
                            items={HOURS}
                            value={String(hour)}
                            getKey={String}
                            onChange={(k) => setHour(Number(k))}
                            render={(h, selected) => <span className={cn("num", selected && "font-semibold")}>{two(h)}</span>}
                        />
                        <span className="num text-[17px] font-semibold">:</span>
                        <WheelPicker
                            className="flex-1"
                            label="دقیقه"
                            items={MINUTES}
                            value={String(minute)}
                            getKey={String}
                            onChange={(k) => setMinute(Number(k))}
                            render={(m, selected) => <span className={cn("num", selected && "font-semibold")}>{two(m)}</span>}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="icon" className="size-11" aria-label="انصراف" onClick={() => setCustom(false)}>
                            <X />
                        </Button>
                        <Button className="flex-1" aria-label={`افزودن ${formatTime(hour * 60 + minute)}`} onClick={addCustom}>
                            <Check /> <span className="num">{formatTime(hour * 60 + minute)}</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ساعت‌ها را ذخیره می‌کند و اگر یادآوری روشن است، اجازهٔ اعلان می‌گیرد
export async function applyReminders(userId: string, times: number[]): Promise<PushStatus | null> {
    await saveReminderTimes(userId, times)
    if (times.length === 0) return null
    try {
        return await enablePush()
    } catch (error) {
        toast(error instanceof Error ? error.message : "فعال کردن اعلان انجام نشد", "error")
        return pushStatus()
    }
}

function ReminderSheet({
    open,
    onOpenChange,
    times,
    onSaved,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    times: number[]
    onSaved: (times: number[], status: PushStatus | null) => void
}) {
    const userId = useLogStore((s) => s.userId)
    const [value, setValue] = useState(times)
    const [prevOpen, setPrevOpen] = useState(open)
    const [isSaving, setIsSaving] = useState(false)

    if (open !== prevOpen) {
        setPrevOpen(open)
        if (open) setValue(times)
    }

    const save = async () => {
        if (!userId) return
        setIsSaving(true)
        try {
            const status = await applyReminders(userId, value)
            haptic([10, 40, 10])
            toast(value.length ? "یادآوری‌ها ذخیره شد" : "یادآوری خاموش شد", "success")
            onSaved(value, status)
            onOpenChange(false)
        } catch {
            toast("ذخیره نشد؛ اتصال اینترنت رو چک کن", "error")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogNav
                    title="یادآوری روزانه"
                    action={
                        <Button size="icon" aria-label="ذخیره" onClick={save} disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
                        </Button>
                    }
                />
                <DialogBody>
                    <div className="space-y-3">
                        <p className="px-1 text-[15px] leading-6 text-muted-foreground">
                            هر روز این ساعت‌ها یه اعلان می‌گیری که خرج و دخلت رو ثبت کنی. هیچی انتخاب نکنی، یادآوری خاموش می‌شه.
                        </p>
                        <ReminderPicker value={value} onChange={setValue} />
                        {pushStatusHint(pushStatus()) && (
                            <p className="px-1 text-[13px] leading-5 text-muted-foreground">{pushStatusHint(pushStatus())}</p>
                        )}
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    )
}

// ردیف یادآوری در صفحهٔ حساب
export function ReminderSettings() {
    const userId = useLogStore((s) => s.userId)
    const [times, setTimes] = useState<number[] | null>(null)
    const [status, setStatus] = useState<PushStatus | null>(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!userId) return
        let cancelled = false
        loadReminderTimes()
            .then((t) => !cancelled && setTimes(t ?? []))
            .catch(() => !cancelled && setTimes([]))
        // eslint-disable-next-line react-hooks/set-state-in-effect -- وضعیت اجازه فقط سمت کاربر معلوم است
        setStatus(pushStatus())
        return () => {
            cancelled = true
        }
    }, [userId])

    const on = !!times?.length
    const blocked = on && status !== "granted"

    return (
        <>
            <Group
                title="یادآوری"
                footer={blocked ? pushStatusHint(status) ?? "برای گرفتن اعلان، بزن و اجازه بده." : undefined}
            >
                <Row
                    onClick={() => setOpen(true)}
                    leading={<IconTile color="oklch(0.65 0.2 25)"><Bell /></IconTile>}
                    title="یادآوری روزانه"
                    trailing={
                        times === null ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                            <span className={cn("num text-[15px]", blocked ? "text-primary" : "text-muted-foreground")}>
                                {on ? formatTimes(times) : "خاموش"}
                            </span>
                        )
                    }
                    chevron
                />
            </Group>
            <ReminderSheet
                open={open}
                onOpenChange={setOpen}
                times={times ?? []}
                onSaved={(t, s) => {
                    setTimes(t)
                    setStatus(s ?? pushStatus())
                }}
            />
        </>
    )
}

// لمس اعلان یادآوری شیت ثبت را باز می‌کند؛ اشتراک دستگاه هم با هر بار باز شدن تازه می‌شود
export function ReminderBridge() {
    const openAdd = useUiStore((s) => s.openAdd)
    const userId = useLogStore((s) => s.userId)

    useEffect(() => {
        if (new URLSearchParams(window.location.search).get("add") !== "1") return
        window.history.replaceState(null, "", window.location.pathname)
        openAdd()
    }, [openAdd])

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return
        const onMessage = (event: MessageEvent) => {
            if (event.data?.type === "OPEN_ADD") openAdd()
        }
        navigator.serviceWorker.addEventListener("message", onMessage)
        return () => navigator.serviceWorker.removeEventListener("message", onMessage)
    }, [openAdd])

    useEffect(() => {
        if (userId) refreshPush().catch(() => {})
    }, [userId])

    return null
}
