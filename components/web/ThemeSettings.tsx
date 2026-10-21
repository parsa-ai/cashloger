"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Check } from "lucide-react"

import { Group } from "@/components/web/Group"
import { SegmentedControl } from "@/components/web/SegmentedControl"
import {
    COLOR_THEME_STORAGE_KEY,
    COLOR_THEMES,
    ColorThemeId,
    DEFAULT_COLOR_THEME,
} from "@/lib/themes"
import { cn, haptic } from "@/lib/utils"

function useColorTheme() {
    const [colorTheme, setState] = useState<ColorThemeId>(DEFAULT_COLOR_THEME)

    useEffect(() => {
        const current = document.documentElement.getAttribute("data-color") as ColorThemeId | null
        // eslint-disable-next-line react-hooks/set-state-in-effect -- مقدار فقط بعد از mount از DOM خوانده می‌شود
        if (current) setState(current)
    }, [])

    const setColorTheme = (id: ColorThemeId) => {
        document.documentElement.setAttribute("data-color", id)
        try {
            localStorage.setItem(COLOR_THEME_STORAGE_KEY, id)
        } catch {
            // ذخیره نشد؛ فقط برای همین بار اعمال می‌شود
        }
        setState(id)
    }

    return { colorTheme, setColorTheme }
}

export function ThemeSettings() {
    const { theme, setTheme } = useTheme()
    const { colorTheme, setColorTheme } = useColorTheme()
    const [mounted, setMounted] = useState(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- تم فقط سمت کاربر معلوم است
    useEffect(() => setMounted(true), [])

    return (
        <Group title="ظاهر">
            <div className="space-y-4 p-4">
                <SegmentedControl
                    value={(mounted ? theme : "system") as "light" | "dark" | "system"}
                    onChange={setTheme}
                    options={[
                        { value: "light", label: "روشن" },
                        { value: "dark", label: "تیره" },
                        { value: "system", label: "خودکار" },
                    ]}
                />
                <div className="grid grid-cols-6 gap-2">
                    {COLOR_THEMES.map((t) => {
                        const selected = t.id === colorTheme
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                    haptic()
                                    setColorTheme(t.id)
                                }}
                                aria-pressed={selected}
                                className="pressable flex flex-col items-center gap-1.5"
                            >
                                <span
                                    className={cn(
                                        "grid size-10 place-items-center rounded-full ring-offset-2 ring-offset-card transition-shadow duration-300",
                                        selected && "ring-2 ring-foreground/60"
                                    )}
                                    style={{ backgroundColor: t.swatch }}
                                >
                                    {selected && <Check className="size-4 animate-pop text-white" strokeWidth={3} />}
                                </span>
                                <span className={cn("text-[11px]", selected ? "font-semibold" : "text-muted-foreground")}>
                                    {t.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </Group>
    )
}
