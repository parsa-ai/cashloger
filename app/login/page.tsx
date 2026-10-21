'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { happy, sad } from 'blobatar/expression'

import { Button } from '@/components/ui/button'
import { UserBlob } from '@/components/web/Avatars'
import { Group } from '@/components/web/Group'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Message = { text: string; tone: 'error' | 'info' }

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(
    searchParams.get('error') === 'link' ? { text: 'لینک ایمیل نامعتبر است یا منقضی شده.', tone: 'error' } : null
  )
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)

  const supabase = createClient()
  // لینک‌های ایمیل اول به /auth/callback می‌آیند تا نشست ساخته شود
  const callbackUrl = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl(redirectTo) },
        })
        if (signUpError) throw signUpError

        if (data.user?.identities?.length === 0) {
          setMessage({ text: 'این ایمیل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.', tone: 'info' })
          setIsSignUp(false)
        } else {
          setMessage({ text: 'حساب ساخته شد. لینک تأیید را در ایمیلت باز کن.', tone: 'info' })
          setShowResendConfirmation(true)
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            setMessage({ text: 'ایمیل هنوز تأیید نشده. لینک تأیید را در ایمیلت باز کن.', tone: 'error' })
            setShowResendConfirmation(true)
          } else if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('ایمیل یا رمز عبور اشتباه است')
          } else {
            throw signInError
          }
          return
        }
        router.push(redirectTo)
        router.refresh()
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'خطایی رخ داد', tone: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setMessage(null)
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: callbackUrl(redirectTo) },
      })
      if (error) throw error
      setMessage({ text: 'ایمیل تأیید دوباره ارسال شد.', tone: 'info' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'خطا در ارسال مجدد', tone: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ text: 'اول ایمیلت رو وارد کن', tone: 'error' })
      return
    }
    setMessage(null)
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl('/user?reset=1'),
      })
      if (error) throw error
      setMessage({ text: 'لینک بازنشانی رمز عبور به ایمیلت ارسال شد.', tone: 'info' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'خطا در ارسال لینک', tone: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = 'h-11 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70'

  return (
    <div className="safe-top flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <UserBlob name={email.trim() || 'کش لاگر'} size={88} expression={message?.tone === 'error' ? sad : happy} />
          <h1 className="mt-4 text-[28px] font-bold">کش لاگر</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {isSignUp ? 'یک حساب تازه بساز' : 'دخل و خرجت، همیشه دم دستت'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Group
            footer={
              message && (
                <span key={message.text} className={cn('block animate-fade-in', message.tone === 'error' && 'text-destructive')}>
                  {message.text}
                </span>
              )
            }
          >
            <div className="ps-4">
              <input
                id="email"
                type="email"
                dir="ltr"
                placeholder="ایمیل"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className={`${inputClass} border-b border-separator pe-4 text-right placeholder:text-right`}
              />
              <div className="flex items-center pe-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  placeholder="رمز عبور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  className={`${inputClass} text-right placeholder:text-right`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                  className="press grid size-9 shrink-0 place-items-center text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
                </button>
              </div>
            </div>
          </Group>

          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {isSignUp ? 'ثبت‌نام' : 'ورود'}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-1">
          {showResendConfirmation && !isSignUp && (
            <Button variant="plain" size="nav" onClick={handleResendConfirmation} disabled={isLoading}>
              ارسال دوبارهٔ ایمیل تأیید
            </Button>
          )}
          {!isSignUp && (
            <Button variant="plain" size="nav" className="font-medium" onClick={handleForgotPassword} disabled={isLoading}>
              رمز عبورم یادم رفته
            </Button>
          )}
          <Button
            variant="plain"
            size="nav"
            className="font-medium"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage(null)
              setShowResendConfirmation(false)
            }}
            disabled={isLoading}
          >
            {isSignUp ? 'قبلاً ثبت‌نام کرده‌ام' : 'حساب ندارم، ثبت‌نام'}
          </Button>
        </div>
      </div>
    </div>
  )
}
