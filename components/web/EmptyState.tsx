"use client"

import type { Expression } from "blobatar/expression"
import { UserBlob } from "@/components/web/Avatars"

// حالت خالی با بلاب ماسکوت برنامه
export function EmptyState({
    title,
    description,
    expression,
    children,
}: {
    title: string
    description?: string
    expression?: Expression
    children?: React.ReactNode
}) {
    return (
        <div className="flex animate-fade-in flex-col items-center px-6 py-10 text-center">
            <UserBlob name="کش لاگر" size={72} expression={expression} />
            <p className="mt-3 text-[15px] font-semibold">{title}</p>
            {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
        </div>
    )
}
