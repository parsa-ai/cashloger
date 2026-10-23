"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { sleepy } from "blobatar/expression"

import { UserBlob } from "@/components/web/Avatars"
import { NavLink } from "@/components/web/NavLink"
import { useBlobName } from "@/components/web/ProfileProvider"
import { navigate, TABS } from "@/lib/nav"
import { cn, formatMonthTitle, haptic, isSamePersianMonth, shiftPersianMonth } from "@/lib/utils"
import { useLogStore } from "@/store/useChartStore"
import useDateStore from "@/store/useYearStore"

// صفحهٔ بالادستی هر صفحهٔ داخلی، وقتی تاریخچه‌ای برای برگشت نیست
const PARENTS: Record<string, string> = {
    "/user": "/",
    "/categories": "/user",
    "/goals": "/",
}

const TITLES: Record<string, string> = {
    "/user": "پروفایل",
    "/categories": "دسته‌بندی‌ها",
    "/goals": "اهداف پس‌انداز",
}

// «در حال ارسال» فقط اگر بیش از یک لحظه طول بکشد، تا با هر ثبت چشمک نزند
function useSending() {
    const isOnline = useLogStore((s) => s.isOnline)
    const pending = useLogStore((s) => s.queue.length)
    const [slow, setSlow] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setSlow(pending > 0), pending > 0 ? 1500 : 0)
        return () => clearTimeout(timer)
    }, [pending])

    return isOnline && pending > 0 && slow
}

// تراشهٔ پروفایل (هم‌شکل تراشهٔ دسته‌ها): وضعیت همگام‌سازی را هم خود بلاب نشان می‌دهد؛
// آفلاین چشم‌هایش را می‌بندد و تعداد ارسال‌نشده‌ها کنارش می‌آید، در حال ارسال حلقه‌ای دورش می‌چرخد
function ProfileChip() {
    const blobName = useBlobName()
    const isOnline = useLogStore((s) => s.isOnline)
    const pending = useLogStore((s) => s.queue.length)
    const sync = useLogStore((s) => s.sync)
    const sending = useSending()

    const status = !isOnline
        ? pending > 0
            ? `آفلاین، ${pending.toLocaleString("fa-IR")} تراکنش ارسال نشده`
            : "آفلاین"
        : sending
          ? "در حال ارسال"
          : "همگام است"

    return (
        <NavLink
            href="/user"
            aria-label={`پروفایل (${status})`}
            onClick={() => {
                haptic()
                if (pending > 0) void sync()
            }}
            className="glass press pointer-events-auto flex h-11 items-center gap-2 justify-self-start rounded-full ps-1 pe-3.5 text-[14px] font-semibold"
        >
            <span className="relative grid size-9 shrink-0 place-items-center">
                <UserBlob name={blobName} size={sending ? 30 : 36} expression={isOnline ? undefined : sleepy} className="transition-[width,height] duration-300" />
                {sending && (
                    <span aria-hidden className="absolute inset-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                )}
                {!isOnline && (
                    <span
                        aria-hidden
                        className="num absolute -end-1 -top-1 grid h-[18px] min-w-[18px] animate-fade-in place-items-center rounded-full bg-amber-500 px-1 text-[11px] font-bold text-white ring-2 ring-background"
                    >
                        {pending > 0 ? pending.toLocaleString("fa-IR") : "!"}
                    </span>
                )}
            </span>
            پروفایل
        </NavLink>
    )
}

// انتخاب ماه شمسی در هدر: ‹ مهر ۱۴۰۵ ›؛ لمس اسم ماه به ماه جاری برمی‌گردد
function MonthPicker() {
    const date = useDateStore((s) => s.date) || new Date()
    const setDate = useDateStore((s) => s.setDate)
    const isCurrent = isSamePersianMonth(date, new Date())

    const go = (months: number) => {
        haptic()
        setDate(shiftPersianMonth(date, months))
    }

    return (
        <div className="glass pointer-events-auto flex h-11 items-center justify-self-end rounded-full px-1">
            <button type="button" onClick={() => go(-1)} aria-label="ماه قبل" className="press grid size-9 place-items-center text-primary">
                <ChevronRight className="size-5" />
            </button>
            <button
                type="button"
                disabled={isCurrent}
                onClick={() => {
                    haptic()
                    setDate(new Date())
                }}
                aria-label={isCurrent ? undefined : "برگشت به این ماه"}
                className={cn(
                    "press h-8 min-w-[72px] rounded-full px-2 text-[14px] font-semibold whitespace-nowrap transition-colors duration-200",
                    !isCurrent && "bg-tint text-primary"
                )}
            >
                <span key={date.toDateString()} className="inline-block animate-fade-in">
                    {formatMonthTitle(date)}
                </span>
            </button>
            <button
                type="button"
                onClick={() => go(1)}
                disabled={isCurrent}
                aria-label="ماه بعد"
                className="press grid size-9 place-items-center text-primary transition-opacity disabled:opacity-25"
            >
                <ChevronLeft className="size-5" />
            </button>
        </div>
    )
}

// دکمهٔ برگشت صفحه‌های داخلی: اگر از داخل برنامه آمده‌ایم همان‌جا برمی‌گردد، وگرنه به صفحهٔ بالادستی
// آیا داخل همین برنامه جابه‌جا شده‌ایم (پس history.back از برنامه بیرون نمی‌رود)
let entryPath: string | null = null
let navigated = false

function BackButton({ pathname }: { pathname: string }) {
    return (
        <button
            type="button"
            aria-label="بازگشت"
            onClick={() => {
                haptic()
                if (navigated) window.history.back()
                else navigate(PARENTS[pathname] ?? "/", { replace: true })
            }}
            className="glass press pointer-events-auto grid size-11 place-items-center justify-self-start rounded-full text-primary"
        >
            <ChevronRight className="size-6" />
        </button>
    )
}

// هدر شناور شیشه‌ای: پروفایل یا برگشت، عنوان صفحه، انتخاب ماه در تب‌ها
export function AppHeader() {
    const pathname = usePathname()
    const isTab = (TABS as readonly string[]).includes(pathname)
    const title = TITLES[pathname]

    useEffect(() => {
        if (entryPath === null) entryPath = pathname
        else if (pathname !== entryPath) navigated = true
    }, [pathname])

    return (
        <>
            {/* محو شدن محتوا زیر نوار وضعیت گوشی */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[calc(env(safe-area-inset-top)+72px)] bg-gradient-to-b from-background via-background/70 to-transparent"
            />
            <header className="pointer-events-none fixed inset-x-0 top-0 z-40 pt-[calc(env(safe-area-inset-top)+8px)]">
                <div className="mx-auto grid max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
                    {isTab ? <ProfileChip /> : <BackButton pathname={pathname} />}

                    {title ? (
                        <div className="glass pointer-events-auto flex h-11 min-w-0 items-center justify-center rounded-full px-5">
                            <h1 key={pathname} className="animate-fade-in truncate text-[16px] font-bold">
                                {title}
                            </h1>
                        </div>
                    ) : (
                        <h1 className="sr-only">کش لاگر</h1>
                    )}

                    {isTab ? <MonthPicker /> : <span />}
                </div>
            </header>
        </>
    )
}
