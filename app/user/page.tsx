'use client'

import { SubmitEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CloudCheck, CloudOff, FileSpreadsheet, KeyRound, Loader2, LogOut, RefreshCw, Tags } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Blobatar } from "@blobatar/react"
import "blobatar/motion.css"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExportSheet } from '@/components/web/ExportSheet'
import { Group, GroupItem } from '@/components/web/Group'
import { ThemeSettings } from '@/components/web/ThemeSettings'
import { createClient } from '@/lib/supabase/client'
import { haptic } from '@/lib/utils'
import { useLogStore } from '@/store/useChartStore'
import { toast } from '@/store/useToastStore'

function PasswordSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const supabase = createClient()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تکرار آن یکسان نیستند')
      return
    }

    setIsSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setIsSaving(false)

    if (error) {
      setError(error.message)
      return
    }
    toast('رمز عبور تغییر کرد', 'success')
    setNewPassword('')
    setConfirmPassword('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>تغییر رمز عبور</DialogTitle>
            <DialogDescription>حداقل ۶ کاراکتر</DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="رمز عبور جدید"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSaving}
          />
          <Input
            type="password"
            placeholder="تکرار رمز عبور جدید"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSaving}
          />
          {error && <p className="animate-item-in px-1 text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="mb-2 w-full" disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin" />}
            ذخیره رمز عبور
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formatSyncTime(timestamp: number | null) {
  if (!timestamp) return 'هنوز همگام نشده'
  return 'آخرین همگام‌سازی ' + new Date(timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
}

export default function UserPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const isOnline = useLogStore((s) => s.isOnline)
  const isSyncing = useLogStore((s) => s.isSyncing)
  const pending = useLogStore((s) => s.queue.length)
  const lastSyncedAt = useLogStore((s) => s.lastSyncedAt)
  const categoryCount = useLogStore((s) => s.categories.length)
  const sync = useLogStore((s) => s.sync)
  const reset = useLogStore((s) => s.reset)

  useEffect(() => {
    // getSession از حافظهٔ دستگاه می‌خواند و آفلاین هم کار می‌کند
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '')
      }
      setIsLoading(false)
    })
  }, [supabase])

  const handleNameSave = async (e: SubmitEvent) => {
    e.preventDefault()
    setIsSavingName(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setIsSavingName(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    haptic([10, 40, 10])
    toast('نام ذخیره شد', 'success')
  }

  const handleSignOut = async () => {
    if (pending > 0 && !confirmSignOut) {
      setConfirmSignOut(true)
      haptic()
      return
    }
    await supabase.auth.signOut()
    reset(true)
    router.push('/login')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-3xl bg-muted" />
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      </div>
    )
  }

  const displayName = name || user?.email || 'user'
  const savedName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''

  return (
    <div className="space-y-7">
      <section className="flex animate-item-in items-center gap-4 rounded-3xl bg-card p-4">
        <div className="size-16 shrink-0 overflow-hidden rounded-full">
          <Blobatar animate="always" name={displayName} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{savedName || 'کاربر کش لاگر'}</h2>
          <p className="truncate text-sm text-muted-foreground" dir="ltr">{user?.email}</p>
        </div>
      </section>

      <Group title="پروفایل">
        <form onSubmit={handleNameSave} className="flex items-center gap-2 p-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام و نام خانوادگی"
            disabled={isSavingName}
          />
          <Button type="submit" variant="tinted" disabled={isSavingName || name.trim() === savedName}>
            {isSavingName && <Loader2 className="animate-spin" />}
            ذخیره
          </Button>
        </form>
      </Group>

      <ThemeSettings />

      <Group
        title="داده‌ها"
        footer="بدون اینترنت هم می‌تونی تراکنش ثبت کنی؛ وقتی آنلاین شدی خودکار با سرور همگام می‌شه."
      >
        <GroupItem
          href="/categories"
          icon={<Tags />}
          iconColor="oklch(0.65 0.18 290)"
          title="دسته‌بندی‌ها"
          trailing={<span className="text-sm text-muted-foreground">{categoryCount.toLocaleString('fa-IR')}</span>}
        />
        <GroupItem
          onClick={() => setExportOpen(true)}
          icon={<FileSpreadsheet />}
          iconColor="oklch(0.6 0.15 150)"
          title="خروجی اکسل"
          chevron
        />
        <GroupItem
          onClick={() => sync()}
          icon={isOnline ? <CloudCheck /> : <CloudOff />}
          iconColor={isOnline ? 'oklch(0.62 0.16 230)' : 'oklch(0.7 0.16 70)'}
          title={isOnline ? 'همگام‌سازی' : 'آفلاین'}
          subtitle={
            pending > 0
              ? `${pending.toLocaleString('fa-IR')} تغییر در انتظار ارسال`
              : formatSyncTime(lastSyncedAt)
          }
          trailing={<RefreshCw className={`size-4 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} />}
        />
      </Group>

      <Group title="امنیت">
        <GroupItem
          onClick={() => setPasswordOpen(true)}
          icon={<KeyRound />}
          iconColor="oklch(0.55 0.02 260)"
          title="تغییر رمز عبور"
          chevron
        />
      </Group>

      <Group
        footer={
          confirmSignOut
            ? `${pending.toLocaleString('fa-IR')} تغییر هنوز به سرور نرسیده و با خروج از بین می‌رود. برای خروج دوباره بزن.`
            : undefined
        }
      >
        <GroupItem
          onClick={handleSignOut}
          icon={<LogOut />}
          iconColor="var(--destructive)"
          title={confirmSignOut ? 'خروج بدون ذخیره' : 'خروج از حساب'}
          destructive
        />
      </Group>

      <PasswordSheet open={passwordOpen} onOpenChange={setPasswordOpen} />
      <ExportSheet open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  )
}
