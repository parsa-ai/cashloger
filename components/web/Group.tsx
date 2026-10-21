import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

// لیست گروه‌بندی‌شده به سبک تنظیمات iOS
export function Group({
    title,
    action,
    footer,
    className,
    children,
}: {
    title?: React.ReactNode
    action?: React.ReactNode
    footer?: React.ReactNode
    className?: string
    children: React.ReactNode
}) {
    return (
        <section className={className}>
            {(title || action) && (
                <div className="mb-1.5 flex items-end justify-between px-4">
                    <h2 className="text-[13px] text-muted-foreground">{title}</h2>
                    {action}
                </div>
            )}
            <div className="overflow-hidden rounded-xl bg-card">{children}</div>
            {footer && <p className="mt-1.5 px-4 text-[13px] leading-5 text-muted-foreground">{footer}</p>}
        </section>
    )
}

// آیکون رنگی کوچک کنار ردیف‌های تنظیمات
export function IconTile({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <span
            className="grid size-[30px] shrink-0 place-items-center rounded-md text-white [&_svg]:size-[18px]"
            style={{ backgroundColor: color }}
        >
            {children}
        </span>
    )
}

interface RowProps {
    leading?: React.ReactNode
    title: React.ReactNode
    subtitle?: React.ReactNode
    trailing?: React.ReactNode
    href?: string
    onClick?: () => void
    chevron?: boolean
    tone?: "default" | "primary" | "destructive"
    className?: string
}

// ردیف لیست؛ خط جداکننده از ستون متن شروع می‌شود (نه از لبهٔ کارت)
export function Row({ leading, title, subtitle, trailing, href, onClick, chevron, tone = "default", className }: RowProps) {
    const content = (
        <>
            {leading}
            <span className="flex min-h-11 min-w-0 flex-1 items-center gap-3 border-b border-separator py-2 pe-4 group-last/row:border-b-0">
                <span className="min-w-0 flex-1 text-right">
                    <span
                        className={cn(
                            "block truncate text-[15px]",
                            tone === "primary" && "text-primary",
                            tone === "destructive" && "text-destructive"
                        )}
                    >
                        {title}
                    </span>
                    {subtitle && <span className="block truncate text-[13px] text-muted-foreground">{subtitle}</span>}
                </span>
                {trailing}
                {(chevron ?? !!href) && <ChevronLeft className="size-[18px] shrink-0 text-muted-foreground/50" />}
            </span>
        </>
    )

    const classes = cn("group/row flex w-full items-center gap-3 ps-4 text-right", (href || onClick) && "press-row", className)

    if (href) {
        return (
            <Link href={href} className={classes}>
                {content}
            </Link>
        )
    }
    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={classes}>
                {content}
            </button>
        )
    }
    return <div className={classes}>{content}</div>
}
