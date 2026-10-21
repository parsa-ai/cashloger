// تب‌های اصلی برنامه به ترتیب (در راست‌به‌چپ از راست به چپ)
export const TABS = ["/", "/logs", "/user"] as const

// ترتیب همهٔ صفحه‌ها برای جهت انیمیشن جابه‌جایی
const ORDER: Record<string, number> = { "/": 0, "/logs": 1, "/user": 2, "/categories": 3 }

export function routeIndex(pathname: string) {
    return ORDER[pathname] ?? -1
}

export function tabIndex(pathname: string) {
    if (pathname === "/categories") return 2
    return TABS.indexOf(pathname as (typeof TABS)[number])
}
