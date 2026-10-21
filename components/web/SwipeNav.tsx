"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"

import { TABS, tabIndex } from "@/lib/nav"
import { haptic } from "@/lib/utils"

// کشیدن افقی روی صفحه برای رفتن به تب کناری (مثل تلگرام)
export function SwipeNav({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const current = TABS.indexOf(pathname as (typeof TABS)[number])
        if (current === -1) return

        let start: { x: number; y: number; t: number } | null = null

        const onStart = (e: TouchEvent) => {
            const touch = e.touches[0]
            const target = e.target as HTMLElement
            // لبه‌ها مال حرکت «برگشت» مرورگرند؛ کنترل‌های کشیدنی هم مستثنا هستند
            const edge = touch.clientX < 24 || touch.clientX > window.innerWidth - 24
            if (e.touches.length > 1 || edge || target.closest("input, textarea, [data-no-swipe]")) {
                start = null
                return
            }
            start = { x: touch.clientX, y: touch.clientY, t: Date.now() }
        }

        const onEnd = (e: TouchEvent) => {
            if (!start) return
            const touch = e.changedTouches[0]
            const dx = touch.clientX - start.x
            const dy = touch.clientY - start.y
            const fast = Date.now() - start.t < 600
            start = null
            if (!fast || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return

            // راست‌به‌چپ: کشیدن به راست یعنی تب بعدی (سمت چپ)
            const next = current + (dx > 0 ? 1 : -1)
            if (next < 0 || next >= TABS.length) return
            haptic()
            router.push(TABS[next])
        }

        el.addEventListener("touchstart", onStart, { passive: true })
        el.addEventListener("touchend", onEnd, { passive: true })
        return () => {
            el.removeEventListener("touchstart", onStart)
            el.removeEventListener("touchend", onEnd)
        }
    }, [pathname, router])

    // پیش‌بارگذاری تب‌ها تا جابه‌جایی فوری باشد
    useEffect(() => {
        for (const href of TABS) router.prefetch(href)
    }, [router])

    return (
        <div ref={ref} className="min-h-full" data-tab={tabIndex(pathname)}>
            {children}
        </div>
    )
}
