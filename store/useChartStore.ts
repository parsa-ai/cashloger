import { createClient } from "@/lib/supabase/client";
import { suggestColor } from "@/lib/palette";
import {
  applyOp,
  clearSnapshot,
  enqueue,
  entryToRow,
  fetchRemote,
  loadSnapshot,
  LocalData,
  Op,
  runOp,
  sameData,
  saveSnapshot,
} from "@/lib/sync";
import { Category, Goal, LogEntry, LogKind, YearlyLog } from "@/lib/types";
import { getPersianYearMonth } from "@/lib/utils";
import { toast } from "@/store/useToastStore";
import { create } from "zustand";

interface LogStore {
  userId: string | null;
  entries: LogEntry[];
  logs: YearlyLog[];
  categories: Category[];
  goals: Goal[];
  queue: Op[];

  isLoading: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;

  init: (userId: string) => void;
  sync: () => Promise<void>;
  setOnline: (online: boolean) => void;
  // signOut: داده‌های محلی این کاربر هم پاک شود
  reset: (clearLocal?: boolean) => void;

  // شناسهٔ تراکنش جدید را برمی‌گرداند (برای «برگرداندن»)
  addLog: (entry: Omit<LogEntry, "id">) => string;
  updateLog: (entry: LogEntry) => void;
  removeLog: (id: string) => void;

  addCategory: (kind: LogKind, label: string, color?: string, budget?: number | null) => void;
  updateCategory: (id: string, changes: Partial<Pick<Category, "label" | "color" | "budget">>) => void;
  removeCategory: (id: string) => void;

  addGoal: (goal: Omit<Goal, "id" | "color"> & { color?: string }) => void;
  updateGoal: (id: string, changes: Partial<Omit<Goal, "id">>) => void;
  removeGoal: (id: string) => void;
}

// گروه‌بندی تراکنش‌ها بر اساس سال و ماه شمسی
function groupByMonth(entries: LogEntry[]): YearlyLog[] {
  const logs: YearlyLog[] = [];
  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const entry of sorted) {
    const { year, month } = getPersianYearMonth(entry.date);
    let yearData = logs.find((y) => y.year === year);
    if (!yearData) {
      yearData = { year, months: [] };
      logs.push(yearData);
    }
    let monthData = yearData.months.find((m) => m.month === month);
    if (!monthData) {
      monthData = { month, entries: [] };
      yearData.months.push(monthData);
    }
    monthData.entries.push(entry);
  }
  return logs;
}

function assertUniqueLabel(categories: Category[], kind: LogKind, label: string, exceptId?: string) {
  if (categories.some((c) => c.kind === kind && c.label === label && c.id !== exceptId)) {
    throw new Error("این دسته‌بندی از قبل وجود دارد");
  }
}

const emptyState = {
  userId: null,
  entries: [],
  logs: [],
  categories: [],
  goals: [],
  queue: [],
  isLoading: false,
  isSyncing: false,
  lastSyncedAt: null,
};

