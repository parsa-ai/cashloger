import { Goal, LogEntry } from "@/lib/types"

const DAY = 24 * 60 * 60 * 1000

// موعد به شکل YYYY-MM-DD (تاریخ محلی، بدون ساعت) ذخیره می‌شود
export function toDateKey(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDateKey(key: string) {
    const [y, m, d] = key.split("-").map(Number)
    return new Date(y, m - 1, d)
}

export function formatDeadline(key: string) {
    return fromDateKey(key).toLocaleDateString("fa-IR", { day: "numeric", month: "long", year: "numeric" })
}

// خالص پول رفته به پس‌انداز (واریز منهای برداشت) در این تراکنش‌ها
export function netSaved(entries: LogEntry[], goalId?: string) {
    let total = 0
    for (const e of entries) {
        if (!e.goal || (goalId && e.goal !== goalId)) continue
        total += e.mode === "decrease" ? e.visitors : -e.visitors
    }
    return total
}

// موجودی هر هدف: مبلغ اولیه + واریزها − برداشت‌ها
export function goalBalances(goals: Goal[], entries: LogEntry[]) {
    const balances = new Map(goals.map((g) => [g.id, g.saved]))
    for (const e of entries) {
        if (!e.goal || !balances.has(e.goal)) continue
        balances.set(e.goal, balances.get(e.goal)! + (e.mode === "decrease" ? e.visitors : -e.visitors))
    }
    for (const [id, value] of balances) balances.set(id, Math.max(value, 0))
    return balances
}

// چقدر مانده و تا موعد ماهی چقدر باید کنار گذاشت
export function goalProgress(goal: Goal, saved: number) {
    const remaining = Math.max(goal.target - saved, 0)
    const ratio = Math.min(saved / goal.target, 1)
    const done = remaining === 0

    let perMonth: number | null = null
    let overdue = false
    if (goal.deadline && !done) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const days = Math.round((fromDateKey(goal.deadline).getTime() - today.getTime()) / DAY)
        if (days < 0) overdue = true
        else perMonth = remaining / Math.max(1, Math.ceil(days / 30.44))
    }
    return { remaining, ratio, done, perMonth, overdue }
}
