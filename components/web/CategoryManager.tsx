"use client"

import { SubmitEvent, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ColorPicker } from "@/components/web/ColorPicker"
import { Group } from "@/components/web/Group"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import { suggestColor } from "@/lib/palette"
import { Category, LogKind } from "@/lib/types"
import { cn, haptic } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import { toast } from "@/store/useToastStore"

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
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const usedCount = category ? entries.filter((e) => e.key === category.id).length : 0

    const handleSubmit = (e: SubmitEvent) => {
        e.preventDefault()
        if (!label.trim()) return
        try {
            if (category) updateCategory(category.id, { label, color })
            else addCategory(kind, label, color)
            haptic([10, 40, 10])
            toast(category ? "دسته‌بندی ویرایش شد" : "دسته‌بندی اضافه شد", "success")
            onDone()
        } catch (err) {
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
        <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
                <span
                    className="mx-auto mb-1 grid size-16 place-items-center rounded-full text-2xl font-bold text-white shadow-lg transition-colors duration-500"
                    style={{ backgroundColor: color }}
                >
                    {label.trim().charAt(0) || "؟"}
                </span>
                <DialogTitle>{category ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle>
                <DialogDescription>{kind === "cost" ? "برای هزینه‌ها" : "برای درآمدها"}</DialogDescription>
            </DialogHeader>

            <Input
                autoFocus={!category}
                value={label}
                onChange={(e) => {
                    setLabel(e.target.value)
                    setError(null)
                }}
                placeholder="نام دسته‌بندی"
                maxLength={40}
                aria-invalid={!!error}
            />
            {error && <p className="-mt-3 animate-item-in px-1 text-sm text-destructive">{error}</p>}

            <ColorPicker value={color} onChange={setColor} />

            {confirmDelete && usedCount > 0 && (
                <p className="animate-item-in rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
                    این دسته در {usedCount.toLocaleString("fa-IR")} تراکنش استفاده شده. بعد از حذف، آن تراکنش‌ها بدون دسته‌بندی می‌شوند.
                </p>
            )}

            <div className="flex gap-2 pb-2">
                {category && (
                    <Button
                        type="button"
                        variant={confirmDelete ? "destructive" : "secondary"}
                        size="lg"
                        onClick={handleDelete}
                        className={cn("transition-all duration-300", confirmDelete ? "flex-1" : "w-12 px-0")}
                        aria-label="حذف"
                    >
                        <Trash2 />
                        {confirmDelete && <span className="animate-item-in">حذف کن</span>}
                    </Button>
                )}
                <Button type="submit" size="lg" className="flex-1" disabled={!label.trim()}>
                    {category ? "ذخیره" : "افزودن"}
                </Button>
            </div>
        </form>
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

    const openForm = (category?: Category) => {
        haptic()
        setEditing(category)
        setFormKey((k) => k + 1)
        setOpen(true)
    }

    return (
        <div className="space-y-5">
            <SegmentedControl
                value={kind}
                onChange={setKind}
                options={[
                    { value: "cost", label: "هزینه" },
                    { value: "income", label: "درآمد" },
                ]}
            />

            {isLoading ? (
                <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            ) : (
                <Group
                    key={kind}
                    footer="با لمس هر دسته می‌تونی اسم و رنگش رو عوض کنی یا حذفش کنی."
                >
                    {categories.map((category, i) => {
                        const count = entries.filter((e) => e.key === category.id).length
                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => openForm(category)}
                                className="stagger flex min-h-14 w-full animate-item-in items-center gap-3 px-4 py-2.5 text-right transition-colors active:bg-muted"
                                style={{ "--i": i } as React.CSSProperties}
                            >
                                <span
                                    className="grid size-9 shrink-0 place-items-center rounded-full font-bold text-white transition-colors duration-500"
                                    style={{ backgroundColor: category.color }}
                                >
                                    {category.label.charAt(0)}
                                </span>
                                <span className="flex-1 truncate font-medium">{category.label}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {count > 0 ? `${count.toLocaleString("fa-IR")} تراکنش` : ""}
                                </span>
                            </button>
                        )
                    })}
                    <button
                        type="button"
                        onClick={() => openForm()}
                        className="flex min-h-14 w-full items-center gap-3 px-4 text-right font-medium text-primary transition-colors active:bg-muted"
                    >
                        <span className="grid size-9 place-items-center rounded-full bg-accent">
                            <Plus className="size-5" />
                        </span>
                        دسته‌بندی جدید
                    </button>
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
