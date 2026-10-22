"use client"

import { createContext, useContext } from "react"

// آیا صفحه‌ای که این کامپوننت داخلش است الان دیده می‌شود (تب‌های دیگر پنهان ولی زنده‌اند)
export const ViewActiveContext = createContext(true)

export function useViewActive() {
    return useContext(ViewActiveContext)
}
