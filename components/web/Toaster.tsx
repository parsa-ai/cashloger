"use client"

import { CircleAlert, CircleCheck, Info } from "lucide-react"
import { useToastStore } from "@/store/useToastStore"
import { cn } from "@/lib/utils"

export function Toaster() {
    const toasts = useToastStore((s) => s.toasts)
    const dismiss = useToastStore((s) => s.dismiss)

    return (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] grid justify-items-center px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
            {toasts.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    onClick={() => dismiss(t.id)}
                    className={cn(
                        "pointer-events-auto col-start-1 row-start-1 flex max-w-sm items-center gap-2 rounded-full bg-card py-2 ps-3 pe-4 text-[13px] font-medium shadow-float",
                        t.leaving ? "animate-toast-out" : "animate-toast-in"
                    )}
                >
                    {t.tone === "success" && <CircleCheck className="size-[18px] shrink-0 text-success" />}
                    {t.tone === "error" && <CircleAlert className="size-[18px] shrink-0 text-destructive" />}
                    {t.tone === "default" && <Info className="size-[18px] shrink-0 text-primary" />}
                    <span className="text-right">{t.message}</span>
                </button>
            ))}
        </div>
    )
}
