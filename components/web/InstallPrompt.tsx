"use client"

import { useEffect, useState } from "react"
import { CloudOff, Share, SquarePlus, Zap } from "lucide-react"
import { happy } from "blobatar/expression"

import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { UserBlob } from "@/components/web/Avatars"
import { Group, IconTile, Row } from "@/components/web/Group"
import { haptic } from "@/lib/utils"

const SEEN_KEY = "cashlog-install-prompt-seen"

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

declare global {
    interface Window {
        // رویدادی که قبل از mount شدن React رسیده (در layout گرفته می‌شود)
        __installPrompt?: BeforeInstallPromptEvent | null
    }
}

function isStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
}

function isIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function wasSeen() {
    try {
        return localStorage.getItem(SEEN_KEY) === "1"
    } catch {
        return true
    }
}

function markSeen() {
    try {
        localStorage.setItem(SEEN_KEY, "1")
    } catch {
        // نادیده بگیر
    }
}

// پیشنهاد نصب برنامه، فقط بار اول و فقط وقتی هنوز نصب نشده
export function InstallPrompt() {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<"native" | "ios">("native")
    const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)

    useEffect(() => {
        if (isStandalone() || wasSeen()) return

        let timer: ReturnType<typeof setTimeout> | undefined
        const show = (nextMode: "native" | "ios", event: BeforeInstallPromptEvent | null) => {
            clearTimeout(timer)
            // کمی صبر تا صفحه اول دیده شود
            timer = setTimeout(() => {
                setMode(nextMode)
                setPromptEvent(event)
                setOpen(true)
            }, 1200)
        }

        const onPrompt = (e: Event) => {
            e.preventDefault()
            show("native", e as BeforeInstallPromptEvent)
        }
        const onInstalled = () => {
            markSeen()
            setOpen(false)
        }

        if (window.__installPrompt) show("native", window.__installPrompt)
        else if (isIos()) show("ios", null)

        window.addEventListener("beforeinstallprompt", onPrompt)
        window.addEventListener("appinstalled", onInstalled)
        return () => {
            clearTimeout(timer)
            window.removeEventListener("beforeinstallprompt", onPrompt)
            window.removeEventListener("appinstalled", onInstalled)
        }
    }, [])

    const handleOpenChange = (next: boolean) => {
        if (!next) markSeen()
        setOpen(next)
    }

    const install = async () => {
        if (!promptEvent) return
        haptic()
        await promptEvent.prompt()
        const { outcome } = await promptEvent.userChoice
        window.__installPrompt = null
        if (outcome === "accepted") handleOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogBody className="pt-6">
                    <div className="flex flex-col items-center text-center">
                        <UserBlob name="کش لاگر" size={88} expression={happy} />
                        <DialogTitle className="mt-4 text-[22px] font-bold">کش لاگر رو نصب کن</DialogTitle>
                        <p className="mt-1 text-[15px] text-muted-foreground">مثل یک برنامهٔ واقعی، از صفحهٔ اصلی گوشی.</p>
                    </div>

                    <Group>
                        <Row
                            leading={<IconTile color="oklch(0.65 0.18 255)"><Zap /></IconTile>}
                            title="باز شدن سریع"
                            subtitle="بدون نوار آدرس، تمام‌صفحه"
                        />
                        <Row
                            leading={<IconTile color="oklch(0.7 0.16 65)"><CloudOff /></IconTile>}
                            title="کار بدون اینترنت"
                            subtitle="ثبت می‌کنی، بعداً خودش همگام می‌شه"
                        />
                    </Group>

                    {mode === "ios" ? (
                        <Group title="روش نصب در آیفون">
                            <Row
                                leading={<span className="num grid size-[30px] place-items-center rounded-full bg-fill text-[13px] font-semibold">۱</span>}
                                title={
                                    <span className="flex items-center gap-1.5">
                                        دکمهٔ اشتراک‌گذاری <Share className="size-[18px] text-primary" /> را بزن
                                    </span>
                                }
                            />
                            <Row
                                leading={<span className="num grid size-[30px] place-items-center rounded-full bg-fill text-[13px] font-semibold">۲</span>}
                                title={
                                    <span className="flex items-center gap-1.5">
                                        <SquarePlus className="size-[18px]" /> «Add to Home Screen» را انتخاب کن
                                    </span>
                                }
                            />
                            <Row
                                leading={<span className="num grid size-[30px] place-items-center rounded-full bg-fill text-[13px] font-semibold">۳</span>}
                                title="بالای صفحه «Add» را بزن"
                            />
                        </Group>
                    ) : (
                        <Button size="lg" className="w-full" onClick={install}>
                            نصب برنامه
                        </Button>
                    )}

                    <Button variant="plain" size="nav" className="mx-auto flex font-medium" onClick={() => handleOpenChange(false)}>
                        {mode === "ios" ? "متوجه شدم" : "بعداً"}
                    </Button>
                </DialogBody>
            </DialogContent>
        </Dialog>
    )
}