export const useLogStore = create<LogStore>()((set, get) => {
  const supabase = createClient();

  const setData = (data: LocalData) =>
    set({ entries: data.entries, categories: data.categories, goals: data.goals, logs: groupByMonth(data.entries) });

  const persist = () => {
    const { userId, entries, categories, goals, queue, lastSyncedAt } = get();
    if (userId) saveSnapshot(userId, { entries, categories, goals, queue, lastSyncedAt });
  };

  // تغییر محلی + صف برای ارسال به سرور
  const commit = (op: Op) => {
    const { entries, categories, goals, queue } = get();
    setData(applyOp({ entries, categories, goals }, op));
    set({ queue: enqueue(queue, op) });
    persist();
    void get().sync();
  };

  const newOpId = () => crypto.randomUUID();

  return {
    ...emptyState,
    // سرور همیشه «آنلاین» رندر می‌کند؛ وضعیت واقعی بعد از mount در DataLoader خوانده می‌شود تا hydration یکی باشد
    isOnline: true,

    init: (userId) => {
      if (get().userId === userId) {
        void get().sync();
        return;
      }

      const snapshot = loadSnapshot(userId);
      set({
        ...emptyState,
        userId,
        queue: snapshot?.queue ?? [],
        lastSyncedAt: snapshot?.lastSyncedAt ?? null,
        isLoading: !snapshot,
      });
      setData(snapshot ?? { entries: [], categories: [], goals: [] });
      void get().sync();
    },

    sync: async () => {
      const userId = get().userId;
      if (!userId || get().isSyncing) return;
      set({ isSyncing: true });

      try {
        // ۱) ارسال صف به ترتیب
        while (get().queue.length > 0) {
          const op = get().queue[0];
          const result = await runOp(supabase, op);
          if (get().userId !== userId) return;

          if (!result.ok && result.network) {
            set({ isOnline: false });
            return;
          }
          if (!result.ok) {
            toast(result.message, "error");
          }
          set({ queue: get().queue.filter((o) => o.opId !== op.opId) });
          persist();
        }

        // ۲) دریافت آخرین نسخه از سرور و بازپخش تغییراتی که در این فاصله در صف آمده‌اند
        const remote = await fetchRemote(supabase);
        if (get().userId !== userId) return;

        if (!remote.ok) {
          if (remote.network) set({ isOnline: false });
          else toast(remote.message, "error");
          return;
        }

        const next = get().queue.reduce(applyOp, remote.data);
        const { entries, categories, goals } = get();
        if (!sameData(next, { entries, categories, goals })) setData(next);
        set({ isOnline: true, lastSyncedAt: Date.now() });
        persist();
      } finally {
        if (get().userId === userId) set({ isSyncing: false, isLoading: false });
      }

      // اگر حین ارسال، تغییر جدیدی در صف آمد دوباره بفرست
      if (get().queue.length > 0 && get().isOnline) void get().sync();
    },

    setOnline: (online) => {
      set({ isOnline: online });
      if (online) void get().sync();
    },

    reset: (clearLocal = false) => {
      const userId = get().userId;
      if (clearLocal && userId) clearSnapshot(userId);
      set({ ...emptyState });
    },

    addLog: (entry) => {
      const id = crypto.randomUUID();
      commit({ opId: newOpId(), type: "tx.upsert", row: entryToRow({ ...entry, id }) });
      return id;
    },

    updateLog: (entry) => {
      commit({ opId: newOpId(), type: "tx.upsert", row: entryToRow(entry) });
    },

    removeLog: (id) => {
      commit({ opId: newOpId(), type: "tx.delete", id });
    },

    addCategory: (kind, label, color, budget) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const { categories } = get();
      assertUniqueLabel(categories, kind, trimmed);

      commit({
        opId: newOpId(),
        type: "cat.upsert",
        row: {
          id: crypto.randomUUID(),
          kind,
          label: trimmed,
          color: color ?? suggestColor(categories.filter((c) => c.kind === kind).map((c) => c.color)),
          budget: kind === "cost" ? budget || null : null,
        },
      });
    },

    updateCategory: (id, changes) => {
      const { categories } = get();
      const current = categories.find((c) => c.id === id);
      if (!current) return;

      const label = changes.label?.trim() || current.label;
      assertUniqueLabel(categories, current.kind, label, id);

      const budget = current.kind === "cost" ? (changes.budget !== undefined ? changes.budget : current.budget) || null : null;
      commit({ opId: newOpId(), type: "cat.upsert", row: { ...current, ...changes, label, budget } });
    },

    removeCategory: (id) => {
      commit({ opId: newOpId(), type: "cat.delete", id });
    },

    addGoal: ({ color, ...goal }) => {
      const label = goal.label.trim();
      if (!label) return;
      commit({
        opId: newOpId(),
        type: "goal.upsert",
        row: {
          ...goal,
          id: crypto.randomUUID(),
          label,
          saved: Math.max(0, goal.saved),
          color: color ?? suggestColor(get().goals.map((g) => g.color)),
        },
      });
    },

    updateGoal: (id, changes) => {
      const current = get().goals.find((g) => g.id === id);
      if (!current) return;
      const label = changes.label?.trim() || current.label;
      const saved = Math.max(0, changes.saved ?? current.saved);
      commit({ opId: newOpId(), type: "goal.upsert", row: { ...current, ...changes, label, saved } });
    },

    removeGoal: (id) => {
      commit({ opId: newOpId(), type: "goal.delete", id });
    },
  };
});

export const usePendingCount = () => useLogStore((s) => s.queue.length);
