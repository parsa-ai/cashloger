// قبل از اجرای React در <head> اجرا می‌شود تا رویداد نصب برنامه از دست نرود
export const installPromptScript = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installPrompt=e});`
