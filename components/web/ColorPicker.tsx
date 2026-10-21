"use client"

import { Check } from "lucide-react"
import { PALETTE } from "@/lib/palette"
import { cn, haptic } from "@/lib/utils"

// انتخاب رنگ از پالت ۶۴ رنگی (هر تن در دو ردیف ۸تایی)
export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
    return (
        <div role="radiogroup" aria-label="رنگ دسته‌بندی" className="grid grid-cols-8 gap-2" dir="ltr">
            {PALETTE.map((color, i) => {
                const selected = color === value
                return (
                    <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`رنگ ${i + 1}`}
                        onClick={() => {
                            haptic()
                            onChange(color)
                        }}
                        className={cn(
                            "pressable grid aspect-square place-items-center rounded-full ring-offset-2 ring-offset-popover transition-[box-shadow,transform] duration-300",
                            selected && "ring-2 ring-foreground/70"
                        )}
                        style={{ backgroundColor: color }}
                    >
                        {selected && <Check className="size-4 animate-pop text-white drop-shadow" strokeWidth={3} />}
                    </button>
                )
            })}
        </div>
    )
}
