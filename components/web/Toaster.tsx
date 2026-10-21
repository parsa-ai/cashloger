"use client"

import { CheckCircle2, Info, XCircle } from "lucide-react"
import { useToastStore } from "@/store/useToastStore"
import { cn } from "@/lib/utils"

export function Toaster() {
    const toasts = useToastStore((s) => s.toasts)
    const dismiss = useToastStore((s) => s.dismiss)

    return (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),0.75rem)]">
            {toasts.map((t) => (
                <button
                    key={t.id}
                    onClick={() => dismiss(t.id)}
                    className="pointer-events-auto flex max-w-sm animate-toast-in items-center gap-2.5 rounded-full bg-popover/90 py-2.5 pr-3 pl-4 text-sm font-medium shadow-lg ring-1 ring-border backdrop-blur-xl"
                >
                    {t.tone === "success" && <CheckCircle2 className="size-5 shrink-0 text-success" />}
                    {t.tone === "error" && <XCircle className="size-5 shrink-0 text-destructive" />}
                    {t.tone === "default" && <Info className="size-5 shrink-0 text-primary" />}
                    <span className={cn("text-right", t.tone === "error" && "text-foreground")}>{t.message}</span>
                </button>
            ))}
        </div>
    )
}
