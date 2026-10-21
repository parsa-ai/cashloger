"use client"

import { useEffect } from "react"
import { useLogStore } from "@/store/useChartStore"

// داده‌های کاربر را از حافظهٔ دستگاه بالا می‌آورد، با سرور همگام می‌کند
// و با برگشتن اینترنت تغییرات آفلاین را خودکار می‌فرستد
function DataLoader({ userId }: { userId: string | null }) {
    const init = useLogStore((s) => s.init)
    const reset = useLogStore((s) => s.reset)
    const sync = useLogStore((s) => s.sync)
    const setOnline = useLogStore((s) => s.setOnline)

    useEffect(() => {
        if (userId) init(userId)
        else reset()
    }, [userId, init, reset])

    useEffect(() => {
        if (!userId) return

        const onOnline = () => setOnline(true)
        const onOffline = () => setOnline(false)
        const onVisible = () => {
            if (document.visibilityState === "visible") sync()
        }
        // اگر تغییری در صف مانده، هر ۳۰ ثانیه دوباره تلاش کن
        const timer = setInterval(() => {
            if (useLogStore.getState().queue.length > 0) sync()
        }, 30_000)

        window.addEventListener("online", onOnline)
        window.addEventListener("offline", onOffline)
        document.addEventListener("visibilitychange", onVisible)
        return () => {
            clearInterval(timer)
            window.removeEventListener("online", onOnline)
            window.removeEventListener("offline", onOffline)
            document.removeEventListener("visibilitychange", onVisible)
        }
    }, [userId, sync, setOnline])

    return null
}

export default DataLoader
