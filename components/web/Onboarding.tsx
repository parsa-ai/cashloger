"use client"

import { useState } from "react"
import { Check, Loader2, Plus } from "lucide-react"
import { happy } from "blobatar/expression"

import { Button } from "@/components/ui/button"
import { UserBlob } from "@/components/web/Avatars"
import { ReminderPicker, applyReminders, pushStatusHint } from "@/components/web/Reminders"
import { useBlobName } from "@/components/web/ProfileProvider"
import { BASE_CATEGORIES, BaseCategory, MIN_ONBOARDING_CATEGORIES } from "@/lib/categories"
import { suggestColor } from "@/lib/palette"
import { pushStatus } from "@/lib/push"
import { DEFAULT_REMINDERS } from "@/lib/reminders"
import { LogKind } from "@/lib/types"
import { cn, haptic } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"

const keyOf = (c: BaseCategory) => `${c.kind}:${c.label}`

// کاربر تازه‌وارد (بدون هیچ دسته و تراکنشی) اول دسته‌هایش را انتخاب می‌کند، بعد ساعت یادآوری را
export function Onboarding() {
    const needed = useLogStore(
        (s) =>
            !!s.userId &&
            !s.isLoading &&
            s.lastSyncedAt !== null &&
            s.categories.length === 0 &&
            s.entries.length === 0 &&
            s.queue.length === 0
    )
    const [step, setStep] = useState<"categories" | "reminders" | "done">("categories")

    // بعد از ساختن دسته‌ها «needed» دیگر برقرار نیست؛ مرحلهٔ یادآوری مستقل از آن می‌ماند
    if (step === "reminders") return <ReminderStep onDone={() => setStep("done")} />
    if (!needed || step === "done") return null
    return <OnboardingScreen onDone={() => setStep("reminders")} />
}

function ReminderStep({ onDone }: { onDone: () => void }) {
    const blobName = useBlobName()
    const userId = useLogStore((s) => s.userId)
    const [times, setTimes] = useState(DEFAULT_REMINDERS)
    const [isSaving, setIsSaving] = useState(false)
    const [hint] = useState(() => pushStatusHint(pushStatus()))

    const finish = async () => {
        if (!userId || times.length === 0) return
        setIsSaving(true)
        try {
            const status = await applyReminders(userId, times)
            haptic([10, 40, 10])
            toast(status === "granted" ? "یادآوری روشن شد" : "ساعت‌ها ذخیره شد", "success")
            onDone()
        } catch {
            toast("ذخیره نشد؛ بعداً از صفحهٔ حساب روشنش کن", "error")
            onDone()
        }
    }

    return (
        <div className="fixed inset-0 z-[55] flex animate-page-in flex-col bg-background">
            <div className="no-scrollbar flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+32px)] pb-6">
                <div className="mx-auto max-w-md space-y-8">
                    <header className="flex flex-col items-center text-center">
                        <UserBlob name={blobName} size={80} expression={happy} />
                        <h1 className="mt-4 text-[24px] font-bold">کی یادت بندازیم؟</h1>
                        <p className="mt-1.5 text-[15px] leading-6 text-muted-foreground">
                            هر روز این ساعت‌ها یه اعلان می‌فرستیم که خرج و دخلت یادت نره.
                            <br />
                            از صفحهٔ حساب هم می‌تونی عوضشون کنی.
                        </p>
                    </header>
                    <ReminderPicker value={times} onChange={setTimes} />
                    {hint && <p className="px-1 text-[13px] leading-5 text-muted-foreground">{hint}</p>}
                </div>
            </div>

            <div className="space-y-1 border-t border-separator bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
                <div className="mx-auto max-w-md space-y-1">
                    <Button size="lg" className="w-full" disabled={isSaving || times.length === 0} onClick={finish}>
                        {isSaving ? <Loader2 className="animate-spin" /> : times.length ? "یادم بنداز" : "یه ساعت انتخاب کن"}
                    </Button>
                    <Button variant="plain" className="w-full text-muted-foreground" disabled={isSaving} onClick={onDone}>
                        فعلاً نه
                    </Button>
                </div>
            </div>
        </div>
    )
}

