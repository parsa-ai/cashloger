import { create } from "zustand"

export type ToastTone = "default" | "success" | "error"

export interface Toast {
    id: number
    message: string
    tone: ToastTone
}

interface ToastStore {
    toasts: Toast[]
    show: (message: string, tone?: ToastTone) => void
    dismiss: (id: number) => void
}

let nextId = 1

export const useToastStore = create<ToastStore>((set, get) => ({
    toasts: [],
    show: (message, tone = "default") => {
        const id = nextId++
        set({ toasts: [...get().toasts.slice(-2), { id, message, tone }] })
        setTimeout(() => get().dismiss(id), 3200)
    },
    dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export const toast = (message: string, tone?: ToastTone) => useToastStore.getState().show(message, tone)
