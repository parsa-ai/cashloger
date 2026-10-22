"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { cn, haptic } from "@/lib/utils"

const ROW = 38
// تعداد ردیف‌های دیده‌شده؛ فرد تا یکی دقیقاً وسط باشد (۳ تا تا جمع‌وجور بماند)
const VISIBLE = 3
const PAD = ((VISIBLE - 1) / 2) * ROW

// چرخ انتخاب به سبک ساعت iOS: با اسکرول بومی و اسنپ می‌چرخد، ردیف‌ها روی استوانه خم می‌شوند
// و اگر گزینه کافی باشد بی‌انتها دور می‌زند (فهرست چند بار تکرار می‌شود و بعد از ایستادن بی‌صدا به نسخهٔ وسط می‌پرد)
export function WheelPicker<T>({
    items,
    value,
    getKey,
    render,
    onChange,
    label,
    className,
}: {
    items: T[]
    value: string | null
    getKey: (item: T) => string
    render: (item: T, selected: boolean) => React.ReactNode
    onChange: (key: string) => void
    label: string
    className?: string
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const tick = useRef(-1)
    const latest = useRef({ items, value, getKey, onChange })
    useEffect(() => {
        latest.current = { items, value, getKey, onChange }
    })

    const n = items.length
    const loop = n >= 4
    // تعداد فرد نسخه‌ها تا یک نسخهٔ وسط داشته باشیم
    const reps = loop ? Math.max(5, Math.ceil(60 / n)) | 1 : 1
    const middle = loop ? Math.floor(reps / 2) * n : 0
    const rows = Array.from({ length: n * reps }, (_, i) => items[i % n])

    // خم کردن ردیف‌ها بر اساس فاصله از وسط؛ مستقیم روی DOM تا هر فریم رندر نشود
    const paint = () => {
        const el = scrollRef.current
        const list = listRef.current
        if (!el || !list) return
        const center = el.scrollTop / ROW
        const first = Math.max(0, Math.floor(center) - VISIBLE)
        const last = Math.min(list.children.length - 1, Math.ceil(center) + VISIBLE)
        for (let i = first; i <= last; i++) {
            const row = list.children[i] as HTMLElement
            const d = Math.max(-3, Math.min(3, i - center))
            row.style.transform = `perspective(300px) rotateX(${-d * 32}deg) scale(${1 - Math.abs(d) * 0.08})`
            row.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 0.55))
            row.setAttribute("aria-selected", String(Math.round(center) === i))
        }
    }

    const indexOf = (key: string | null) => {
        const i = latest.current.items.findIndex((item) => latest.current.getKey(item) === key)
        return Math.max(0, i)
    }

    // جای اولیه: گزینهٔ انتخاب‌شده در نسخهٔ وسط
    useLayoutEffect(() => {
        const el = scrollRef.current
        if (!el || !n) return
        const i = middle + indexOf(latest.current.value)
        tick.current = i
        el.scrollTop = i * ROW
        paint()
    }, [n, middle])

    useEffect(() => {
        const el = scrollRef.current
        if (!el || !n) return
        let timer: ReturnType<typeof setTimeout> | undefined

        const settle = () => {
            let i = Math.round(el.scrollTop / ROW)
            // بعد از ایستادن، بی‌صدا به همان گزینه در نسخهٔ وسط برمی‌گردیم تا چرخ تمام نشود
            if (loop && Math.abs(i - (middle + (i % n))) > 0) {
                i = middle + (i % n)
                tick.current = i
                el.scrollTop = i * ROW
                paint()
            }
            const { items, value, getKey, onChange } = latest.current
            const key = getKey(items[i % n])
            if (key !== value) onChange(key)
        }

        const onScroll = () => {
            paint()
            const i = Math.round(el.scrollTop / ROW)
            if (i !== tick.current) {
                tick.current = i
                haptic(3)
            }
            clearTimeout(timer)
            timer = setTimeout(settle, 140)
        }

        el.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            el.removeEventListener("scroll", onScroll)
            clearTimeout(timer)
        }
    }, [n, loop, middle])

    // تغییر مقدار از بیرون: از کوتاه‌ترین مسیر می‌چرخد
    useEffect(() => {
        const el = scrollRef.current
        if (!el || !n || value === null) return
        const current = Math.round(el.scrollTop / ROW)
        const target = indexOf(value)
        if (current % n === target) return
        let delta = target - (current % n)
        if (loop && Math.abs(delta) > n / 2) delta -= Math.sign(delta) * n
        el.scrollTo({ top: (current + delta) * ROW, behavior: "smooth" })
    }, [value, n, loop])

    const scrollToRow = (i: number) => {
        scrollRef.current?.scrollTo({ top: i * ROW, behavior: "smooth" })
    }

    return (
        <div className={cn("relative", className)} style={{ height: VISIBLE * ROW }}>
            {/* نوار انتخاب وسط */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 rounded-lg bg-card" style={{ top: PAD, height: ROW }} />
            <div
                ref={scrollRef}
                role="listbox"
                aria-label={label}
                tabIndex={0}
                data-no-swipe
                onKeyDown={(e) => {
                    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
                    e.preventDefault()
                    const i = Math.round(e.currentTarget.scrollTop / ROW)
                    scrollToRow(i + (e.key === "ArrowDown" ? 1 : -1))
                }}
                className="no-scrollbar relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)]"
            >
                <div ref={listRef} style={{ paddingBlock: PAD }}>
                    {rows.map((item, i) => (
                        <div
                            key={i}
                            role="option"
                            aria-selected={false}
                            onClick={() => {
                                haptic()
                                scrollToRow(i)
                            }}
                            className="flex snap-center items-center justify-center gap-2 text-[15px] will-change-transform select-none"
                            style={{ height: ROW }}
                        >
                            {render(item, getKey(item) === value)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
