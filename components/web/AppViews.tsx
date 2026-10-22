"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import { CategoryManager } from "@/components/web/CategoryManager"
import { HomeView } from "@/components/web/HomeView"
import { TransactionList } from "@/components/web/TransactionList"
import { UserView } from "@/components/web/UserView"
import { ViewActiveContext } from "@/components/web/ViewActive"
import { routeIndex, tabIndex } from "@/lib/nav"

const VIEWS: Record<string, React.ComponentType> = {
    "/": HomeView,
    "/logs": TransactionList,
    "/user": UserView,
    "/categories": CategoryManager,
}

const ANIMATIONS = ["animate-page-in", "animate-slide-next", "animate-slide-prev"]

// همهٔ صفحه‌های برنامه اینجا از روی مسیر رندر می‌شوند (نه با درخواست به سرور)، پس عوض شدن صفحه
// همان لحظه است و آفلاین هم کار می‌کند. صفحه‌های دیده‌شده زنده می‌مانند تا برگشتن به آن‌ها هم فوری باشد.
export function AppViews({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [mounted, setMounted] = useState<string[]>(() => (VIEWS[pathname] ? [pathname] : []))
    const refs = useRef(new Map<string, HTMLDivElement>())
    const lastPath = useRef<string | null>(null)

    // تب‌ها زنده می‌مانند؛ صفحه‌های داخلی (با شیت‌های باز احتمالی) با ترک شدن بسته می‌شوند
    const next = [...mounted.filter((p) => p === pathname || tabIndex(p) !== -1)]
    if (VIEWS[pathname] && !next.includes(pathname)) next.push(pathname)
    if (next.length !== mounted.length || next.some((p, i) => p !== mounted[i])) setMounted(next)

    useLayoutEffect(() => {
        const from = lastPath.current
        lastPath.current = pathname
        const el = refs.current.get(pathname)
        if (!el || from === pathname) return

        let animation = "animate-page-in"
        if (from !== null && routeIndex(from) !== -1) {
            animation = routeIndex(pathname) > routeIndex(from) ? "animate-slide-next" : "animate-slide-prev"
            window.scrollTo(0, 0)
        }
        el.classList.remove(...ANIMATIONS)
        void el.offsetWidth
        el.classList.add(animation)
    }, [pathname])

    if (!VIEWS[pathname]) return <>{children}</>

    return (
        <>
            {mounted.map((path) => {
                const View = VIEWS[path]
                return (
                    <div
                        key={path}
                        ref={(el) => {
                            if (el) refs.current.set(path, el)
                            else refs.current.delete(path)
                        }}
                        hidden={path !== pathname}
                    >
                        <ViewActiveContext.Provider value={path === pathname}>
                            <View />
                        </ViewActiveContext.Provider>
                    </div>
                )
            })}
        </>
    )
}
