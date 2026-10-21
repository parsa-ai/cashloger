'use client'

import { SubmitEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CloudCheck, CloudOff, FileSpreadsheet, KeyRound, Loader2, RefreshCw, Tags } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { happy } from 'blobatar/expression'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogNav } from '@/components/ui/dialog'
import { UserBlob } from '@/components/web/Avatars'
import { ExportSheet } from '@/components/web/ExportSheet'
import { Group, IconTile, Row } from '@/components/web/Group'
import { ThemeSettings } from '@/components/web/ThemeSettings'
import { createClient } from '@/lib/supabase/client'
import { haptic } from '@/lib/utils'
import { useLogStore } from '@/store/useChartStore'
import { toast } from '@/store/useToastStore'

const PASSWORD_FORM_ID = 'password-form'

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
    haptic([10, 40, 10])
    toast('رمز عبور تغییر کرد', 'success')
    setNewPassword('')
    setConfirmPassword('')
    onOpenChange(false)
  }

  const inputClass = 'h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogNav
          title="تغییر رمز عبور"
          action={
            <Button type="submit" form={PASSWORD_FORM_ID} variant="plain" size="nav" disabled={isSaving || !newPassword}>
              {isSaving ? <Loader2 className="animate-spin" /> : 'ذخیره'}
            </Button>
          }
        />
        <DialogBody>
          <form id={PASSWORD_FORM_ID} onSubmit={handleSubmit}>
            <Group footer={error ? <span className="text-destructive">{error}</span> : 'حداقل ۶ کاراکتر'}>
              <div className="ps-4">
                <input
                  type="password"
                  placeholder="رمز عبور جدید"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSaving}
                  className={`${inputClass} border-b border-separator pe-4`}
                />
                <input
                  type="password"
                  placeholder="تکرار رمز عبور"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSaving}
                  className={`${inputClass} pe-4`}
                />
              </div>
            </Group>
          </form>
        </DialogBody>
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
      // بعد از لینک بازنشانی رمز از ایمیل
      if (new URLSearchParams(window.location.search).get('reset') === '1') {
        setPasswordOpen(true)
        window.history.replaceState(null, '', '/user')
      }
    })
  }, [supabase])

  const savedName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  const blobName = savedName || user?.email || 'user'

  const handleNameSave = async (e: SubmitEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed === savedName) return
    setIsSavingName(true)
    const { data, error } = await supabase.auth.updateUser({ data: { full_name: trimmed } })
    setIsSavingName(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    if (data.user) setUser(data.user)
    haptic([10, 40, 10])
    toast('نام ذخیره شد', 'success')
    // آواتار هدر از سرور می‌آید
    router.refresh()
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
        <div className="mx-auto size-24 animate-pulse rounded-full bg-fill" />
        <div className="h-28 animate-pulse rounded-xl bg-card" />
      </div>
    )
  }

  const nameChanged = name.trim() !== savedName

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-center pt-2 text-center">
        <UserBlob name={blobName} size={96} expression={happy} />
        <h2 className="mt-3 text-[22px] font-semibold">{savedName || 'کاربر کش لاگر'}</h2>
        <p className="text-[15px] text-muted-foreground" dir="ltr">{user?.email}</p>
      </section>

      <Group title="نام نمایشی" footer="بلاب تو از روی همین نام ساخته می‌شه.">
        <form onSubmit={handleNameSave} className="flex items-center gap-2 ps-4 pe-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام و نام خانوادگی"
            enterKeyHint="done"
            maxLength={60}
            disabled={isSavingName}
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
          />
          <Button
            type="submit"
            variant="plain"
            size="nav"
            className={nameChanged ? 'opacity-100' : 'pointer-events-none opacity-0'}
            tabIndex={nameChanged ? 0 : -1}
          >
            {isSavingName ? <Loader2 className="animate-spin" /> : 'ذخیره'}
          </Button>
        </form>
      </Group>

      <ThemeSettings />

      <Group
        title="داده‌ها"
        footer="بدون اینترنت هم می‌تونی تراکنش ثبت کنی؛ وقتی آنلاین شدی خودکار با سرور همگام می‌شه."
      >
        <Row
          href="/categories"
          leading={<IconTile color="oklch(0.6 0.2 295)"><Tags /></IconTile>}
          title="دسته‌بندی‌ها"
          trailing={<span className="num text-[15px] text-muted-foreground">{categoryCount.toLocaleString('fa-IR')}</span>}
        />
        <Row
          onClick={() => setExportOpen(true)}
          leading={<IconTile color="oklch(0.62 0.17 150)"><FileSpreadsheet /></IconTile>}
          title="خروجی اکسل"
          chevron
        />
        <Row
          onClick={() => {
            haptic()
            sync()
          }}
          leading={
            <IconTile color={isOnline ? 'oklch(0.62 0.17 245)' : 'oklch(0.72 0.16 65)'}>
              {isOnline ? <CloudCheck /> : <CloudOff />}
            </IconTile>
          }
          title={isOnline ? 'همگام‌سازی' : 'آفلاین'}
          subtitle={
            pending > 0
              ? `${pending.toLocaleString('fa-IR')} تغییر در انتظار ارسال`
              : formatSyncTime(lastSyncedAt)
          }
          trailing={<RefreshCw className={`size-[18px] text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} />}
        />
      </Group>

      <Group title="امنیت">
        <Row
          onClick={() => setPasswordOpen(true)}
          leading={<IconTile color="oklch(0.55 0.02 260)"><KeyRound /></IconTile>}
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
        <Row
          onClick={handleSignOut}
          tone="destructive"
          title={<span className="block text-center">{confirmSignOut ? 'خروج بدون ذخیره' : 'خروج از حساب'}</span>}
        />
      </Group>

      <PasswordSheet open={passwordOpen} onOpenChange={setPasswordOpen} />
      <ExportSheet open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  )
}
