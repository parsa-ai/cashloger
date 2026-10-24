"use client"

import { Blobatar } from "@blobatar/react"
import type { Expression } from "blobatar/expression"
import { _layout, _marks, _parts } from "blobatar/internal"
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

type Pt = [number, number]

// مسیر SVG بلاب (فقط M/L/H/V/C/Q/Z مطلق) به چندضلعی
function flatten(d: string): Pt[][] {
    const polys: Pt[][] = []
    let poly: Pt[] = []
    let cur: Pt = [0, 0]
    for (const [, cmd, args] of d.matchAll(/([MLHVCQZ])([^MLHVCQZ]*)/g)) {
        const n = args.trim() ? args.trim().split(/[\s,]+/).map(Number) : []
        if (cmd === "M") {
            if (poly.length) polys.push(poly)
            cur = [n[0], n[1]]
            poly = [cur]
        } else if (cmd === "L") cur = [n[0], n[1]]
        else if (cmd === "H") cur = [n[0], cur[1]]
        else if (cmd === "V") cur = [cur[0], n[0]]
        else if (cmd === "C" || cmd === "Q") {
            const [x0, y0] = cur
            for (let i = 1; i <= 8; i++) {
                const t = i / 8, u = 1 - t
                poly.push(cmd === "C"
                    ? [u * u * u * x0 + 3 * u * u * t * n[0] + 3 * u * t * t * n[2] + t * t * t * n[4],
                        u * u * u * y0 + 3 * u * u * t * n[1] + 3 * u * t * t * n[3] + t * t * t * n[5]]
                    : [u * u * x0 + 2 * u * t * n[0] + t * t * n[2], u * u * y0 + 2 * u * t * n[1] + t * t * n[3]])
            }
            cur = cmd === "C" ? [n[4], n[5]] : [n[2], n[3]]
            continue
        }
        if (cmd !== "Z") poly.push(cur)
    }
    if (poly.length) polys.push(poly)
    return polys
}

function inPoly(poly: Pt[], x: number, y: number) {
    let hit = false
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j]
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
    }
    return hit
}

// تابع «داخل سر بلاب است؟» از روی شکل‌های واقعی سر (بدون چشم‌ها)
function headHitTest(name: string, eyeCount: number) {
    const marks = _marks(name).marks.slice(0, -eyeCount)
    const circles = marks.flatMap((m) => (m.kind === "circle" ? [m] : []))
    const polys = marks.flatMap((m) => (m.kind === "path" ? flatten(m.d) : []))
    return (x: number, y: number) =>
        circles.some((c) => Math.hypot(x - c.cx, y - c.cy) < c.r) || polys.some((p) => inPoly(p, x, y))
}

// گل صورتی تخت به سبک خود بلاب، روی لبهٔ واقعی سر بالای چشم چپ
function flowerSvg(name: string) {
    const { face, eyes } = _layout(name)
    const inside = headHitTest(name, eyes.length)
    const leftEye = eyes.reduce((a, b) => (a.cx <= b.cx ? a : b))

    // اندازه متناسب با چشم و پهنای صورت تا روی بلاب‌های کوچک‌صورت بزرگ نشود
    let R = Math.max(7, Math.min(leftEye.ry * 1.5, face.rx * 0.36, 11.5))

    // فاصلهٔ نقطه تا نزدیک‌ترین چشم (مستطیل دور چشم)
    const clearance = (px: number, py: number) =>
        Math.min(...eyes.map((e) => Math.hypot(
            Math.max(0, Math.abs(px - e.cx) - e.rx * 1.3),
            Math.max(0, Math.abs(py - e.cy) - e.ry),
        )))

    // از بالای چشم چپ رو به بالا-چپ تا لبهٔ سر می‌رویم و گل را کمی داخل لبه می‌گذاریم،
    // مثل گلی که لای مو گذاشته شده؛ اگر به چشم چسبید زاویهٔ کج‌تر امتحان می‌شود
    let x = 0
    let y = 0
    let rot = 0
    let best = -1
    for (const deg of [-118, -128, -108, -138, -148]) {
        const a = (deg * Math.PI) / 180
        const dx = Math.cos(a)
        const dy = Math.sin(a)
        const sx = leftEye.cx
        const sy = leftEye.cy - leftEye.ry
        let t = 0
        while (t < 70 && inside(sx + dx * t, sy + dy * t)) t += 0.25
        const px = sx + dx * (t - R * 0.5)
        const py = sy + dy * (t - R * 0.5)
        const c = clearance(px, py)
        if (c > best) {
            best = c
            x = px
            y = py
            rot = deg + 90
        }
        if (c >= R) break
    }
    // جا تنگ است (صورت‌های پهن و کوتاه): گل کوچک‌تر می‌شود
    if (best < R) R = Math.max(5.5, best)
    // داخل قاب ۱۰۰×۱۰۰ بماند
    x = Math.min(Math.max(x, R + 1), 99 - R)
    y = Math.min(Math.max(y, R + 1), 99 - R)

    const petals = (n: number, rx: number, ry: number, off: number, rot0: number, fill: string) =>
        Array.from({ length: n }, (_, i) =>
            `<ellipse cx="0" cy="${r2(-off)}" rx="${r2(rx)}" ry="${r2(ry)}" transform="rotate(${r2(rot0 + (360 / n) * i)})" fill="${fill}"/>`,
        ).join("")

    return (
        `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(rot)})">` +
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
