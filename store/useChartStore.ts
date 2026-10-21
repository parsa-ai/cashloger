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
import { Category, LogEntry, LogKind, YearlyLog } from "@/lib/types";
import { getPersianYearMonth } from "@/lib/utils";
import { toast } from "@/store/useToastStore";
import { create } from "zustand";

interface LogStore {
  userId: string | null;
  entries: LogEntry[];
  logs: YearlyLog[];
  categories: Category[];
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

  addLog: (entry: Omit<LogEntry, "id">) => void;
  updateLog: (entry: LogEntry) => void;
  removeLog: (id: string) => void;

  addCategory: (kind: LogKind, label: string, color?: string) => void;
  updateCategory: (id: string, changes: Partial<Pick<Category, "label" | "color">>) => void;
  removeCategory: (id: string) => void;
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
  queue: [],
  isLoading: false,
  isSyncing: false,
  lastSyncedAt: null,
};

export const useLogStore = create<LogStore>()((set, get) => {
  const supabase = createClient();

  const setData = (data: LocalData) =>
    set({ entries: data.entries, categories: data.categories, logs: groupByMonth(data.entries) });

  const persist = () => {
    const { userId, entries, categories, queue, lastSyncedAt } = get();
    if (userId) saveSnapshot(userId, { entries, categories, queue, lastSyncedAt });
  };

  // تغییر محلی + صف برای ارسال به سرور
  const commit = (op: Op) => {
    const { entries, categories, queue } = get();
    setData(applyOp({ entries, categories }, op));
    set({ queue: enqueue(queue, op) });
    persist();
    void get().sync();
  };

  const newOpId = () => crypto.randomUUID();

  return {
    ...emptyState,
    isOnline: typeof navigator === "undefined" ? true : navigator.onLine,

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
      setData(snapshot ?? { entries: [], categories: [] });
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
        const { entries, categories } = get();
        if (!sameData(next, { entries, categories })) setData(next);
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
    },

    updateLog: (entry) => {
      commit({ opId: newOpId(), type: "tx.upsert", row: entryToRow(entry) });
    },

    removeLog: (id) => {
      commit({ opId: newOpId(), type: "tx.delete", id });
    },

    addCategory: (kind, label, color) => {
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
        },
      });
    },

    updateCategory: (id, changes) => {
      const { categories } = get();
      const current = categories.find((c) => c.id === id);
      if (!current) return;

      const label = changes.label?.trim() || current.label;
      assertUniqueLabel(categories, current.kind, label, id);

      commit({ opId: newOpId(), type: "cat.upsert", row: { ...current, ...changes, label } });
    },

    removeCategory: (id) => {
      commit({ opId: newOpId(), type: "cat.delete", id });
    },
  };
});

export const usePendingCount = () => useLogStore((s) => s.queue.length);
