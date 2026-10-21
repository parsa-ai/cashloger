// تم‌های رنگی برنامه. مقدار هر تم در globals.css با [data-color="..."] تعریف شده.
export const COLOR_THEMES = [
    { id: "graphite", label: "گرافیت", swatch: "oklch(0.3 0 0)" },
    { id: "ocean", label: "اقیانوس", swatch: "oklch(0.58 0.17 250)" },
    { id: "emerald", label: "زمردی", swatch: "oklch(0.6 0.15 160)" },
    { id: "sunset", label: "غروب", swatch: "oklch(0.66 0.18 45)" },
    { id: "rose", label: "رز", swatch: "oklch(0.6 0.2 10)" },
    { id: "violet", label: "بنفش", swatch: "oklch(0.56 0.2 295)" },
] as const

export type ColorThemeId = (typeof COLOR_THEMES)[number]["id"]

export const DEFAULT_COLOR_THEME: ColorThemeId = "ocean"
export const COLOR_THEME_STORAGE_KEY = "cashlog-color-theme"

// قبل از رندر اجرا می‌شود تا تم بدون پرش رنگ اعمال شود
export const colorThemeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    COLOR_THEME_STORAGE_KEY
)})||${JSON.stringify(DEFAULT_COLOR_THEME)};document.documentElement.setAttribute("data-color",t)}catch(e){document.documentElement.setAttribute("data-color",${JSON.stringify(
    DEFAULT_COLOR_THEME
)})}})();`
