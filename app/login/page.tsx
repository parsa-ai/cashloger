'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Lock, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isSignUp) {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo}`,
          },
        })
        if (signUpError) throw signUpError
        
        if (data.user?.identities?.length === 0) {
          setError('این ایمیل قبلاً ثبت‌نام کرده است. لطفاً وارد شوید.')
          setIsSignUp(false)
        } else {
          setError('حساب کاربری ایجاد شد. لطفاً ایمیل خود را تأیید کنید.')
          setShowResendConfirmation(true)
        }
      } else {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            setError('ایمیل تأیید نشده است. لطفاً کد تأیید را چک کنید.')
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
      setError(err instanceof Error ? err.message : 'خطایی رخ داد')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setError(null)
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectTo}`,
        },
      })
      if (error) throw error
      setError('ایمیل تأیید مجدداً ارسال شد.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال مجدد')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('لطفاً ابتدا ایمیل خود را وارد کنید')
      return
    }
    
    setError(null)
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setError('لینک بازنشانی رمز عبور به ایمیل شما ارسال شد.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارسال لینک')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">کش لاگر</CardTitle>
          <CardDescription>
            {isSignUp ? 'حساب کاربری جدید بسازید' : 'برای ادامه وارد شوید'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="●●●●●●●●"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {!isSignUp && (
              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                رمز عبور را فراموش کرده‌ام
              </Button>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'ثبت‌نام' : 'ورود'}
            </Button>
          </form>

          {showResendConfirmation && !isSignUp && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                ایمیل تأیید نگرفته‌اید؟
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleResendConfirmation}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="mr-2 h-4 w-4" />
                ارسال مجدد کد تأیید
              </Button>
            </div>
          )}

          <Separator className="my-4" />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setShowResendConfirmation(false)
            }}
            disabled={isLoading}
          >
            {isSignUp ? 'قبلاً ثبت‌نام کرده‌ام' : 'حساب کاربری ندارم'}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>با ادامه، شما قوانین و شرایط را می‌پذیرید.</p>
        </CardFooter>
      </Card>
    </div>
  )
}