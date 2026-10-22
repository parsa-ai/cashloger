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

export function isAppView(pathname: string) {
    return pathname in ORDER
}

// جابه‌جایی بین صفحه‌های برنامه بدون رفت‌وبرگشت به سرور: همهٔ صفحه‌ها سمت کاربر رندر می‌شوند
// و داده‌ها در حافظهٔ دستگاه‌اند، پس جابه‌جایی فوری است و آفلاین هم کار می‌کند.
// Next.js تغییر history را می‌شنود و usePathname را به‌روز می‌کند.
export function navigate(href: string, { replace = false } = {}) {
    if (typeof window === "undefined" || window.location.pathname === href) return
    if (replace) window.history.replaceState(null, "", href)
    else window.history.pushState(null, "", href)
}
