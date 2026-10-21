// تب‌های اصلی برنامه به ترتیب (در راست‌به‌چپ از راست به چپ)؛ تنظیمات از بلاب بالای صفحه باز می‌شود
export const TABS = ["/", "/logs"] as const

// ترتیب همهٔ صفحه‌ها برای جهت انیمیشن جابه‌جایی
const ORDER: Record<string, number> = { "/": 0, "/logs": 1, "/user": 2, "/categories": 3 }

export function routeIndex(pathname: string) {
    return ORDER[pathname] ?? -1
}

export function tabIndex(pathname: string) {
    return TABS.indexOf(pathname as (typeof TABS)[number])
}
