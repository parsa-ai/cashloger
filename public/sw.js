// سرویس‌ورکر کش لاگر: صفحات و فایل‌های برنامه را کش می‌کند تا بدون اینترنت هم باز شود.
// داده‌ها جدا از این فایل، در حافظهٔ دستگاه و صف همگام‌سازی نگه داشته می‌شوند.

const VERSION = "v6";
// اگر سرور تا این مدت جواب نداد (اینترنت ضعیف یا قطع ولی وصل‌نما)، نسخهٔ ذخیره‌شده نمایش داده می‌شود
// (کوتاه، چون تا آن موقع صفحه سفید/سیاه است و نسخهٔ ذخیره‌شده هم همان اسکلت‌ها را دارد؛ داده‌ها سمت کاربر بار می‌شوند)
const NAV_TIMEOUT = 1500;
const SHELL_CACHE = `shell-${VERSION}`;
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;

const SHELL_FILES = [
    "/offline.html",
    "/manifest.webmanifest",
    "/favicon.ico",
    "/web-app-manifest-192x192.png",
    "/web-app-manifest-512x512.png",
    "/favicon.svg",
    "/badge-96x96.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then((cache) => cache.addAll(SHELL_FILES))
            .catch((error) => console.error("Failed to cache app shell:", error))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    const keep = [SHELL_CACHE, STATIC_CACHE, PAGES_CACHE];
    event.waitUntil(
        caches
            .keys()
            .then((names) => Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

// فقط پاسخ‌های سالم و بدون ریدایرکت (مثلاً به صفحهٔ ورود) کش شوند
function isCacheablePage(response) {
    return response && response.ok && !response.redirected && response.type === "basic";
}

// همهٔ فایل‌های JS/CSS/فونتی که صفحه به آن‌ها اشاره می‌کند (در تگ‌ها و داده‌های RSC)
function assetUrls(html) {
    const urls = new Set();
    for (const match of html.matchAll(/(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\s\\)]+/g)) {
        urls.add(match[0].startsWith("/") ? match[0] : `/_next/${match[0]}`);
    }
    return [...urls];
}

async function cacheAsset(cache, url) {
    if (await cache.match(url)) return;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`asset ${url}: ${response.status}`);
    await cache.put(url, response);
}

// صفحه فقط وقتی جایگزین نسخهٔ قبلی می‌شود که همهٔ فایل‌هایش هم کش شده باشند؛
// وگرنه صفحه‌ای ذخیره می‌شود که آفلاین بدون JS می‌ماند (صفحهٔ سفید/سیاه)
async function storePage(pathname, response) {
    const html = await response.clone().text();
    const staticCache = await caches.open(STATIC_CACHE);
    await Promise.all(assetUrls(html).map((url) => cacheAsset(staticCache, url)));
    const cache = await caches.open(PAGES_CACHE);
    await cache.put(pathname, response);
}

async function cachePage(url) {
    try {
        const response = await fetch(url, { credentials: "same-origin" });
        if (isCacheablePage(response)) await storePage(new URL(url, self.location.origin).pathname, response);
    } catch {
        // آفلاین هستیم؛ بعداً دوباره
    }
}

self.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type === "WARM_PAGES" && Array.isArray(data.urls)) {
        event.waitUntil(Promise.all(data.urls.map(cachePage)));
    }
    // بعد از خروج، صفحات کاربر قبلی نباید از کش نمایش داده شوند
    if (data.type === "CLEAR_PAGES") {
        event.waitUntil(caches.delete(PAGES_CACHE));
    }
});

async function offlineFallback() {
    return (await caches.match("/offline.html")) || new Response("Offline", { status: 503 });
}

function timeout(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function handleNavigation(event) {
    const { request } = event;
    const url = new URL(request.url);

    // بازگشت از ورود با گوگل و API باید حتماً به سرور برسند
    if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/")) {
        try {
            return await fetch(request);
        } catch {
            return offlineFallback();
        }
    }

    const network = fetch(request).then((response) => {
        if (isCacheablePage(response)) {
            event.waitUntil(storePage(url.pathname, response.clone()).catch(() => {}));
        }
        return response;
    });
    network.catch(() => {});

    const pages = await caches.open(PAGES_CACHE);
    const cached = (await pages.match(url.pathname)) || (await pages.match("/"));
    if (!cached) {
        try {
            return await Promise.race([network, timeout(NAV_TIMEOUT * 4)]);
        } catch {
            return offlineFallback();
        }
    }

    // دستگاه می‌داند آفلاین است؛ منتظر شبکه نمی‌مانیم
    if (!self.navigator.onLine) return cached;

    try {
        const response = await Promise.race([network, timeout(NAV_TIMEOUT)]);
        // خطای سرور (مثلاً وقتی سرور به Supabase نمی‌رسد) هم مثل آفلاین است
        return response.status >= 500 ? cached : response;
    } catch {
        return cached;
    }
}

async function handleStatic(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, response.clone());
    }
    return response;
}

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    // درخواست‌های Supabase و دامنه‌های دیگر دست‌نخورده می‌مانند
    if (url.origin !== self.location.origin) return;

    if (request.mode === "navigate") {
        event.respondWith(handleNavigation(event));
        return;
    }

    if (url.pathname.startsWith("/_next/static/") || SHELL_FILES.includes(url.pathname)) {
        event.respondWith(handleStatic(request));
    }
});

// یادآوری روزانه (app/api/cron/reminders)
self.addEventListener("push", (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { body: event.data && event.data.text() };
    }
    event.waitUntil(
        self.registration.showNotification(data.title || "کش لاگر", {
            body: data.body || "تراکنش‌های امروز رو ثبت کردی؟",
            icon: "/web-app-manifest-192x192.png",
            badge: "/badge-96x96.png",
            // یادآوری تازه جای قبلی را می‌گیرد، روی هم انباشته نمی‌شوند
            tag: "daily-reminder",
            lang: "fa",
            dir: "rtl",
            data: { url: data.url || "/?add=1" },
        })
    );
});

// لمس اعلان: برنامهٔ باز را جلو می‌آورد و شیت ثبت را باز می‌کند، وگرنه برنامه را باز می‌کند
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url) || "/?add=1";
    event.waitUntil(
        (async () => {
            const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
            const client = windows.find((c) => new URL(c.url).origin === self.location.origin);
            if (client) {
                await client.focus();
                client.postMessage({ type: "OPEN_ADD" });
                return;
            }
            await self.clients.openWindow(url);
        })()
    );
});
