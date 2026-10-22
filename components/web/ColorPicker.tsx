"use client"

import { Check } from "lucide-react"

import { SWATCHES } from "@/lib/palette"
import { cn, haptic } from "@/lib/utils"

// انتخاب رنگ از ۱۲ رنگ پیشنهادی؛ اگر دسته رنگی خارج از این‌ها دارد، همان رنگ هم اول ردیف می‌ماند
export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
    const colors = SWATCHES.includes(value) ? SWATCHES : [value, ...SWATCHES]

    return (
        <div role="radiogroup" aria-label="رنگ دسته‌بندی" className="grid grid-cols-6 gap-3 p-4">
            {colors.map((color, i) => {
                const selected = color === value
                return (
                    <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`رنگ ${(i + 1).toLocaleString("fa-IR")}`}
                        onClick={() => {
                            if (!selected) haptic()
                            onChange(color)
                        }}
                        className="press grid aspect-square place-items-center rounded-full text-white"
                        style={{ backgroundColor: color }}
                    >
                        <Check
                            aria-hidden
                            strokeWidth={3}
                            className={cn("size-4 transition-[opacity,transform] duration-200", selected ? "scale-100 opacity-100" : "scale-50 opacity-0")}
                        />
                    </button>
                )
            })}
        </div>
    )
}
