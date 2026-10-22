'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AtSign, Check, Loader2, Mail, X } from 'lucide-react'
import { happy } from 'blobatar/expression'

import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/ui/password-field'
import { UserBlob } from '@/components/web/Avatars'
import { Group } from '@/components/web/Group'
import { cleanUsername, useUsernameAvailability } from '@/hooks/useUsernameAvailability'
import { createClient } from '@/lib/supabase/client'
import { cn, haptic } from '@/lib/utils'

type Mode = 'login' | 'signup' | 'sent'
type Message = { text: string; tone: 'error' | 'info' }

// بلاب صفحهٔ ورود ثابت است؛ از روی چیزی که کاربر تایپ می‌کند ساخته نمی‌شود
const MASCOT = 'کش لاگر'

const inputClass = 'h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70'

function Field({ icon, children, last }: { icon: React.ReactNode; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="flex items-center gap-3 ps-4">
      <span className="text-muted-foreground [&_svg]:size-[18px]">{icon}</span>
      <div className={cn('flex min-w-0 flex-1 items-center pe-3', !last && 'border-b border-separator')}>{children}</div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.02c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [mode, setMode] = useState<Mode>('login')
  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [message, setMessage] = useState<Message | null>(() => {
    const error = searchParams.get('error')
    if (error === 'link') return { text: 'لینک ایمیل نامعتبر است یا منقضی شده.', tone: 'error' }
    if (error === 'oauth') return { text: 'ورود با گوگل انجام نشد. دوباره امتحان کن.', tone: 'error' }
    return null
  })

  const availability = useUsernameAvailability(username, mode === 'signup')
  const supabase = createClient()
  // لینک‌های ایمیل اول به /auth/callback می‌آیند تا نشست ساخته شود
  const callbackUrl = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  const switchMode = (next: Mode) => {
    haptic()
    setMode(next)
    setMessage(null)
    setCanResend(false)
  }

  const fail = (text: string) => {
    haptic([30, 40, 30])
    setMessage({ text, tone: 'error' })
  }

  const handleLogin = async () => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (body.code === 'email_not_confirmed') setCanResend(identifier.includes('@'))
      fail(body.error ?? 'خطایی رخ داد')
      return
    }
    haptic([10, 40, 10])
    router.push(redirectTo)
    router.refresh()
  }

  const handleSignUp = async () => {
    if (availability === 'invalid') return fail('نام کاربری ۳ تا ۲۰ حرف انگلیسی کوچک، عدد یا _ باشد')
    if (availability === 'taken') return fail('این نام کاربری قبلاً گرفته شده')

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callbackUrl(redirectTo), data: { username } },
    })
    if (error) throw error

    if (data.user?.identities?.length === 0) {
      setMode('login')
      setIdentifier(email)
      setMessage({ text: 'این ایمیل قبلاً ثبت‌نام کرده؛ وارد شو.', tone: 'info' })
      return
    }
    haptic([10, 40, 10])
    // اگر تأیید ایمیل خاموش باشد، همین الان وارد شده‌ایم
    if (data.session) {
      router.push(redirectTo)
      router.refresh()
      return
    }
    setMode('sent')
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)
    try {
      if (mode === 'signup') await handleSignUp()
      else await handleLogin()
    } catch (err) {
      fail(err instanceof Error ? err.message : 'خطایی رخ داد')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    const target = mode === 'sent' ? email : identifier
    setIsLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: target,
      options: { emailRedirectTo: callbackUrl(redirectTo) },
    })
    setIsLoading(false)
    if (error) fail(error.message)
    else setMessage({ text: 'ایمیل تأیید دوباره ارسال شد.', tone: 'info' })
  }

  // گوگل بعد از ورود با یک code به /auth/callback برمی‌گردد
  const handleGoogle = async () => {
    haptic()
    setMessage(null)
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl(redirectTo) },
    })
    // در صورت موفقیت مرورگر به صفحهٔ گوگل می‌رود و این صفحه دیگر نمی‌ماند
    if (error) {
      setIsLoading(false)
      fail(error.message)
    }
  }

  const handleForgotPassword = async () => {
    if (!identifier.includes('@')) return fail('برای بازیابی رمز، ایمیلت رو در کادر بالا بنویس')
    setIsLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
      redirectTo: callbackUrl('/user?reset=1'),
    })
    setIsLoading(false)
    if (error) fail(error.message)
    else setMessage({ text: 'لینک بازیابی رمز به ایمیلت ارسال شد.', tone: 'info' })
  }

  const messageNode = message && (
    <span key={message.text} className={cn('block animate-fade-in', message.tone === 'error' && 'text-destructive')}>
      {message.text}
    </span>
  )

  // بعد از ثبت‌نام: منتظر تأیید ایمیل
  if (mode === 'sent') {
    return (
      <div className="safe-top flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-sm animate-fade-in flex-col items-center text-center">
          <UserBlob name={username || MASCOT} size={96} expression={happy} />
          <h1 className="mt-5 text-[24px] font-bold">ایمیلت رو چک کن</h1>
          <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
            یک لینک تأیید برای <span dir="ltr" className="font-semibold text-foreground">{email}</span> فرستادیم.
            <br />
            بازش کن تا مستقیم وارد کش لاگر بشی.
          </p>
          {message && <p className="mt-3 text-[13px] text-muted-foreground">{messageNode}</p>}
          <div className="mt-8 flex w-full flex-col gap-2">
            <Button size="lg" variant="tinted" onClick={handleResend} disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              ارسال دوبارهٔ ایمیل
            </Button>
            <Button size="lg" variant="plain" onClick={() => switchMode('login')}>
              برگشت به ورود
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isSignUp = mode === 'signup'

  return (
    <div className="safe-top flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <PasswordField
          name={MASCOT}
          size={96}
          value={password}
          onValueChange={setPassword}
          required
          minLength={6}
          disabled={isLoading}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          hint={isSignUp}
          between={
            <div className="mb-4 space-y-5">
              <div className="text-center">
                <h1 className="text-[28px] font-bold">کش لاگر</h1>
                <p className="mt-1 text-[15px] text-muted-foreground">
                  {isSignUp ? 'یک حساب تازه بساز' : 'دخل و خرجت، همیشه دم دستت'}
                </p>
              </div>

              <Group footer={messageNode || undefined}>
                {isSignUp ? (
                  <>
                    <Field icon={<AtSign />}>
                      <input
                        dir="ltr"
                        placeholder="نام کاربری"
                        value={username}
                        onChange={(e) => setUsername(cleanUsername(e.target.value))}
                        required
                        disabled={isLoading}
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        className={cn(inputClass, 'text-right placeholder:text-right')}
                      />
                      <span className="grid size-6 shrink-0 place-items-center">
                        {availability === 'checking' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                        {availability === 'free' && <Check className="size-4 animate-pop text-success" strokeWidth={3} />}
                        {(availability === 'taken' || availability === 'invalid') && (
                          <X className="size-4 animate-pop text-destructive" strokeWidth={3} />
                        )}
                      </span>
                    </Field>
                    <Field icon={<Mail />} last>
                      <input
                        type="email"
                        dir="ltr"
                        placeholder="ایمیل"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                        className={cn(inputClass, 'text-right placeholder:text-right')}
                      />
                    </Field>
                  </>
                ) : (
                  <Field icon={<AtSign />} last>
                    <input
                      dir="ltr"
                      placeholder="نام کاربری یا ایمیل"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      className={cn(inputClass, 'text-left placeholder:text-right')}
                    />
                  </Field>
                )}
              </Group>
              {isSignUp && (
                <p className="-mt-3 px-4 text-[12px] text-muted-foreground">
                  {availability === 'taken'
                    ? 'این نام کاربری گرفته شده'
                    : availability === 'invalid'
                      ? '۳ تا ۲۰ حرف: a-z، عدد یا _'
                      : ''}
                </p>
              )}
            </div>
          }
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || (isSignUp && (availability === 'taken' || availability === 'invalid'))}
        >
          {isLoading && <Loader2 className="animate-spin" />}
          {isSignUp ? 'ساخت حساب' : 'ورود'}
        </Button>

        <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
          <span className="h-px flex-1 bg-separator" />
          یا
          <span className="h-px flex-1 bg-separator" />
        </div>

        <Button type="button" size="lg" variant="secondary" className="w-full" onClick={handleGoogle} disabled={isLoading}>
          <GoogleIcon />
          ادامه با گوگل
        </Button>

        <div className="flex flex-col items-center gap-1">
          {canResend && !isSignUp && (
            <Button type="button" variant="plain" size="nav" onClick={handleResend} disabled={isLoading}>
              ارسال دوبارهٔ ایمیل تأیید
            </Button>
          )}
          {!isSignUp && (
            <Button type="button" variant="plain" size="nav" className="font-medium" onClick={handleForgotPassword} disabled={isLoading}>
              رمز عبورم یادم رفته
            </Button>
          )}
          <Button
            type="button"
            variant="plain"
            size="nav"
            className="font-medium"
            onClick={() => switchMode(isSignUp ? 'login' : 'signup')}
            disabled={isLoading}
          >
            {isSignUp ? 'حساب دارم، ورود' : 'حساب ندارم، ثبت‌نام'}
          </Button>
        </div>
      </form>
    </div>
  )
}
