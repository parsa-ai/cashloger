import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

// لیست گروه‌بندی‌شده به سبک تنظیمات iOS
export function Group({
    title,
    footer,
    className,
    children,
}: {
    title?: React.ReactNode
    footer?: React.ReactNode
    className?: string
    children: React.ReactNode
}) {
    return (
        <section className={cn("space-y-1.5", className)}>
            {title && <h2 className="px-4 text-[13px] font-medium text-muted-foreground">{title}</h2>}
            <div className="overflow-hidden rounded-2xl bg-card divide-y divide-border/70">{children}</div>
            {footer && <p className="px-4 text-xs leading-5 text-muted-foreground">{footer}</p>}
        </section>
    )
}

interface GroupItemProps {
    icon?: React.ReactNode
    iconColor?: string
    title: React.ReactNode
    subtitle?: React.ReactNode
    trailing?: React.ReactNode
    href?: string
    onClick?: () => void
    destructive?: boolean
    chevron?: boolean
    className?: string
    style?: React.CSSProperties
}

export function GroupItem({
    icon,
    iconColor,
    title,
    subtitle,
    trailing,
    href,
    onClick,
    destructive,
    chevron,
    className,
    style,
}: GroupItemProps) {
    const content = (
        <>
            {icon && (
                <span
                    className="grid size-8 shrink-0 place-items-center rounded-[0.6rem] text-white [&_svg]:size-[18px]"
                    style={{ backgroundColor: iconColor ?? "var(--primary)" }}
                >
                    {icon}
                </span>
            )}
            <span className="min-w-0 flex-1 text-right">
                <span className={cn("block truncate", destructive && "text-destructive")}>{title}</span>
                {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
            </span>
            {trailing}
            {(chevron ?? !!href) && <ChevronLeft className="size-4 shrink-0 text-muted-foreground/60" />}
        </>
    )

    const classes = cn(
        "flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-[15px] transition-colors",
        (href || onClick) && "active:bg-muted",
        className
    )

    if (href) {
        return (
            <Link href={href} className={classes} style={style}>
                {content}
            </Link>
        )
    }
    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={classes} style={style}>
                {content}
            </button>
        )
    }
    return (
        <div className={classes} style={style}>
            {content}
        </div>
    )
}
