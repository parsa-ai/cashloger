import { create } from "zustand"
import { persist } from "zustand/middleware"

import { DEFAULT_MONEY_UNIT, getMoneyUnit, MoneyUnitId } from "@/lib/money"

// واحد پول انتخابی کاربر (روی همین دستگاه ذخیره می‌شود)
export const useMoneyUnitStore = create<{ unit: MoneyUnitId; setUnit: (unit: MoneyUnitId) => void }>()(
    persist(
        (set) => ({
            unit: DEFAULT_MONEY_UNIT,
            setUnit: (unit) => set({ unit }),
        }),
        // بعد از mount خوانده می‌شود تا با رندر سرور ناهماهنگ نشود
        { name: "cashlog-money-unit", skipHydration: true }
    )
)

export function useMoneyUnit() {
    return getMoneyUnit(useMoneyUnitStore((s) => s.unit))
}
