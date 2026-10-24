// صفحهٔ شروع: فقط وقتی برنامه بعد از چند ثانیه بالا نیامد (data-stuck روی <html>) با دکمهٔ تلاش دوباره نمایش داده می‌شود؛
// در حالت عادی HTML سرور (با اسکلت‌ها) مستقیم دیده می‌شود. سبکش در globals.css است تا بدون JS هم درست نمایش داده شود.
export function AppSplash() {
    return (
        <div id="app-splash" role="status" aria-label="برنامه بارگذاری نشد">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/web-app-manifest-192x192.png" alt="" width={72} height={72} />
            <button id="app-splash-retry" type="button">
                تلاش دوباره
            </button>
        </div>
    )
}
