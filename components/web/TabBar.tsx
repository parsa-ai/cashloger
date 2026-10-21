"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChartPie, ReceiptText, Settings } from "lucide-react"
import { cn, haptic } from "@/lib/utils"

const TABS = [
    { href: "/", label: "خلاصه", icon: ChartPie },
    { href: "/logs", label: "تراکنش‌ها", icon: ReceiptText },
    { href: "/user", label: "تنظیمات", icon: Settings },
]

function isActive(href: string, pathname: string) {
    if (href === "/") return pathname === "/"
    if (href === "/user") return pathname === "/user" || pathname === "/categories"
    return pathname.startsWith(href)
}

export function TabBar() {
    const pathname = usePathname()

    return (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-separator bg-background/85 backdrop-blur-xl backdrop-saturate-150">
            <div className="mx-auto grid h-[50px] max-w-2xl grid-cols-3">
                {TABS.map((tab) => {
                    const active = isActive(tab.href, pathname)
                    const Icon = tab.icon
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            onClick={() => !active && haptic()}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-150 active:opacity-60",
                                active ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="size-6" strokeWidth={active ? 2.2 : 1.7} />
                            {tab.label}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
