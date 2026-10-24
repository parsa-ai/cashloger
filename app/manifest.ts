import type { MetadataRoute } from 'next'

// نام برنامهٔ نصب‌شده (زیر آیکون و در لیست برنامه‌ها) انگلیسی است؛ داخل برنامه فارسی می‌ماند
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cash Logger',
    short_name: 'Cash Logger',
    description: 'ثبت درآمد و هزینه‌های روزانه',
    lang: 'fa',
    dir: 'rtl',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f4f6',
    theme_color: '#f2f4f6',
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // اندروید آیکون را به شکل خودش می‌بُرد؛ این نسخه تمام‌صفحه است و رسید داخل ناحیهٔ امن
      {
        src: '/maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
