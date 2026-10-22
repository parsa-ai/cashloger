"use client"

import { navigate } from "@/lib/nav"

// لینک داخلی برنامه: با navigate جابه‌جا می‌شود (بدون درخواست به سرور)، ولی href واقعی دارد
// تا باز کردن در تب جدید و دسترس‌پذیری درست کار کند
export function NavLink({ href, onClick, ...props }: React.ComponentProps<"a"> & { href: string }) {
    return (
        <a
            href={href}
            onClick={(e) => {
                onClick?.(e)
                if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                e.preventDefault()
                navigate(href)
            }}
            {...props}
        />
    )
}
