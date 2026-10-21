"use client"

import { useState } from "react"
import { CalendarDays, Undo2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn, formatMonthTitle } from "@/lib/utils"
import useDateStore from "@/store/useYearStore"

export function DateC() {
  const [open, setOpen] = useState(false)
  const date = useDateStore((s) => s.date) || new Date()
  const setDate = useDateStore((s) => s.setDate)
  const isToday = date.toDateString() === new Date().toDateString()

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="برو به امروز"
        onClick={() => setDate(new Date())}
        className={cn(
          "rounded-full text-primary transition-all duration-500 ease-ios",
          isToday ? "pointer-events-none scale-50 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Undo2 />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="tinted" size="sm" className="rounded-full px-3 font-semibold">
            <CalendarDays />
            <span key={date.toDateString()} className="animate-item-in">
              {formatMonthTitle(date)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden rounded-3xl p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            captionLayout="dropdown"
            onSelect={(date) => {
              if (date) {
                setDate(date)
                setOpen(false)
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
