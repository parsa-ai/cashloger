'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ModeToggle } from '@/components/ui/ModeToggle'
import { DateC } from './DateC'
import { Blobatar } from "@blobatar/react";
import "blobatar/motion.css";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User, Mail, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface UserData {
  email?: string
}

function UserMenu({ initialUser }: { initialUser: UserData | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserData | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (initialUser) {
      setIsLoading(false)
      return
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user ? { email: user.email } : null)
      setIsLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email } : null)
    })

    return () => subscription.unsubscribe()
  }, [supabase, initialUser])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className=" relative h-8 w-8 rounded-full">
          <Blobatar
            animate='always'
            name={user.email || 'User'}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex gap-1">
            <User className="h-4 w-4" />
            <p className="text-xs font-medium truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              خروج
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Nav({ initialUser }: { initialUser: UserData | null }) {
  return (
    <nav className="w-full flex gap-4 justify-between items-center p-4 border-b">
      <Link href="/">
        <h1 className="text-xl font-bold">کش لاگر</h1>
      </Link>
      <div className="w-max">
        <DateC />
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <UserMenu initialUser={initialUser} />
      </div>
    </nav>
  )
}

export default Nav