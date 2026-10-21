import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold outline-none disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        tinted: "bg-tint text-primary",
        secondary: "bg-fill text-foreground",
        destructive: "bg-destructive text-white",
        "destructive-tinted": "bg-destructive/10 text-destructive",
        // دکمهٔ متنی مثل دکمه‌های نوار ناوبری iOS
        plain: "text-primary",
        ghost: "text-foreground hover:bg-fill",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 rounded-lg px-4 text-[15px]",
        sm: "h-8 rounded-md px-3 text-[13px] [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 rounded-xl px-5 text-base",
        icon: "size-9 rounded-full",
        "icon-sm": "size-8 rounded-full [&_svg:not([class*='size-'])]:size-4",
        // دکمه‌های متنیِ نوار بالای شیت‌ها
        nav: "h-9 px-1 text-[15px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
