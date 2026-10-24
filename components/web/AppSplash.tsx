// صفحهٔ شروع: تا وقتی React بالا بیاید (data-ready روی <html>) جای صفحهٔ خالی سفید/سیاه را می‌گیرد.
// سبکش در globals.css است تا بدون JS هم درست نمایش داده شود.
export function AppSplash() {
    return (
        <div id="app-splash" role="status" aria-label="در حال بارگذاری">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/web-app-manifest-192x192.png" alt="" width={72} height={72} />
            <div className="app-splash-spinner" />
            <button id="app-splash-retry" type="button">
                تلاش دوباره
            </button>
        </div>
    )
}
