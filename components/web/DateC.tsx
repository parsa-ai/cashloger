"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import useDateStore from "@/store/useYearStore"

export function DateC() {
  const [open, setOpen] = useState(false)
  const date = useDateStore((s) => s.date) || new Date()
  const setDate = useDateStore((s) => s.setDate)
  const isToday = date.toDateString() === new Date().toDateString();
  console.log(date.toDateString(), new Date().toDateString());

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={() => setDate(new Date())} hidden={isToday}>
        برو به امروز
      </Button>
      <Field className="w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date"
              className="justify-center font-normal"
            >
              {date ? date.toLocaleDateString("FA-IR") : "انتخاب کن"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="center">
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
      </Field>
    </div>
  )
}