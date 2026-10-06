'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Lock, User, LogOut, CheckCircle, AlertCircle, Save } from 'lucide-react'
import { ModeToggle } from '@/components/ui/ModeToggle'

import { Blobatar } from "@blobatar/react"
import "blobatar/motion.css"

export default function UserPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setName(user.user_metadata?.full_name || user.user_metadata?.name || '')
      }
      setIsLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '')
      } else {
        setUser(null)
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)
    setIsSaving(true)

    try {
      const updates: any = {}
      if (name) updates.full_name = name

      const { error } = await supabase.auth.updateUser({
        data: updates
      })
      if (error) throw error

      setProfileSuccess('پروفایل با موفقیت به‌روزرسانی شد')
      setUser((prev: any) => ({ ...prev, user_metadata: { ...prev.user_metadata, ...updates } }))
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'خطا در به‌روزرسانی')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSecurityError(null)
    setSecuritySuccess(null)

    if (newPassword !== confirmPassword) {
      setSecurityError('رمز عبور جدید و تکرار آن یکسان نیستند')
      return
    }

    if (newPassword.length < 6) {
      setSecurityError('رمز عبور باید حداقل ۶ کاراکتر باشد')
      return
    }

    setIsChangingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error

      setSecuritySuccess('رمز عبور با موفقیت تغییر کرد')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'خطا در تغییر رمز عبور')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded-lg w-1/4" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const displayName = name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'user'
  const displayEmail = user.email || ''

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">تنظیمات حساب کاربری</h1>
          <p className="text-muted-foreground">مدیریت پروفایل و امنیت</p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {displayName ? (
                  <Blobatar
                    animate='always'
                    name={displayName}
                  />
                ) : (
                  <AvatarFallback className="text-2xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              <p className="text-muted-foreground">{displayEmail}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab as any}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">
                <User className="mr-2 h-4 w-4" />
                پروفایل
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="mr-2 h-4 w-4" />
                امنیت
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6 space-y-6">
              <form onSubmit={handleProfileUpdate} className="space-y-4" dir='rtl'>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">نام و نام خانوادگی</label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="نام خود را وارد کنید"
                    disabled={isSaving}
                  />
                </div>

                {profileError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span>{profileError}</span>
                  </div>
                )}
                {profileSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  ذخیره تغییرات
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="security" className="mt-6 space-y-6">
              <form onSubmit={handlePasswordChange} className="space-y-4 " dir='rtl'>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">رمز عبور فعلی</label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">رمز عبور جدید</label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">تکرار رمز عبور جدید</label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isChangingPassword}
                  />
                </div>

                {securityError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span>{securityError}</span>
                  </div>
                )}
                {securitySuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span>{securitySuccess}</span>
                  </div>
                )}

                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Lock className="mr-2 h-4 w-4" />
                  تغییر رمز عبور
                </Button>
              </form>

              <Separator className="my-6" />
              
              <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg border border-destructive/10" dir='rtl'>
                <div>
                  <p className="font-medium text-destructive">خروج از حساب کاربری</p>
                </div>
                <Button variant="destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  خروج
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}