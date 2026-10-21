import { create } from "zustand"

export type ToastTone = "default" | "success" | "error"

export interface Toast {
    id: number
    message: string
    tone: ToastTone
    // در حال محو شدن (انیمیشن خروج)
    leaving: boolean
}

interface ToastStore {
    toasts: Toast[]
    show: (message: string, tone?: ToastTone) => void
    dismiss: (id: number) => void
}

const VISIBLE_MS = 2600
const LEAVE_MS = 180
let nextId = 1

export const useToastStore = create<ToastStore>((set, get) => ({
    toasts: [],
    show: (message, tone = "default") => {
        const id = nextId++
        // فقط یک توست در لحظه، مثل iOS؛ قبلی‌ها محو می‌شوند
        for (const t of get().toasts) if (!t.leaving) get().dismiss(t.id)
        set({ toasts: [...get().toasts, { id, message, tone, leaving: false }] })
        setTimeout(() => get().dismiss(id), VISIBLE_MS)
    },
    dismiss: (id) => {
        const toast = get().toasts.find((t) => t.id === id)
        if (!toast || toast.leaving) return
        set({ toasts: get().toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) })
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), LEAVE_MS)
    },
}))

export const toast = (message: string, tone?: ToastTone) => useToastStore.getState().show(message, tone)
