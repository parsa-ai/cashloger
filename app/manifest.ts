import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'کش لاگر',
    short_name: 'کش لاگر',
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
      },
       {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}