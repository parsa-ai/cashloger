// موتور همگام‌سازی آفلاین: هر تغییر اول روی دستگاه اعمال و در صف ذخیره می‌شود،
// بعد هر وقت اینترنت بود به ترتیب به دیتابیس فرستاده می‌شود.

import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeColor } from "@/lib/palette"
import { Category, Goal, LogEntry, LogKind } from "@/lib/types"

export interface TransactionRow {
    id: string
    category_id: string | null
    goal_id: string | null
    kind: LogKind
    amount: number
    description: string | null
    occurred_at: string
}

export type CategoryRow = Category

export type Op = { opId: string } & (
    | { type: "tx.upsert"; row: TransactionRow }
    | { type: "tx.delete"; id: string }
    | { type: "cat.upsert"; row: CategoryRow }
    | { type: "cat.delete"; id: string }
    | { type: "goal.upsert"; row: Goal }
    | { type: "goal.delete"; id: string }
)

export interface LocalData {
    entries: LogEntry[]
    categories: Category[]
    goals: Goal[]
}

export const TRANSACTION_COLUMNS = "id, category_id, goal_id, kind, amount, description, occurred_at"
export const CATEGORY_COLUMNS = "id, kind, label, color, budget"
export const GOAL_COLUMNS = "id, label, target, saved, color, deadline"

export function rowToEntry(row: TransactionRow): LogEntry {
    return {
        id: row.id,
        key: row.category_id,
        goal: row.goal_id ?? null,
        date: new Date(row.occurred_at),
        visitors: Number(row.amount),
        description: row.description || undefined,
        mode: row.kind === "income" ? "increase" : "decrease",
    }
}

export function entryToRow(entry: LogEntry): TransactionRow {
    return {
        id: entry.id,
        category_id: entry.goal ? null : entry.key,
        goal_id: entry.goal ?? null,
        kind: entry.mode === "increase" ? "income" : "cost",
        amount: entry.visitors,
        description: entry.description || null,
        occurred_at: entry.date.toISOString(),
    }
}

function opTarget(op: Op) {
    const table = op.type.split(".")[0]
    const id = "row" in op ? op.row.id : op.id
    return `${table}:${id}`
}

// عملیات جدید جای upsert قبلیِ ارسال‌نشده روی همان ردیف را می‌گیرد.
// جایگزینی در همان جای صف انجام می‌شود تا ترتیب حفظ شود (مثلاً دسته‌بندی قبل از تراکنشی که از آن استفاده می‌کند ساخته شود).
// اولین عضو صف ممکن است همین الان در حال ارسال باشد، پس به آن دست نمی‌زنیم.
export function enqueue(queue: Op[], op: Op): Op[] {
    const target = opTarget(op)
    const index = queue.findIndex((o, i) => i > 0 && opTarget(o) === target && o.type.endsWith(".upsert"))
    if (index === -1) return [...queue, op]
    if (op.type.endsWith(".upsert")) return queue.map((o, i) => (i === index ? op : o))
    return [...queue.filter((o, i) => i === 0 || opTarget(o) !== target || !o.type.endsWith(".upsert")), op]
}

// برای جلوگیری از رندر و انیمیشن دوباره وقتی داده‌های سرور با داده‌های فعلی فرقی ندارد
export function sameData(a: LocalData, b: LocalData) {
    if (
        a.entries.length !== b.entries.length ||
        a.categories.length !== b.categories.length ||
        a.goals.length !== b.goals.length
    )
        return false
    const entryKey = (e: LogEntry) =>
        `${e.id}|${e.key}|${e.goal ?? ""}|${e.date.getTime()}|${e.visitors}|${e.description ?? ""}|${e.mode}`
    const categoryKey = (c: Category) => `${c.id}|${c.kind}|${c.label}|${c.color}|${c.budget ?? ""}`
    const goalKey = (g: Goal) => `${g.id}|${g.label}|${g.target}|${g.saved}|${g.color}|${g.deadline ?? ""}`
    return (
        a.entries.every((e, i) => entryKey(e) === entryKey(b.entries[i])) &&
        a.categories.every((c, i) => categoryKey(c) === categoryKey(b.categories[i])) &&
        a.goals.every((g, i) => goalKey(g) === goalKey(b.goals[i]))
    )
}

// اعمال یک عملیات روی داده‌های محلی (برای تغییر خوش‌بینانه و بازپخش صف بعد از دریافت از سرور)
export function applyOp(data: LocalData, op: Op): LocalData {
    switch (op.type) {
        case "tx.upsert": {
            const entry = rowToEntry(op.row)
            const exists = data.entries.some((e) => e.id === entry.id)
            return {
                ...data,
                entries: exists
                    ? data.entries.map((e) => (e.id === entry.id ? entry : e))
                    : [...data.entries, entry],
            }
        }
        case "tx.delete":
            return { ...data, entries: data.entries.filter((e) => e.id !== op.id) }
        case "cat.upsert": {
            const exists = data.categories.some((c) => c.id === op.row.id)
            return {
                ...data,
                categories: exists
                    ? data.categories.map((c) => (c.id === op.row.id ? op.row : c))
                    : [...data.categories, op.row],
            }
        }
        case "cat.delete":
            return {
                ...data,
                categories: data.categories.filter((c) => c.id !== op.id),
                entries: data.entries.map((e) => (e.key === op.id ? { ...e, key: null } : e)),
            }
        case "goal.upsert": {
            const exists = data.goals.some((g) => g.id === op.row.id)
            return {
                ...data,
                goals: exists ? data.goals.map((g) => (g.id === op.row.id ? op.row : g)) : [...data.goals, op.row],
            }
        }
        // تراکنش‌های هدف هم با آن حذف می‌شوند و پولش به موجودی برمی‌گردد
        case "goal.delete":
            return {
                ...data,
                goals: data.goals.filter((g) => g.id !== op.id),
                entries: data.entries.filter((e) => e.goal !== op.id),
            }
    }
}

