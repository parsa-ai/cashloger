"use client"

import { PALETTE_ROWS } from "@/lib/palette"
import { cn, haptic } from "@/lib/utils"

// انتخاب رنگ از پالت ۶۴ رنگی: هر تن دو ردیف ۸تایی، از روشن به تیره
export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
    return (
        <div role="radiogroup" aria-label="رنگ دسته‌بندی" className="grid grid-cols-8 gap-x-2 gap-y-2.5 p-4" dir="ltr">
            {PALETTE_ROWS.flat().map((color, i) => {
                const selected = color === value
                return (
                    <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={`رنگ ${i + 1}`}
                        onClick={() => {
                            if (!selected) haptic()
                            onChange(color)
                        }}
                        className="press relative grid aspect-square place-items-center rounded-full"
                        style={{ backgroundColor: color }}
                    >
                        {/* حلقهٔ انتخاب: فاصلهٔ هم‌رنگ کارت بین رنگ و حلقه */}
                        <span
                            aria-hidden
                            className={cn(
                                "absolute -inset-[3px] rounded-full border-2 transition-[opacity,transform] duration-200 ease-out",
                                selected ? "scale-100 opacity-100" : "scale-90 opacity-0"
                            )}
                            style={{ borderColor: color }}
                        />
                        <span
                            aria-hidden
                            className={cn(
                                "absolute inset-0 rounded-full border-[2.5px] border-card transition-opacity duration-200",
                                selected ? "opacity-100" : "opacity-0"
                            )}
                        />
                    </button>
                )
            })}
        </div>
    )
}
