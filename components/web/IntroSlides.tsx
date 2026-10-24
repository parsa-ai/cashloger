"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChartPie, ChevronLeft, ChevronRight, Plus, ReceiptText } from "lucide-react"
import { happy, sleepy } from "blobatar/expression"

import { Button } from "@/components/ui/button"
import { CategoryAvatar, UserBlob } from "@/components/web/Avatars"
import { useBlobName } from "@/components/web/ProfileProvider"
import { cn, haptic } from "@/lib/utils"

// تصویر هر اسلاید از همان تکه‌های واقعی برنامه ساخته شده تا کاربر بعداً آن‌ها را بشناسد
function AddArt() {
    return (
        <div className="w-full max-w-72 space-y-5">
            <div className="flex flex-wrap justify-center gap-2">
                {[
                    { label: "خوراک", color: "oklch(0.7 0.16 60)" },
                    { label: "رفت‌وآمد", color: "oklch(0.62 0.17 245)" },
                    { label: "حقوق", color: "oklch(0.62 0.17 150)" },
                ].map((c) => (
                    <span key={c.label} className="flex h-10 items-center gap-2 rounded-full bg-card ps-1.5 pe-4 text-[14px] font-medium">
                        <CategoryAvatar label={c.label} color={c.color} size={28} />
                        {c.label}
                    </span>
                ))}
            </div>
            <div className="flex items-center gap-2.5">
                <span className="glass grid size-14 shrink-0 place-items-center rounded-full text-primary ring-2 ring-primary/40">
                    <Plus className="size-6" strokeWidth={2.6} />
                </span>
                <span className="glass grid h-14 flex-1 grid-cols-2 rounded-full p-1">
                    <span className="flex flex-col items-center justify-center rounded-full bg-fill-strong text-[10px] font-semibold text-primary">
                        <ChartPie className="size-5" />
                        خلاصه
                    </span>
                    <span className="flex flex-col items-center justify-center text-[10px] text-muted-foreground">
                        <ReceiptText className="size-5" />
                        تراکنش‌ها
                    </span>
                </span>
            </div>
        </div>
    )
}

function SummaryArt() {
    return (
        <div className="w-full max-w-72 space-y-3">
            <div className="glass mx-auto flex h-11 w-fit items-center gap-1 rounded-full px-1 text-primary">
                <ChevronRight className="size-5" />
                <span className="px-2 text-[15px] font-semibold text-foreground">مهر</span>
                <ChevronLeft className="size-5" />
            </div>
            <div className="overflow-hidden rounded-xl bg-card">
                <p className="px-4 pt-4 pb-3 text-[28px] leading-tight font-bold text-success">
                    <span className="num">۴٬۲۵۰٬۰۰۰</span>
                    <span className="ms-1.5 text-[13px] font-medium text-muted-foreground">تومان</span>
                </p>
                <div className="grid grid-cols-2 border-t border-separator text-[12px] text-muted-foreground [&>:first-child]:border-e [&>:first-child]:border-separator">
                    <p className="px-4 py-2.5">
                        درآمد
                        <span className="num block text-[14px] font-semibold text-foreground">۹٬۰۰۰٬۰۰۰</span>
                    </p>
                    <p className="px-4 py-2.5">
                        هزینه
                        <span className="num block text-[14px] font-semibold text-foreground">۴٬۷۵۰٬۰۰۰</span>
                    </p>
                </div>
            </div>
        </div>
    )
}

function OfflineArt({ blobName }: { blobName: string }) {
    return (
        <div className="relative">
            <UserBlob name={blobName} size={112} expression={sleepy} />
            <span className="glass absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap text-muted-foreground">
                آفلاین
            </span>
        </div>
    )
}

