"use client"

import { Blobatar } from "@blobatar/react"
import type { Expression } from "blobatar/expression"
import "blobatar/motion.css"

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
    className,
}: {
    name: string
    size?: number
    animate?: boolean
    expression?: Expression
    className?: string
}) {
    return (
        <span className={cn("block shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size }}>
            {animate ? (
                <Blobatar name={name} animate="always" expression={expression} className="size-full" />
            ) : (
                <Blobatar name={name} expression={expression} alt="" className="size-full" />
            )}
        </span>
    )
}