interface RemoteError {
    message: string
    code?: string
}

export function isNetworkError(error: RemoteError | null, status?: number) {
    if (!error) return false
    if (typeof navigator !== "undefined" && !navigator.onLine) return true
    if (status === 0) return true
    return /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(error.message)
}

export type OpResult = { ok: true } | { ok: false; network: true } | { ok: false; network: false; message: string }

function toResult(error: RemoteError | null, status: number): OpResult {
    if (!error) return { ok: true }
    if (isNetworkError(error, status)) return { ok: false, network: true }
    return { ok: false, network: false, message: error.message }
}

export async function runOp(supabase: SupabaseClient, op: Op): Promise<OpResult> {
    try {
        switch (op.type) {
            case "tx.upsert": {
                const { error, status } = await supabase.from("transactions").upsert(op.row, { onConflict: "id" })
                // اگر دسته‌اش در این فاصله (مثلاً از دستگاه دیگر) حذف شده بود، بدون دسته ذخیره کن
                if (error && op.row.category_id && (error.code === "42501" || error.code === "23503")) {
                    const retry = await supabase
                        .from("transactions")
                        .upsert({ ...op.row, category_id: null }, { onConflict: "id" })
                    return toResult(retry.error, retry.status)
                }
                return toResult(error, status)
            }
            case "tx.delete": {
                const { error, status } = await supabase.from("transactions").delete().eq("id", op.id)
                return toResult(error, status)
            }
            case "cat.upsert": {
                const { error, status } = await supabase.from("categories").upsert(op.row, { onConflict: "id" })
                if (error?.code === "23505") {
                    return { ok: false, network: false, message: `دسته‌بندی «${op.row.label}» از قبل وجود دارد` }
                }
                return toResult(error, status)
            }
            case "cat.delete": {
                const { error, status } = await supabase.from("categories").delete().eq("id", op.id)
                return toResult(error, status)
            }
            case "goal.upsert": {
                const { error, status } = await supabase.from("goals").upsert(op.row, { onConflict: "id" })
                return toResult(error, status)
            }
            case "goal.delete": {
                const { error, status } = await supabase.from("goals").delete().eq("id", op.id)
                return toResult(error, status)
            }
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return toResult({ message }, 0)
    }
}

export async function fetchRemote(
    supabase: SupabaseClient
): Promise<{ ok: true; data: LocalData } | { ok: false; network: boolean; message: string }> {
    try {
        const [categoriesRes, transactionsRes, goalsRes] = await Promise.all([
            supabase.from("categories").select(CATEGORY_COLUMNS).order("created_at"),
            supabase.from("transactions").select(TRANSACTION_COLUMNS).order("occurred_at"),
            supabase.from("goals").select(GOAL_COLUMNS).order("created_at"),
        ])
        const failed = [categoriesRes, transactionsRes, goalsRes].find((r) => r.error)
        if (failed?.error) {
            return { ok: false, network: isNetworkError(failed.error, failed.status), message: failed.error.message }
        }
        return {
            ok: true,
            data: {
                categories: (categoriesRes.data as Category[]).map((c) => ({
                    ...c,
                    color: normalizeColor(c.color),
                    budget: c.budget == null ? null : Number(c.budget),
                })),
                entries: (transactionsRes.data as TransactionRow[]).map(rowToEntry),
                goals: (goalsRes.data as Goal[]).map((g) => ({
                    ...g,
                    target: Number(g.target),
                    saved: Number(g.saved),
                    color: normalizeColor(g.color),
                })),
            },
        }
    } catch (err) {
        return { ok: false, network: true, message: err instanceof Error ? err.message : String(err) }
    }
}

// ذخیرهٔ محلی برای هر کاربر جداگانه
const storageKey = (userId: string) => `cashlog:v1:${userId}`

interface Snapshot {
    entries: (Omit<LogEntry, "date"> & { date: string })[]
    categories: Category[]
    // ذخیره‌های قدیمی هدف نداشتند
    goals?: Goal[]
    queue: Op[]
    lastSyncedAt: number | null
}

export function loadSnapshot(userId: string) {
    try {
        const raw = localStorage.getItem(storageKey(userId))
        if (!raw) return null
        const snapshot = JSON.parse(raw) as Snapshot
        return {
            entries: snapshot.entries.map((e) => ({ ...e, goal: e.goal ?? null, date: new Date(e.date) })),
            categories: snapshot.categories,
            goals: snapshot.goals ?? [],
            queue: snapshot.queue,
            lastSyncedAt: snapshot.lastSyncedAt,
        }
    } catch {
        return null
    }
}

export function saveSnapshot(
    userId: string,
    data: { entries: LogEntry[]; categories: Category[]; goals: Goal[]; queue: Op[]; lastSyncedAt: number | null }
) {
    try {
        const snapshot: Snapshot = {
            entries: data.entries.map((e) => ({ ...e, date: e.date.toISOString() })),
            categories: data.categories,
            goals: data.goals,
            queue: data.queue,
            lastSyncedAt: data.lastSyncedAt,
        }
        localStorage.setItem(storageKey(userId), JSON.stringify(snapshot))
    } catch {
        // فضای ذخیره‌سازی در دسترس نیست؛ داده‌ها فقط در حافظه می‌مانند
    }
}

export function clearSnapshot(userId: string) {
    try {
        localStorage.removeItem(storageKey(userId))
    } catch {
        // نادیده بگیر
    }
}
