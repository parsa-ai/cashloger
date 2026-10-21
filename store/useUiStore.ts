import { create } from "zustand"
import { LogEntry, LogKind } from "@/lib/types"

// وضعیت شیت ثبت/ویرایش تراکنش که از چند صفحه باز می‌شود
interface UiStore {
    sheetOpen: boolean
    // نوع پیش‌فرض تراکنش جدید (همان تبی که کاربر الان نگاه می‌کند)
    addKind: LogKind
    editing: LogEntry | null
    // با هر بار باز شدن عوض می‌شود تا فرم از نو ساخته شود
    sheetKey: number

    setAddKind: (kind: LogKind) => void
    // نوع داده‌شده، نوع پیش‌فرض بعدی هم می‌شود
    openAdd: (kind?: LogKind) => void
    openEdit: (entry: LogEntry) => void
    setSheetOpen: (open: boolean) => void
}

export const useUiStore = create<UiStore>((set, get) => ({
    sheetOpen: false,
    addKind: "cost",
    editing: null,
    sheetKey: 0,

    setAddKind: (addKind) => set({ addKind }),
    openAdd: (kind) =>
        set({ sheetOpen: true, editing: null, sheetKey: get().sheetKey + 1, addKind: kind ?? get().addKind }),
    openEdit: (entry) => set({ sheetOpen: true, editing: entry, sheetKey: get().sheetKey + 1 }),
    // موقع بستن، editing می‌ماند تا محتوای شیت تا آخر انیمیشن خروج عوض نشود
    setSheetOpen: (sheetOpen) => set({ sheetOpen }),
}))
