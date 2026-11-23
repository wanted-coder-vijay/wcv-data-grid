import { useEffect, useRef, useState } from "react"
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"
import { cn } from "./lib/utils"
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
function parse(value: unknown) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""))
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return iso(date) === value ? date : null
}
export function DateEditor({ value, disabled, autoOpen, errorId, label, onChange, onCancel }: {
  value: unknown; disabled?: boolean; autoOpen?: boolean; errorId?: string; label: string
  onChange: (value: string) => void; onCancel: () => void
}) {
  const selected = parse(value), today = new Date()
  const [open, setOpen] = useState(!!autoOpen)
  const [month, setMonth] = useState(() => selected ?? today)
  const [focused, setFocused] = useState(() => iso(selected ?? today))
  const trigger = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => { if (open) { const date = parse(value) ?? new Date(); setMonth(date); setFocused(iso(date)) } }, [open])
  const year = month.getFullYear(), monthIndex = month.getMonth()
  const start = new Date(year, monthIndex, 1); start.setDate(1 - start.getDay())
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index))
  function choose(date: string) { if (disabled) return; onChange(date); setOpen(false) }
  function move(event: React.KeyboardEvent, date: Date) {
    const target = new Date(date)
    if (event.key === "ArrowRight") target.setDate(target.getDate() + 1)
    else if (event.key === "ArrowLeft") target.setDate(target.getDate() - 1)
    else if (event.key === "ArrowDown") target.setDate(target.getDate() + 7)
    else if (event.key === "ArrowUp") target.setDate(target.getDate() - 7)
    else if (event.key === "Home") target.setDate(target.getDate() - target.getDay())
    else if (event.key === "End") target.setDate(target.getDate() + 6 - target.getDay())
    else if (event.key === "PageUp" || event.key === "PageDown") {
      const day = target.getDate()
      target.setDate(1); target.setMonth(target.getMonth() + (event.key === "PageUp" ? -1 : 1))
      target.setDate(Math.min(day, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()))
    }
    else return
    event.preventDefault(); event.stopPropagation(); setMonth(target); setFocused(iso(target))
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-date="${iso(target)}"]`)?.focus())
  }
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><button ref={trigger} type="button" data-cell-editor="" disabled={disabled} aria-label={label}
      aria-invalid={!!errorId} aria-describedby={errorId} className="flex h-7 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-2 text-xs outline-none disabled:opacity-50">
      <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected ? iso(selected) : "Choose date"}</span><CalendarDaysIcon className="size-3.5 shrink-0 opacity-60" />
    </button></PopoverTrigger>
    <PopoverContent align="start" aria-label="Choose date" onOpenAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus()) }}
      onEscapeKeyDown={() => { if (autoOpen) { trigger.current?.dispatchEvent(new CustomEvent("dynostack-editor-cancel", { bubbles: true })); onCancel() } }}>
      <fieldset disabled={disabled} className="min-w-0 border-0 p-0">
        <div className="mb-3 flex items-center justify-between gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => { const d = new Date(year, monthIndex - 1, 1); setMonth(d); setFocused(iso(d)) }}><ChevronLeftIcon /></Button>
          <Select value={String(monthIndex)} onValueChange={v => { const d = new Date(year, Number(v), 1); setMonth(d); setFocused(iso(d)) }}><SelectTrigger size="sm" aria-label="Month"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, index) => <SelectItem key={index} value={String(index)}>{new Date(2020, index, 1).toLocaleDateString(undefined, { month: "short" })}</SelectItem>)}</SelectContent></Select>
          <Select value={String(year)} onValueChange={v => { const d = new Date(Number(v), monthIndex, 1); setMonth(d); setFocused(iso(d)) }}><SelectTrigger size="sm" aria-label="Year"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 201 }, (_, index) => year - 100 + index).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
          <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => { const d = new Date(year, monthIndex + 1, 1); setMonth(d); setFocused(iso(d)) }}><ChevronRightIcon /></Button>
        </div>
        <div ref={root} role="grid" aria-label={month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}>
          <div role="row" className="grid grid-cols-7">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => <span role="columnheader" key={day} className="py-1 text-center text-xs text-muted-foreground">{day}</span>)}</div>
          {Array.from({ length: 6 }, (_, week) => <div role="row" key={week} className="grid grid-cols-7">{days.slice(week * 7, week * 7 + 7).map(date => {
            const key = iso(date), chosen = selected && iso(selected) === key
            return <button type="button" role="gridcell" key={key} data-date={key} aria-label={key} aria-selected={!!chosen} aria-current={iso(today) === key ? "date" : undefined}
              tabIndex={focused === key ? 0 : -1} onFocus={() => setFocused(key)} onKeyDown={event => move(event, date)} onClick={() => choose(key)}
              className={cn("h-8 rounded-md text-xs outline-none hover:bg-accent focus-visible:bg-accent", date.getMonth() !== monthIndex && "text-muted-foreground/50", iso(today) === key && "font-semibold underline", chosen && "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:bg-primary focus-visible:text-primary-foreground")}>{date.getDate()}</button>
          })}</div>)}
        </div>
        <div className="mt-3 flex justify-between border-t pt-2"><Button size="sm" variant="ghost" onClick={() => choose(iso(today))}>Today</Button><Button size="sm" variant="ghost" onClick={() => choose("")}>Clear date</Button></div>
      </fieldset>
    </PopoverContent>
  </Popover>
}
