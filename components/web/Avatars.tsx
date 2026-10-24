"use client"

import { Blobatar } from "@blobatar/react"
import type { Expression } from "blobatar/expression"
import { _layout, _parts } from "blobatar/internal"
import "blobatar/motion.css"
import { useMemo, type CSSProperties } from "react"

import { parseOklch, UNCATEGORIZED_COLOR } from "@/lib/palette"
import { cn } from "@/lib/utils"

// نسخهٔ روشن‌تر همان رنگ برای بدن بلاب روی دایرهٔ رنگی
function lighter(color: string) {
    const c = parseOklch(color)
    if (!c) return color
    return `oklch(${Math.min(0.96, c.l + 0.22).toFixed(3)} ${(c.c * 0.45).toFixed(3)} ${c.h})`
}

// آواتار دسته‌بندی: صورت بلاب روی دایره‌ای به رنگ دسته
export function CategoryAvatar({
    label,
    color,
    size = 36,
    animate,
    className,
}: {
    label: string
    color?: string
    size?: number
    animate?: boolean
    className?: string
}) {
    const fill = color ?? UNCATEGORIZED_COLOR
    return (
        <span
            className={cn("relative block shrink-0 overflow-hidden rounded-full transition-colors duration-300", className)}
            style={{ width: size, height: size, backgroundColor: fill }}
        >
            <Blobatar
                name={label}
                background={false}
                palette={{ head: lighter(fill) }}
                className="absolute inset-0 size-full"
                {...(animate ? { animate: "always" as const } : { alt: "" })}
            />
        </span>
    )
}

// آواتار کاربر (همان بلاب همیشگی)
export function UserBlob({
    name,
    size = 32,
    animate = true,
    expression,
    accessory,
    className,
}: {
    name: string
    size?: number
    animate?: boolean
    expression?: Expression
    accessory?: boolean
    className?: string
}) {
    return (
        <span className={cn("block shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size }}>
            {accessory ? (
                <FlowerBlob name={name} animate={animate} expression={expression} />
            ) : animate ? (
                <Blobatar name={name} animate="always" expression={expression} className="size-full" />
            ) : (
                <Blobatar name={name} expression={expression} alt="" className="size-full" />
            )}
        </span>
    )
}

const r2 = (v: number) => Math.round(v * 100) / 100

// گل صورتی تخت به سبک خود بلاب، با اندازه و جای حساب‌شده از هندسهٔ همان صورت
function flowerSvg(name: string) {
    const { face, eyes } = _layout(name)
    const leftEye = eyes.reduce((a, b) => (a.cx <= b.cx ? a : b))

    // اندازه متناسب با چشم و پهنای صورت تا روی بلاب‌های کوچک‌صورت بزرگ نشود
    let R = Math.max(7.5, Math.min(leftEye.ry * 1.7, face.rx * 0.42, 13))

    // فاصلهٔ نقطه تا نزدیک‌ترین چشم (مستطیل دور چشم)
    const clearance = (px: number, py: number) =>
        Math.min(...eyes.map((e) => Math.hypot(
            Math.max(0, Math.abs(px - e.cx) - e.rx * 1.3),
            Math.max(0, Math.abs(py - e.cy) - e.ry),
        )))

    // کمی داخل لبهٔ بالا-چپ سر، مثل گلی که لای مو گذاشته شده؛
    // اولین زاویه‌ای که از چشم‌ها فاصله دارد، وگرنه بهترینِ موجود
    let x = 0
    let y = 0
    let best = -1
    for (const deg of [-128, -136, -120, -144, -112, -152, -104, -160]) {
        const a = (deg * Math.PI) / 180
        const px = face.cx + Math.cos(a) * face.rx * 0.82
        const py = face.cy + Math.sin(a) * face.ry * 0.82
        const c = clearance(px, py)
        if (c > best) {
            best = c
            x = px
            y = py
        }
        if (c >= R * 1.05) break
    }
    // جا تنگ است (صورت‌های پهن و کوتاه): گل کوچک‌تر می‌شود
    if (best < R * 1.05) R = Math.max(6, best / 1.05)
    // داخل قاب گرد آواتار بماند
    const d = Math.hypot(x - 50, y - 50)
    const max = 48 - R
    if (d > max) {
        x = 50 + ((x - 50) * max) / d
        y = 50 + ((y - 50) * max) / d
    }

    const petals = (n: number, rx: number, ry: number, off: number, rot0: number, fill: string) =>
        Array.from({ length: n }, (_, i) =>
            `<ellipse cx="0" cy="${r2(-off)}" rx="${r2(rx)}" ry="${r2(ry)}" transform="rotate(${r2(rot0 + (360 / n) * i)})" fill="${fill}"/>`,
        ).join("")

    return (
        `<g transform="translate(${r2(x)} ${r2(y)}) rotate(-18)">` +
        petals(5, R * 0.42, R * 0.6, R * 0.5, 0, "#f9b4cf") +
        petals(5, R * 0.2, R * 0.36, R * 0.36, 36, "#e8578f") +
        `<circle r="${r2(R * 0.26)}" fill="#f6c453"/>` +
        `<circle cx="${r2(-R * 0.08)}" cy="${r2(-R * 0.08)}" r="${r2(R * 0.08)}" fill="#ffffff" opacity="0.8"/>` +
        `</g>`
    )
}

// بلاب با گل؛ گل داخل گروه mo-bob می‌رود تا با سر بلاب تکان بخورد
function FlowerBlob({ name, animate, expression }: { name: string; animate: boolean; expression?: Expression }) {
    const parts = useMemo(
        () => _parts(name, { animate: animate ? "always" : undefined, expression }),
        [name, animate, expression],
    )
    const flower = useMemo(() => flowerSvg(name), [name])
    const html = useMemo(() => {
        const inner = parts.inner
        // خروجی متحرک با </g></g> (بستن mo-bob و mo-breathe) تمام می‌شود
        const at = animate && inner.endsWith("</g></g>") ? inner.length - 8 : inner.length
        return { __html: inner.slice(0, at) + flower + inner.slice(at) }
    }, [parts.inner, flower, animate])

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            aria-hidden
            className="size-full"
            style={parts.vars as CSSProperties}
        >
            {parts.bg ? <path d={parts.bg.d} fill={parts.bg.fill} /> : null}
            <g className={parts.cls} dangerouslySetInnerHTML={html} />
        </svg>
    )
}
