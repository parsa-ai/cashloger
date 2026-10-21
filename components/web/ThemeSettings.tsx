"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

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
                <div className="grid grid-cols-6">
                    {COLOR_THEMES.map((t) => {
                        const selected = t.id === colorTheme
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                    if (!selected) haptic()
                                    setColorTheme(t.id)
                                }}
                                aria-pressed={selected}
                                className="press flex flex-col items-center gap-1.5"
                            >
                                <span className="relative grid size-9 place-items-center rounded-full" style={{ backgroundColor: t.swatch }}>
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "absolute -inset-[3px] rounded-full border-2 transition-[opacity,transform] duration-200 ease-out",
                                            selected ? "scale-100 opacity-100" : "scale-90 opacity-0"
                                        )}
                                        style={{ borderColor: t.swatch }}
                                    />
                                    <span
                                        aria-hidden
                                        className={cn(
                                            "absolute inset-0 rounded-full border-[2.5px] border-card transition-opacity duration-200",
                                            selected ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </span>
                                <span className={cn("text-[11px] transition-colors", selected ? "font-semibold text-foreground" : "text-muted-foreground")}>
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
