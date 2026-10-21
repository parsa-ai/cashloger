"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ReceiptText, Settings } from "lucide-react"
import { cn, haptic } from "@/lib/utils"

const TABS = [
    { href: "/", label: "خانه", icon: Home },
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
    const activeIndex = TABS.findIndex((t) => isActive(t.href, pathname))

    return (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/80 backdrop-blur-xl backdrop-saturate-150">
            <div className="relative mx-auto grid max-w-2xl grid-cols-3 px-2 pt-1.5">
                {activeIndex >= 0 && (
                    <span
                        aria-hidden
                        className="absolute top-1.5 right-2 h-12 rounded-2xl bg-accent/70 transition-transform duration-500 ease-ios"
                        style={{
                            width: "calc((100% - 1rem) / 3)",
                            transform: `translateX(${-activeIndex * 100}%)`,
                        }}
                    />
                )}
                {TABS.map((tab, i) => {
                    const active = i === activeIndex
                    const Icon = tab.icon
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            onClick={() => !active && haptic()}
                            className={cn(
                                "pressable relative z-10 flex h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                                active ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Icon
                                className={cn("size-[22px] transition-transform duration-500 ease-spring", active && "scale-110")}
                                strokeWidth={active ? 2.3 : 1.8}
                            />
                            {tab.label}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