function OnboardingScreen({ onDone }: { onDone: () => void }) {
    const blobName = useBlobName()
    const addCategory = useLogStore((s) => s.addCategory)
    const [items, setItems] = useState(BASE_CATEGORIES)
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const count = selected.size
    const ready = count >= MIN_ONBOARDING_CATEGORIES

    const toggle = (c: BaseCategory) => {
        haptic()
        const next = new Set(selected)
        if (next.has(keyOf(c))) next.delete(keyOf(c))
        else next.add(keyOf(c))
        setSelected(next)
    }

    const addCustom = (kind: LogKind, label: string) => {
        const trimmed = label.trim()
        if (!trimmed) return
        const existing = items.find((c) => c.kind === kind && c.label === trimmed)
        const item = existing ?? {
            kind,
            label: trimmed,
            color: suggestColor(items.filter((c) => c.kind === kind && selected.has(keyOf(c))).map((c) => c.color)),
        }
        if (!existing) setItems([...items, item])
        setSelected(new Set(selected).add(keyOf(item)))
        haptic()
    }

    const finish = () => {
        if (!ready) return
        for (const c of items) {
            if (!selected.has(keyOf(c))) continue
            try {
                addCategory(c.kind, c.label, c.color)
            } catch {
                // تکراری؛ نادیده بگیر
            }
        }
        haptic([10, 40, 10])
        toast("دسته‌ها آماده‌اند", "success")
        onDone()
    }

    return (
        <div className="fixed inset-0 z-[55] flex animate-page-in flex-col bg-background">
            <div className="no-scrollbar flex-1 overflow-y-auto px-4 pt-[calc(env(safe-area-inset-top)+32px)] pb-6">
                <div className="mx-auto max-w-md space-y-8">
                    <header className="flex flex-col items-center text-center">
                        <UserBlob name={blobName} size={80} expression={happy} />
                        <h1 className="mt-4 text-[24px] font-bold">خوش اومدی!</h1>
                        <p className="mt-1.5 text-[15px] leading-6 text-muted-foreground">
                            دسته‌هایی که به کارت میاد رو انتخاب کن؛ حداقل {MIN_ONBOARDING_CATEGORIES.toLocaleString("fa-IR")} تا.
                            <br />
                            بعداً هم می‌تونی عوضشون کنی.
                        </p>
                    </header>

                    {(["cost", "income"] as const).map((kind) => (
                        <section key={kind}>
                            <h2 className="mb-2.5 px-1 text-[13px] font-medium text-muted-foreground">
                                {kind === "cost" ? "هزینه‌ها" : "درآمدها"}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {items
                                    .filter((c) => c.kind === kind)
                                    .map((c) => {
                                        const on = selected.has(keyOf(c))
                                        return (
                                            <button
                                                key={c.label}
                                                type="button"
                                                aria-pressed={on}
                                                onClick={() => toggle(c)}
                                                className={cn(
                                                    "press flex h-10 items-center gap-2 rounded-full ps-3 pe-4 text-[15px] transition-colors duration-200",
                                                    on ? "bg-tint font-semibold text-primary" : "bg-card"
                                                )}
                                            >
                                                <span
                                                    className="grid size-5 place-items-center rounded-full text-white"
                                                    style={{ backgroundColor: c.color }}
                                                >
                                                    {on && <Check className="size-3 animate-pop" strokeWidth={3.5} />}
                                                </span>
                                                {c.label}
                                            </button>
                                        )
                                    })}
                                <CustomChip onAdd={(label) => addCustom(kind, label)} />
                            </div>
                        </section>
                    ))}
                </div>
            </div>

            <div className="border-t border-separator bg-background px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
                <div className="mx-auto max-w-md">
                    <Button size="lg" className="w-full" disabled={!ready} onClick={finish}>
                        {ready
                            ? `شروع با ${count.toLocaleString("fa-IR")} دسته`
                            : `${(MIN_ONBOARDING_CATEGORIES - count).toLocaleString("fa-IR")} دستهٔ دیگر انتخاب کن`}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// تراشهٔ «دستهٔ دیگر» که با لمس به فیلد نوشتن تبدیل می‌شود
function CustomChip({ onAdd }: { onAdd: (label: string) => void }) {
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState("")

    const commit = () => {
        if (value.trim()) onAdd(value)
        setValue("")
        setEditing(false)
    }

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="press flex h-10 items-center gap-1.5 rounded-full border border-dashed border-primary/40 ps-3 pe-4 text-[15px] text-primary"
            >
                <Plus className="size-4" />
                دستهٔ دیگر
            </button>
        )
    }

    return (
        <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === "Enter") commit()
                if (e.key === "Escape") {
                    setValue("")
                    setEditing(false)
                }
            }}
            maxLength={40}
            enterKeyHint="done"
            placeholder="اسم دسته"
            className="h-10 w-36 rounded-full bg-card px-4 text-[16px] outline-none ring-2 ring-primary/40 placeholder:text-muted-foreground/70"
        />
    )
}
