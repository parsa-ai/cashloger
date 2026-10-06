'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DateC } from './DateC'
import { Blobatar } from "@blobatar/react";
import "blobatar/motion.css";

import { useState, useEffect } from 'react'

interface UserData {
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
  }
}

function UserMenu({ initialUser }: { initialUser: UserData | null }) {

  const supabase = createClient()
  const [user, setUser] = useState<UserData | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser)

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

  

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return null
  }

  return (
    <Link href="/user" className="relative h-8 w-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity block">
      <Blobatar
        animate='always'
        name={user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'user'}
      />
    </Link>
  )
}

function Nav({ initialUser }: { initialUser: UserData | null }) {
  return (
    <nav className="w-full flex gap-4 justify-between items-center p-4 border-b">
      <Link href="/">
        <h1 className="text-xl font-bold">کش لاگر</h1>
      </Link>
      <DateC />
      <div className="flex items-center gap-4">
        {initialUser && (
          <UserMenu initialUser={initialUser} />
        )}
      </div>
    </nav>
  )
}

export default Nav