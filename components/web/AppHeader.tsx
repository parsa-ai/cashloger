"use client"

import { usePathname } from "next/navigation"
import { DateC } from "./DateC"
import { SyncBadge } from "./SyncBadge"

const TITLES: Record<string, string> = {
    "/": "کش لاگر",
    "/logs": "تراکنش‌ها",
    "/user": "تنظیمات",
    "/categories": "دسته‌بندی‌ها",
}

export function AppHeader() {
    const pathname = usePathname()
    const title = TITLES[pathname] ?? "کش لاگر"
    const showDate = pathname === "/" || pathname === "/logs"

    return (
        <header className="safe-top sticky top-0 z-40 border-b border-border/60 bg-grouped/75 backdrop-blur-xl backdrop-saturate-150">
            <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
                <div className="flex items-center gap-2">
                    <h1 key={title} className="animate-item-in text-xl font-extrabold tracking-tight">
                        {title}
                    </h1>
                    <SyncBadge />
                </div>
                {showDate && <DateC />}
            </div>
        </header>
    )
}
