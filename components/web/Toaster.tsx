"use client"

import { CircleAlert, CircleCheck, Info } from "lucide-react"
import { useToastStore } from "@/store/useToastStore"
import { cn, haptic } from "@/lib/utils"

// توست شیشه‌ای بالای نوار تب
export function Toaster() {
    const toasts = useToastStore((s) => s.toasts)
    const dismiss = useToastStore((s) => s.dismiss)

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),12px)+76px)] z-[100] grid justify-items-center px-4">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    role="status"
                    className={cn(
                        "glass pointer-events-auto col-start-1 row-start-1 flex max-w-sm items-center gap-2 rounded-full py-1.5 ps-3 text-[13px] font-medium",
                        t.action ? "pe-1.5" : "pe-4",
                        t.leaving ? "animate-toast-out" : "animate-toast-in"
                    )}
                    onClick={() => !t.action && dismiss(t.id)}
                >
                    {t.tone === "success" && <CircleCheck className="size-[18px] shrink-0 text-success" />}
                    {t.tone === "error" && <CircleAlert className="size-[18px] shrink-0 text-destructive" />}
                    {t.tone === "default" && <Info className="size-[18px] shrink-0 text-primary" />}
                    <span className="py-1 text-right">{t.message}</span>
                    {t.action && (
                        <button
                            type="button"
                            onClick={() => {
                                haptic()
                                t.action!.onClick()
                                dismiss(t.id)
                            }}
                            className="press ms-1 rounded-full bg-tint px-3 py-1.5 text-[13px] font-semibold text-primary"
                        >
                            {t.action.label}
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}
