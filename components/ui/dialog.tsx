"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/35 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200",
        className
      )}
      {...props}
    />
  )
}

// روی موبایل شیت پایین صفحه، روی دسکتاپ پنجرهٔ وسط صفحه
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        // کیبورد نباید وسط انیمیشن باز شدن شیت بالا بیاید
        onOpenAutoFocus={(e) => e.preventDefault()}
        aria-describedby={undefined}
        className={cn(
          "fixed z-50 flex w-full flex-col bg-background outline-none",
          "inset-x-0 bottom-0 max-h-[94dvh] rounded-t-2xl safe-bottom will-change-transform data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
          "sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[85dvh] sm:max-w-md sm:rounded-2xl sm:pb-4 sm:shadow-float sm:data-[state=open]:animate-in sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-[0.97] sm:data-[state=open]:duration-200 sm:data-[state=closed]:animate-out sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-[0.97] sm:data-[state=closed]:duration-150",
          className
        )}
        {...props}
      >
        <div aria-hidden className="mx-auto mt-2 h-[5px] w-9 shrink-0 rounded-full bg-fill-strong sm:hidden" />
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// نوار بالای شیت: دکمهٔ تأیید سمت راست، عنوان وسط، لغو سمت چپ
function DialogNav({
  title,
  cancelLabel = "انصراف",
  action,
  center,
  className,
}: {
  title: React.ReactNode
  // به‌جای عنوان، کنترلی وسط نوار (عنوان برای صفحه‌خوان می‌ماند)
  center?: React.ReactNode
  cancelLabel?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4", className)}>
      {/* راست‌به‌چپ: ستون اول سمت راست است */}
      <div className="justify-self-start">{action}</div>
      {center ? (
        <div className="min-w-0">
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {center}
        </div>
      ) : (
        <DialogPrimitive.Title className="truncate text-[17px] font-semibold">{title}</DialogPrimitive.Title>
      )}
      <DialogPrimitive.Close className="press justify-self-end text-[15px] text-muted-foreground outline-none">
        {cancelLabel}
      </DialogPrimitive.Close>
    </div>
  )
}

// بدنهٔ قابل اسکرول شیت
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("no-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pt-2 pb-4", className)}
      {...props}
    />
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col items-center gap-1 text-center", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[17px] font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogNav,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
