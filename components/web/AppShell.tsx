"use client"

import { useEffect } from "react"

import { useMoneyUnitStore } from "@/store/useMoneyUnitStore"

// صفحاتی که برای کار آفلاین از قبل کش می‌شوند
const OFFLINE_PAGES = ["/", "/logs", "/user", "/categories", "/goals"]

// فایل‌هایی که با import() تنبل بار می‌شوند در HTML صفحه نیستند و سرویس‌ورکر از قبل کششان نمی‌کند؛
// یک بار (وقتی صفحه زیر کنترل سرویس‌ورکر است) دانلودشان می‌کنیم تا آفلاین هم در دسترس باشند (مثلاً خروجی اکسل)
function warmLazyChunks() {
  const load = () => {
    const run = () => import("exceljs").catch(() => {})
    if ("requestIdleCallback" in window) requestIdleCallback(run)
    else setTimeout(run, 2000)
  }
  if (navigator.serviceWorker.controller) load()
  else navigator.serviceWorker.addEventListener("controllerchange", load, { once: true })
}

function AppShell({ children, signedIn }: { children: React.ReactNode; signedIn: boolean }) {
  // واحد پول ذخیره‌شده بعد از mount خوانده می‌شود
  useEffect(() => {
    useMoneyUnitStore.persist.rehydrate()
    // برنامه بالا آمد؛ صفحهٔ شروع (AppSplash) اگر نمایش داده شده بود کنار می‌رود
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
        if (signedIn) warmLazyChunks()
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error)
      })
  }, [signedIn])

  return <>{children}</>
}

export default AppShell
