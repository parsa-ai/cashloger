"use client"

import { SubmitEvent, useMemo, useState } from "react"
import { Check, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogNav } from "@/components/ui/dialog"
import { CategoryAvatar } from "@/components/web/Avatars"
import { ColorPicker } from "@/components/web/ColorPicker"
import { Group, Row } from "@/components/web/Group"
import { MoneyInput } from "@/components/web/MoneyInput"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { suggestColor } from "@/lib/palette"
import { Category, LogKind } from "@/lib/types"
import { formatAmountWords, formatMoney, haptic } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"

const FORM_ID = "category-form"

interface CategoryFormProps {
    kind: LogKind
    category?: Category
    onDone: () => void
}

function CategoryForm({ kind, category, onDone }: CategoryFormProps) {
    const categories = useLogStore((s) => s.categories)
    const entries = useLogStore((s) => s.entries)
    const addCategory = useLogStore((s) => s.addCategory)
    const updateCategory = useLogStore((s) => s.updateCategory)
    const removeCategory = useLogStore((s) => s.removeCategory)

    const [label, setLabel] = useState(category?.label ?? "")
    const [color, setColor] = useState(
        () => category?.color ?? suggestColor(categories.filter((c) => c.kind === kind).map((c) => c.color))
    )
    const [budgetValue, setBudgetValue] = useState(category?.budget ?? null)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const usedCount = category ? entries.filter((e) => e.key === category.id).length : 0
    const trimmed = label.trim()
    const budget = kind === "cost" ? budgetValue : null
    const unchanged =
        category && trimmed === category.label && color === category.color && budget === (category.budget ?? null)

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault()
        if (!trimmed) return
        if (unchanged) {
            onDone()
            return
        }
        try {
            if (category) updateCategory(category.id, { label: trimmed, color, budget })
            else addCategory(kind, trimmed, color, budget)
            haptic([10, 40, 10])
            toast(category ? "دسته‌بندی ویرایش شد" : "دسته‌بندی اضافه شد", "success")
            onDone()
        } catch (err) {
            haptic([30, 40, 30])
            setError(err instanceof Error ? err.message : "خطا در ذخیره")
        }
    }

    const handleDelete = () => {
        if (!category) return
        if (!confirmDelete) {
            setConfirmDelete(true)
            haptic()
            return
        }
        removeCategory(category.id)
        toast("دسته‌بندی حذف شد")
        onDone()
    }

    return (
        <>
            <DialogNav
                title={category ? "ویرایش دسته" : kind === "cost" ? "دستهٔ هزینهٔ جدید" : "دستهٔ درآمد جدید"}
                action={
                    <Button type="submit" form={FORM_ID} size="icon" aria-label={category ? "ذخیره" : "افزودن"} disabled={!trimmed}>
                        <Check />
                    </Button>
                }
            />
            <DialogBody>
                <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
                    <Group footer={error ? <span className="text-destructive">{error}</span> : undefined}>
                        <div className="flex items-center gap-3 ps-3 pe-4">
                            <CategoryAvatar label={trimmed || "؟"} color={color} size={36} />
                            <input
                                value={label}
                                onChange={(e) => {
                                    setLabel(e.target.value)
                                    setError(null)
                                }}
                                placeholder="نام دسته‌بندی"
                                maxLength={40}
                                enterKeyHint="done"
                                aria-invalid={!!error}
                                className="h-[52px] min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/70"
                            />
                        </div>
                    </Group>

                    {kind === "cost" && (
                        <Group
                            title="بودجهٔ ماهانه"
                            footer={
                                budget
                                    ? `${formatAmountWords(budget) || formatMoney(budget)} تومان در ماه`
                                    : "اختیاری؛ اگر بگذاری، در خانه می‌بینی چقدر از آن خرج شده."
                            }
                        >
                            <MoneyInput value={budget} onChange={setBudgetValue} placeholder="بدون بودجه" label="بودجهٔ ماهانه" />
                        </Group>
                    )}

                    <Group title="رنگ">
                        <ColorPicker value={color} onChange={setColor} />
                    </Group>

                    {category && (
                        <Group
                            footer={
                                confirmDelete
                                    ? usedCount > 0
                                        ? `این دسته در ${usedCount.toLocaleString("fa-IR")} تراکنش استفاده شده؛ آن تراکنش‌ها بدون دسته‌بندی می‌شوند. برای حذف دوباره بزن.`
                                        : "برای حذف دوباره بزن."
                                    : undefined
                            }
                        >
                            <Row
                                onClick={handleDelete}
                                tone="destructive"
                                title={<span className="block text-center font-medium">{confirmDelete ? "مطمئنم، حذف شود" : "حذف دسته‌بندی"}</span>}
                            />
                        </Group>
                    )}
                </form>
            </DialogBody>
        </>
    )
}

export function CategoryManager() {
    const [kind, setKind] = useState<LogKind>("cost")
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Category | undefined>()
    const [formKey, setFormKey] = useState(0)

    const isLoading = useLogStore((s) => s.isLoading)
    const allCategories = useLogStore((s) => s.categories)
    const entries = useLogStore((s) => s.entries)
    const categories = useMemo(() => allCategories.filter((c) => c.kind === kind), [allCategories, kind])

    const counts = useMemo(() => {
        const map = new Map<string, number>()
        for (const e of entries) if (e.key) map.set(e.key, (map.get(e.key) ?? 0) + 1)
        return map
    }, [entries])

    const openForm = (category?: Category) => {
        haptic()
        setEditing(category)
        setFormKey((k) => k + 1)
        setOpen(true)
    }

    return (
        <div className="space-y-6">
            <SegmentedControl
                value={kind}
                onChange={setKind}
                options={[
                    { value: "cost", label: "هزینه" },
                    { value: "income", label: "درآمد" },
                ]}
            />

            {isLoading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
            ) : (
                <Group footer="روی هر دسته بزن تا اسم یا رنگش رو عوض کنی یا حذفش کنی.">
                    {categories.map((category) => {
                        const count = counts.get(category.id) ?? 0
                        return (
                            <Row
                                key={category.id}
                                onClick={() => openForm(category)}
                                leading={<CategoryAvatar label={category.label} color={category.color} size={36} />}
                                title={category.label}
                                subtitle={category.budget ? `بودجه: ${formatMoney(category.budget)} تومان` : undefined}
                                trailing={
                                    count > 0 && (
                                        <span className="num text-[13px] text-muted-foreground">{count.toLocaleString("fa-IR")}</span>
                                    )
                                }
                                chevron
                            />
                        )
                    })}
                    <Row
                        onClick={() => openForm()}
                        leading={
                            <span className="grid size-9 place-items-center rounded-full bg-tint text-primary">
                                <Plus className="size-5" />
                            </span>
                        }
                        title="دسته‌بندی جدید"
                        tone="primary"
                    />
                </Group>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <CategoryForm key={formKey} kind={kind} category={editing} onDone={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    )
}
