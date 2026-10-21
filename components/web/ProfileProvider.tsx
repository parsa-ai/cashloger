"use client"

import { createContext, useContext, useState } from "react"

interface Profile {
    username: string | null
    email: string | null
    setUsername: (username: string) => void
}

const ProfileContext = createContext<Profile>({ username: null, email: null, setUsername: () => {} })

// پروفایل کاربر فعلی که سرور خوانده؛ با context تا رندر سرور و مرورگر یکی باشد
export function ProfileProvider({
    username: initialUsername,
    email,
    children,
}: {
    username: string | null
    email: string | null
    children: React.ReactNode
}) {
    const [username, setUsername] = useState(initialUsername)
    const [prev, setPrev] = useState(initialUsername)
    // اگر سرور نام تازه‌تری فرستاد (مثلاً بعد از refresh)
    if (initialUsername !== prev) {
        setPrev(initialUsername)
        setUsername(initialUsername)
    }

    return <ProfileContext.Provider value={{ username, email, setUsername }}>{children}</ProfileContext.Provider>
}

export const useProfile = () => useContext(ProfileContext)

// نام بلاب کاربر: نام کاربری، وگرنه ایمیل؛ بلاب همه‌جا از همین ساخته می‌شود
export function useBlobName() {
    const { username, email } = useProfile()
    return username || email || "کش لاگر"
}
