"use client";

import { format } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** "YYYY-MM-DDTHH:mm" in local time, what the server action reads (same as datetime-local). */
const toValue = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm");

/**
 * shadcn date picker with a time field, as a property value. The form still gets the date in a
 * hidden input under `name`; empty means no date.
 */
export function DateTimePicker({ id, name, defaultValue }: { id?: string; name: string; defaultValue?: string }) {
  const [date, setDate] = useState<Date | undefined>(defaultValue ? new Date(defaultValue) : undefined);
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);

  // Tell the form something changed, so it shows "Unsaved".
  const commit = (d: Date | undefined) => {
    setDate(d);
    queueMicrotask(() => hidden.current?.dispatchEvent(new Event("input", { bubbles: true })));
  };

  const time = date ? format(date, "HH:mm") : "09:00";

  return (
    <div ref={anchor} className="adm-date">
      <input ref={hidden} type="hidden" name={name} value={date ? toValue(date) : ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="ghost" className="adm-date-trigger" data-empty={!date || undefined}>
            <CalendarIcon />
            {date ? format(date, "d MMM yyyy, HH:mm") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start" container={anchor.current?.closest<HTMLElement>(".adm")}>
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            captionLayout="dropdown"
            startMonth={new Date(2015, 0)}
            endMonth={new Date(new Date().getFullYear() + 2, 11)}
            onSelect={(d) => {
              if (!d) return;
              const [h, m] = time.split(":").map(Number);
              d.setHours(h, m, 0, 0);
              commit(d);
            }}
          />
          <div className="flex items-center gap-2 border-t border-border p-3">
            <label className="text-sm text-muted-foreground" htmlFor={`${id}-time`}>Time</label>
            <input
              id={`${id}-time`}
              type="time"
              value={time}
              onChange={(e) => {
                const [h, m] = e.target.value.split(":").map(Number);
                if (Number.isNaN(h)) return;
                const d = new Date(date ?? new Date());
                d.setHours(h, m, 0, 0);
                commit(d);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            />
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => commit(new Date())}>
              Now
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {date ? (
        <Button type="button" variant="ghost" size="icon" className="adm-date-clear" aria-label="Clear the date" onClick={() => commit(undefined)}>
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