// چند اسلاید کوتاه که کار با برنامه را به کاربر تازه نشان می‌دهد؛ با کشیدن یا دکمهٔ «بعدی» ورق می‌خورد
export function IntroSlides({ onDone, doneLabel }: { onDone: () => void; doneLabel: string }) {
    const blobName = useBlobName()
    const trackRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    const slides = [
        {
            art: <UserBlob name={blobName} size={112} expression={happy} />,
            title: "سلام! به کش لاگر خوش اومدی",
            text: "دفترچهٔ دخل و خرج جیبی‌ات. هر خرج و درآمدی رو در چند ثانیه ثبت کن و ببین پولت کجا می‌ره.",
        },
        {
            art: <AddArt />,
            title: "ثبت در چند ثانیه",
            text: "دکمهٔ + پایین صفحه رو بزن، مبلغ و دسته رو انتخاب کن و تمام. لمس هر دسته در صفحهٔ خلاصه هم مستقیم برای همون دسته ثبت می‌کنه.",
        },
        {
            art: <SummaryArt />,
            title: "خلاصهٔ هر ماه",
            text: "موجودی، درآمد و هزینهٔ ماه یه‌جا. با فلش‌های بالا ماه رو عوض کن و برای دیدن فهرست تراکنش‌ها صفحه رو به کنار بکش.",
        },
        {
            art: <OfflineArt blobName={blobName} />,
            title: "بی‌اینترنت هم کار می‌کنه",
            text: "هر چی ثبت کنی روی گوشی می‌مونه و وقتی وصل شدی خودش همگام می‌شه. با زدن بلابت بالای صفحه به دسته‌ها، اهداف پس‌انداز و تنظیمات می‌رسی.",
        },
    ]
    const last = index === slides.length - 1

    // صفحهٔ پشت اسلایدها نباید با کشیدن عمودی تکان بخورد
    useEffect(() => {
        const html = document.documentElement
        const prev = html.style.overflow
        html.style.overflow = "hidden"
        return () => {
            html.style.overflow = prev
        }
    }, [])

    // در راست‌به‌چپ scrollLeft منفی است؛ قدر مطلقش بس است
    const onScroll = () => {
        const el = trackRef.current
        if (!el) return
        const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth)
        if (i !== index) setIndex(i)
    }

    const goTo = (i: number) => {
        const el = trackRef.current
        if (!el) return
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        // فقط خود ریل جابه‌جا شود، نه صفحهٔ پشت (scrollIntoView صفحه را هم تکان می‌داد)
        const rtl = getComputedStyle(el).direction === "rtl"
        el.scrollTo({ left: (rtl ? -1 : 1) * i * el.clientWidth, behavior: reduce ? "auto" : "smooth" })
    }

    const next = () => {
        haptic()
        if (last) onDone()
        else goTo(index + 1)
    }

    // روی body رندر می‌شود؛ وگرنه انیمیشن transform نمای صفحه، fixed را به همان نما محدود می‌کرد
    return createPortal(
        <div className="fixed inset-0 z-[55] flex animate-page-in touch-pan-x flex-col overflow-hidden overscroll-none bg-background">
            <div className="flex justify-end px-2 pt-[calc(env(safe-area-inset-top)+8px)]">
                <Button
                    variant="plain"
                    className={cn("text-muted-foreground transition-opacity", last && "pointer-events-none opacity-0")}
                    onClick={onDone}
                    tabIndex={last ? -1 : undefined}
                >
                    رد شدن
                </Button>
            </div>

            <div
                ref={trackRef}
                onScroll={onScroll}
                className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-contain"
            >
                {slides.map((s, i) => (
                    <section
                        key={s.title}
                        aria-hidden={i !== index}
                        className="flex h-full w-full shrink-0 snap-start snap-always flex-col items-center justify-center px-8 text-center"
                    >
                        <div className="flex h-[min(14rem,30dvh)] w-full items-center justify-center">{s.art}</div>
                        {/* ارتفاع ثابت برای متن تا عنوان و تصویر در همهٔ اسلایدها هم‌جا بمانند */}
                        <div className="mt-6 h-40 w-full max-w-sm">
                            <h1 className="text-[22px] font-bold">{s.title}</h1>
                            <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{s.text}</p>
                        </div>
                    </section>
                ))}
            </div>

            <div className="px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)]">
                <div className="mx-auto max-w-md space-y-5">
                    <div className="flex justify-center gap-2" role="tablist" aria-label="اسلایدها">
                        {slides.map((s, i) => (
                            <button
                                key={s.title}
                                type="button"
                                role="tab"
                                aria-selected={i === index}
                                aria-label={`اسلاید ${(i + 1).toLocaleString("fa-IR")}`}
                                onClick={() => goTo(i)}
                                className={cn(
                                    "size-2 rounded-full transition-colors duration-200",
                                    i === index ? "bg-primary" : "bg-fill-strong"
                                )}
                            />
                        ))}
                    </div>
                    <Button size="lg" className="w-full" onClick={next}>
                        {last ? doneLabel : "بعدی"}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    )
}
