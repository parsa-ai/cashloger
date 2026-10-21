"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { routeIndex } from "@/lib/nav"

// مسیر قبلی، برای اینکه صفحهٔ جدید از سمت درست وارد شود
let lastPath: string | null = null

// با هر تغییر مسیر دوباره ساخته می‌شود
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [animation] = useState(() => {
    if (lastPath === null || lastPath === pathname) return "animate-page-in"
    const from = routeIndex(lastPath)
    const to = routeIndex(pathname)
    if (from === -1 || to === -1) return "animate-page-in"
    return to > from ? "animate-slide-next" : "animate-slide-prev"
  })

  useEffect(() => {
    lastPath = pathname
  }, [pathname])

  return <div className={animation}>{children}</div>
}
