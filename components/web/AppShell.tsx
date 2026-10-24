"use client"

import { useEffect } from "react"

import { useMoneyUnitStore } from "@/store/useMoneyUnitStore"

// صفحاتی که برای کار آفلاین از قبل کش می‌شوند
const OFFLINE_PAGES = ["/", "/logs", "/user", "/categories", "/goals"]

function AppShell({ children, signedIn }: { children: React.ReactNode; signedIn: boolean }) {
  // واحد پول ذخیره‌شده بعد از mount خوانده می‌شود
  useEffect(() => {
    useMoneyUnitStore.persist.rehydrate()
    // برنامه بالا آمد؛ صفحهٔ شروع (AppSplash) کنار می‌رود
    document.documentElement.setAttribute("data-ready", "")
  }, [])

  useEffect(() => {
    // در حالت توسعه سرویس‌ورکر باعث کش شدن فایل‌های قدیمی می‌شود
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(async () => {
        const registration = await navigator.serviceWorker.ready
        registration.active?.postMessage(
          signedIn ? { type: "WARM_PAGES", urls: OFFLINE_PAGES } : { type: "CLEAR_PAGES" }
        )
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error)
      })
  }, [signedIn])

  return <>{children}</>
}

export default AppShell
