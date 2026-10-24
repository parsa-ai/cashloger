'use client'

import { SubmitEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AtSign, Check, CloudCheck, CloudOff, FileSpreadsheet, KeyRound, Loader2, RefreshCw, Sparkles, Tags, X } from 'lucide-react'
import { idle, sleepy } from 'blobatar/expression'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogNav } from '@/components/ui/dialog'
import { PasswordField } from '@/components/ui/password-field'
import { UserBlob } from '@/components/web/Avatars'
import { ExportSheet } from '@/components/web/ExportSheet'
import { IntroSlides } from '@/components/web/IntroSlides'
import { MoneyUnitSettings } from '@/components/web/MoneyUnitSettings'
import { ReminderSettings } from '@/components/web/Reminders'
import { Group, IconTile, Row } from '@/components/web/Group'
import { useBlobName, useProfile } from '@/components/web/ProfileProvider'
import { ThemeSettings } from '@/components/web/ThemeSettings'
import { cleanUsername, useUsernameAvailability } from '@/hooks/useUsernameAvailability'
import { disablePush } from '@/lib/push'
import { createClient } from '@/lib/supabase/client'
import { haptic } from '@/lib/utils'
import { useLogStore } from '@/store/useChartStore'
import { toast } from '@/store/useToastStore'

const PASSWORD_FORM_ID = 'password-form'
const USERNAME_FORM_ID = 'username-form'

const inputClass = 'h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70'

function PasswordSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const supabase = createClient()
  const blobName = useBlobName()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogNav
          title="تغییر رمز عبور"
          action={
            <Button type="submit" form={PASSWORD_FORM_ID} size="icon" aria-label="ذخیره" disabled={isSaving || !newPassword}>
              {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
            </Button>
          }
        />
        <DialogBody>
          <form id={PASSWORD_FORM_ID} onSubmit={handleSubmit} className="space-y-3">
            <PasswordField
              name={blobName}
              size={88}
              id="new-password"
              placeholder="رمز عبور جدید"
              autoComplete="new-password"
              value={newPassword}
              onValueChange={setNewPassword}
              disabled={isSaving}
              hint
            />
            <Group footer={error ? <span className="text-destructive">{error}</span> : 'حداقل ۶ کاراکتر'}>
              <input
                type="password"
                dir="ltr"
                placeholder="تکرار رمز عبور"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSaving}
                className={`${inputClass} px-4 text-right placeholder:text-right`}
              />
            </Group>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

function UsernameSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const { username: current, setUsername: setProfileUsername } = useProfile()
  const [value, setValue] = useState(current ?? '')
  const [prevOpen, setPrevOpen] = useState(open)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const availability = useUsernameAvailability(value, open, current)

  // با هر بار باز شدن از نام فعلی شروع کن
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setValue(current ?? '')
      setError(null)
    }
  }

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (value === current || availability === 'invalid' || availability === 'taken') return
    setIsSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: session?.user.id, username: value, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    setIsSaving(false)
    if (error) {
      setError(error.code === '23505' ? 'این نام کاربری گرفته شده' : error.message)
      haptic([30, 40, 30])
      return
    }
    haptic([10, 40, 10])
    setProfileUsername(value)
    toast('نام کاربری ذخیره شد', 'success')
    onOpenChange(false)
    router.refresh()
  }

  const footer =
    error ??
    (availability === 'taken'
      ? 'این نام کاربری گرفته شده'
      : availability === 'invalid'
        ? '۳ تا ۲۰ حرف: a-z، عدد یا _'
        : 'با نام کاربری یا ایمیل می‌تونی وارد بشی. بلابت هم از همین ساخته می‌شه.')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogNav
          title="نام کاربری"
          action={
            <Button
              type="submit"
              form={USERNAME_FORM_ID}
              size="icon"
              aria-label="ذخیره"
              disabled={isSaving || value === current || availability !== 'free'}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
            </Button>
          }
        />
        <DialogBody>
          <form id={USERNAME_FORM_ID} onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center pt-2">
              <UserBlob name={value || current || 'کش لاگر'} size={88} />
            </div>
            <Group
              footer={
                <span className={availability === 'taken' || availability === 'invalid' || error ? 'text-destructive' : undefined}>
                  {footer}
                </span>
              }
            >
              <div className="flex items-center gap-3 ps-4 pe-3">
                <AtSign className="size-[18px] text-muted-foreground" />
                <input
                  dir="ltr"
                  value={value}
                  onChange={(e) => {
                    setValue(cleanUsername(e.target.value))
                    setError(null)
                  }}
                  placeholder="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="done"
                  className={`${inputClass} text-right`}
                />
                <span className="grid size-6 shrink-0 place-items-center">
                  {availability === 'checking' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                  {availability === 'free' && <Check className="size-4 animate-pop text-success" strokeWidth={3} />}
                  {(availability === 'taken' || availability === 'invalid') && (
                    <X className="size-4 animate-pop text-destructive" strokeWidth={3} />
                  )}
                </span>
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

export function UserView() {
  const router = useRouter()
  const supabase = createClient()
  const { username, email } = useProfile()
  const blobName = useBlobName()

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [introOpen, setIntroOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const isOnline = useLogStore((s) => s.isOnline)
  const isSyncing = useLogStore((s) => s.isSyncing)
  const pending = useLogStore((s) => s.queue.length)
  const lastSyncedAt = useLogStore((s) => s.lastSyncedAt)
  const categoryCount = useLogStore((s) => s.categories.length)
  const sync = useLogStore((s) => s.sync)
  const reset = useLogStore((s) => s.reset)

  useEffect(() => {
    // بعد از لینک بازیابی رمز از ایمیل
    if (new URLSearchParams(window.location.search).get('reset') !== '1') return
    window.history.replaceState(null, '', '/user')
    const timer = setTimeout(() => setPasswordOpen(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleSignOut = async () => {
    if (pending > 0 && !confirmSignOut) {
      setConfirmSignOut(true)
      haptic()
      return
    }
    await disablePush()
    await supabase.auth.signOut()
    reset(true)
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-center pt-2 text-center">
        <UserBlob name={blobName} size={96} expression={isOnline ? idle : sleepy} accessory />
        <h2 className="mt-3 text-[22px] font-semibold" dir="ltr">
          {username ? `@${username}` : 'کاربر کش لاگر'}
        </h2>
        <p className="text-[15px] text-muted-foreground" dir="ltr">{email}</p>
      </section>



      <ThemeSettings />
      <div className="space-y-3">
        <ReminderSettings />
      <MoneyUnitSettings />
      </div>



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
        <Row
          onClick={() => setIntroOpen(true)}
          leading={<IconTile color="oklch(0.7 0.16 60)"><Sparkles /></IconTile>}
          title="راهنمای برنامه"
          chevron
        />
      </Group>


      <Group
        title="حساب"
      >
        <Row
          onClick={() => setUsernameOpen(true)}
          leading={<IconTile color="oklch(0.62 0.17 255)"><AtSign /></IconTile>}
          title="نام کاربری"
          trailing={
            username ? (
              <span className="text-[15px] text-muted-foreground" dir="ltr">@{username}</span>
            ) : (
              <span className="text-[15px] text-primary">انتخاب کن</span>
            )
          }
          chevron
        />
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

      <UsernameSheet open={usernameOpen} onOpenChange={setUsernameOpen} />
      <PasswordSheet open={passwordOpen} onOpenChange={setPasswordOpen} />
      <ExportSheet open={exportOpen} onOpenChange={setExportOpen} />
      {introOpen && <IntroSlides doneLabel="فهمیدم" onDone={() => setIntroOpen(false)} />}
    </div>
  )
}
