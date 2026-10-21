"use client"

import { CloudOff, Loader2, RefreshCw } from "lucide-react"
import { useLogStore } from "@/store/useChartStore"
import { cn } from "@/lib/utils"

// وضعیت اتصال و تعداد تغییرات ارسال‌نشده
export function SyncBadge() {
    const isOnline = useLogStore((s) => s.isOnline)
    const isSyncing = useLogStore((s) => s.isSyncing)
    const pending = useLogStore((s) => s.queue.length)
    const sync = useLogStore((s) => s.sync)

    const visible = !isOnline || pending > 0 || isSyncing

    return (
        <button
            type="button"
            onClick={() => sync()}
            aria-hidden={!visible}
            tabIndex={visible ? 0 : -1}
            className={cn(
                "pressable flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-all duration-500 ease-ios",
                visible ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
                !isOnline ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-accent text-accent-foreground"
            )}
        >
            {!isOnline ? (
                <CloudOff className="size-3.5" />
            ) : isSyncing ? (
                <Loader2 className="size-3.5 animate-spin" />
            ) : (
                <RefreshCw className="size-3.5" />
            )}
            {!isOnline ? "آفلاین" : isSyncing ? "همگام‌سازی" : "در انتظار"}
            {pending > 0 && <span className="tabular-nums">{pending.toLocaleString("fa-IR")}</span>}
        </button>
    )
}
