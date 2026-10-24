// قبل از اجرای React در <head> اجرا می‌شود تا رویداد نصب برنامه از دست نرود
export const installPromptScript = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e});`

// اگر برنامه بعد از چند ثانیه بالا نیامد (مثلاً فایلی آفلاین در دسترس نبود)، دکمهٔ تلاش دوباره روی صفحهٔ شروع نشان داده می‌شود
export const splashScript = `setTimeout(function(){var d=document.documentElement;if(!d.hasAttribute("data-ready"))d.setAttribute("data-stuck","")},8000);document.addEventListener("click",function(e){if(e.target&&e.target.closest&&e.target.closest("#app-splash-retry"))location.reload()});`
