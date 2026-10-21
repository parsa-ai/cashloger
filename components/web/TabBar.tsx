"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChartPie, Plus, ReceiptText } from "lucide-react"

import { TABS, tabIndex } from "@/lib/nav"
import { cn, haptic } from "@/lib/utils"
import { useUiStore } from "@/store/useUiStore"

const ITEMS = [
    { label: "خلاصه", icon: ChartPie },
    { label: "تراکنش‌ها", icon: ReceiptText },
]

// نوار تب شناور شیشه‌ای؛ نشانگر را می‌شود با انگشت روی تب دیگر کشید
export function TabBar() {
    const pathname = usePathname()
    const router = useRouter()
    const openAdd = useUiStore((s) => s.openAdd)
    const active = tabIndex(pathname)

    const barRef = useRef<HTMLDivElement>(null)
    const drag = useRef<{ x: number; dragging: boolean } | null>(null)
    const [dragIndex, setDragIndex] = useState<number | null>(null)

    const indexAt = (clientX: number) => {
        const rect = barRef.current!.getBoundingClientRect()
        // راست‌به‌چپ: تب اول سمت راست است
        const i = Math.floor(((rect.right - clientX) / rect.width) * TABS.length)
        return Math.min(TABS.length - 1, Math.max(0, i))
    }

    const onPointerDown = (e: React.PointerEvent) => {
        drag.current = { x: e.clientX, dragging: false }
    }

    const onPointerMove = (e: React.PointerEvent) => {
        const d = drag.current
        if (!d) return
        if (!d.dragging && Math.abs(e.clientX - d.x) > 8) {
            d.dragging = true
            barRef.current?.setPointerCapture(e.pointerId)
        }
        if (d.dragging) {
            const i = indexAt(e.clientX)
            if (i !== (dragIndex ?? active)) haptic(4)
            setDragIndex(i)
        }
    }

    const onPointerEnd = () => {
        const d = drag.current
        drag.current = null
        if (d?.dragging && dragIndex !== null && dragIndex !== active) router.push(TABS[dragIndex])
        setDragIndex(null)
    }

    const shown = dragIndex ?? active

    return (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),12px)]">
            <div className="mx-auto flex max-w-md items-center gap-2.5 px-4">
                {/* دکمهٔ افزودن: دایرهٔ شیشه‌ای هم‌قد نوار، سمت راست */}
                <button
                    type="button"
                    aria-label="تراکنش جدید"
                    onClick={() => {
                        haptic()
                        openAdd()
                    }}
                    className="glass press-scale pointer-events-auto grid size-14 shrink-0 place-items-center rounded-full text-primary"
                >
                    <Plus className="size-6" strokeWidth={2.6} />
                </button>
                <div
                    ref={barRef}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                    className="glass pointer-events-auto relative grid h-14 flex-1 touch-none rounded-full p-1"
                    style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}
                >
                    {shown >= 0 && (
                        <span
                            aria-hidden
                            className={cn(
                                "absolute inset-y-1 right-1 rounded-full bg-fill-strong transition-transform ease-ios",
                                dragIndex !== null ? "duration-200" : "duration-[400ms]"
                            )}
                            style={{
                                width: `calc((100% - 8px) / ${TABS.length})`,
                                transform: `translateX(${-shown * 100}%) scale(${dragIndex !== null ? 1.06 : 1})`,
                            }}
                        />
                    )}
                    {TABS.map((href, i) => {
                        const { label, icon: Icon } = ITEMS[i]
                        const on = i === shown
                        return (
                            <Link
                                key={href}
                                href={href}
                                draggable={false}
                                onClick={() => i !== active && haptic()}
                                aria-current={i === active ? "page" : undefined}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition-colors duration-200",
                                    on ? "text-primary" : "text-foreground/70"
                                )}
                            >
                                <Icon className="size-[22px]" strokeWidth={on ? 2.2 : 1.8} />
                                {label}
                            </Link>
                        )
                    })}
                </div>

            </div>
        </nav>
    )
}
