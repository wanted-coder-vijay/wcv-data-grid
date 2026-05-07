import { useEffect, useMemo, useState } from "react"
import type { Column, FilterFn } from "@tanstack/react-table"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "./lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { Separator } from "./ui/separator"

// ---------- types -----------------------------------------------------

export type TextOp =
  | "contains"
  | "notContains"
  | "equals"
  | "notEqual"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank"

export type NumberOp =
  | "equals"
  | "notEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "inRange"
  | "blank"
  | "notBlank"

export type DateOp =
  | "equals"
  | "notEqual"
  | "before"
  | "after"
  | "inRange"
  | "blank"
  | "notBlank"

export type Combine = "AND" | "OR"

export type Condition<Op extends string, V> = {
  op: Op
  v?: V
  v2?: V
}

export type AdvFilter<Op extends string, V> = {
  c1: Condition<Op, V>
  combine?: Combine
  c2?: Condition<Op, V>
}

export type SetFilter = { selected: string[] }

// ---------- operator metadata ----------------------------------------

const TEXT_OPS: { v: TextOp; l: string }[] = [
  { v: "contains", l: "Contains" },
  { v: "notContains", l: "Does not contain" },
  { v: "equals", l: "Equals" },
  { v: "notEqual", l: "Does not equal" },
  { v: "startsWith", l: "Starts with" },
  { v: "endsWith", l: "Ends with" },
  { v: "blank", l: "Blank" },
  { v: "notBlank", l: "Not blank" },
]

const NUMBER_OPS: { v: NumberOp; l: string }[] = [
  { v: "equals", l: "Equals" },
  { v: "notEqual", l: "Does not equal" },
  { v: "lessThan", l: "Less than" },
  { v: "lessThanOrEqual", l: "Less than or equal" },
  { v: "greaterThan", l: "Greater than" },
  { v: "greaterThanOrEqual", l: "Greater than or equal" },
  { v: "inRange", l: "In range" },
  { v: "blank", l: "Blank" },
  { v: "notBlank", l: "Not blank" },
]

const DATE_OPS: { v: DateOp; l: string }[] = [
  { v: "equals", l: "Equals" },
  { v: "notEqual", l: "Does not equal" },
  { v: "before", l: "Before" },
  { v: "after", l: "After" },
  { v: "inRange", l: "In range" },
  { v: "blank", l: "Blank" },
  { v: "notBlank", l: "Not blank" },
]

function isUnary(op: string) {
  return op === "blank" || op === "notBlank"
}
function isRange(op: string) {
  return op === "inRange"
}

// ---------- evaluation helpers ---------------------------------------

function evalText(op: TextOp, cell: unknown, q: string | undefined): boolean {
  const c = (cell ?? "").toString().toLowerCase()
  const v = (q ?? "").toString().toLowerCase()
  switch (op) {
    case "contains":
      return v === "" ? true : c.includes(v)
    case "notContains":
      return v === "" ? true : !c.includes(v)
    case "equals":
      return c === v
    case "notEqual":
      return c !== v
    case "startsWith":
      return c.startsWith(v)
    case "endsWith":
      return c.endsWith(v)
    case "blank":
      return c === ""
    case "notBlank":
      return c !== ""
  }
}

function evalNumber(
  op: NumberOp,
  cell: unknown,
  a: number | undefined,
  b: number | undefined
): boolean {
  const n = cell == null || cell === "" ? null : Number(cell)
  switch (op) {
    case "blank":
      return n === null
    case "notBlank":
      return n !== null
  }
  if (n === null || Number.isNaN(n)) return false
  if (a == null) return true
  switch (op) {
    case "equals":
      return n === a
    case "notEqual":
      return n !== a
    case "lessThan":
      return n < a
    case "lessThanOrEqual":
      return n <= a
    case "greaterThan":
      return n > a
    case "greaterThanOrEqual":
      return n >= a
    case "inRange":
      if (b == null) return n >= a
      return n >= a && n <= b
  }
  return true
}

function evalDate(
  op: DateOp,
  cell: unknown,
  a: string | undefined,
  b: string | undefined
): boolean {
  const c = cell ? String(cell) : ""
  switch (op) {
    case "blank":
      return c === ""
    case "notBlank":
      return c !== ""
  }
  if (!c) return false
  if (!a) return true
  switch (op) {
    case "equals":
      return c === a
    case "notEqual":
      return c !== a
    case "before":
      return c < a
    case "after":
      return c > a
    case "inRange":
      if (!b) return c >= a
      return c >= a && c <= b
  }
  return true
}

function combineResults(a: boolean, b: boolean, mode: Combine | undefined) {
  if (mode === "OR") return a || b
  return a && b
}

function isAdvActive(f: AdvFilter<string, unknown> | undefined) {
  if (!f?.c1) return false
  const c1 = f.c1
  if (isUnary(c1.op)) return true
  if (c1.v == null || c1.v === "") {
    // c1 inactive — check c2
    if (!f.c2) return false
    const c2 = f.c2
    if (isUnary(c2.op)) return true
    return c2.v != null && c2.v !== ""
  }
  return true
}

// ---------- filter fns -------------------------------------------------

export const textFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  const f = value as AdvFilter<TextOp, string> | undefined
  if (!isAdvActive(f as AdvFilter<string, unknown>)) return true
  const cell = row.getValue(columnId)
  const c1 = f!.c1
  const aActive = isUnary(c1.op) || (c1.v != null && c1.v !== "")
  const aRes = aActive ? evalText(c1.op, cell, c1.v) : true
  if (!f!.c2) return aRes
  const c2 = f!.c2
  const bActive = isUnary(c2.op) || (c2.v != null && c2.v !== "")
  if (!bActive) return aRes
  const bRes = evalText(c2.op, cell, c2.v)
  if (!aActive) return bRes
  return combineResults(aRes, bRes, f!.combine)
}

export const numberFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  const f = value as AdvFilter<NumberOp, number> | undefined
  if (!isAdvActive(f as AdvFilter<string, unknown>)) return true
  const cell = row.getValue(columnId)
  const c1 = f!.c1
  const aActive = isUnary(c1.op) || c1.v != null
  const aRes = aActive ? evalNumber(c1.op, cell, c1.v, c1.v2) : true
  if (!f!.c2) return aRes
  const c2 = f!.c2
  const bActive = isUnary(c2.op) || c2.v != null
  if (!bActive) return aRes
  const bRes = evalNumber(c2.op, cell, c2.v, c2.v2)
  if (!aActive) return bRes
  return combineResults(aRes, bRes, f!.combine)
}

export const dateFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  const f = value as AdvFilter<DateOp, string> | undefined
  if (!isAdvActive(f as AdvFilter<string, unknown>)) return true
  const cell = row.getValue(columnId)
  const c1 = f!.c1
  const aActive = isUnary(c1.op) || (c1.v != null && c1.v !== "")
  const aRes = aActive ? evalDate(c1.op, cell, c1.v, c1.v2) : true
  if (!f!.c2) return aRes
  const c2 = f!.c2
  const bActive = isUnary(c2.op) || (c2.v != null && c2.v !== "")
  if (!bActive) return aRes
  const bRes = evalDate(c2.op, cell, c2.v, c2.v2)
  if (!aActive) return bRes
  return combineResults(aRes, bRes, f!.combine)
}

export const setFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  const f = value as SetFilter | undefined
  if (!f || !Array.isArray(f.selected)) return true
  if (f.selected.length === 0) return false
  const cell = row.getValue(columnId)
  if (Array.isArray(cell)) {
    return cell.some((c) => f.selected.includes(String(c)))
  }
  return f.selected.includes(String(cell ?? ""))
}

export const booleanFilterFn: FilterFn<unknown> = (row, columnId, value) => {
  if (value === undefined || value === null || value === "") return true
  const cell = row.getValue(columnId)
  return Boolean(cell) === Boolean(value)
}

export function isFilterActive(filterType: string | undefined, value: unknown) {
  if (value === undefined || value === null || value === "") return false
  if (filterType === "multi-select" || filterType === "select") {
    const f = value as Partial<SetFilter>
    return Array.isArray(f.selected)
  }
  if (filterType === "text" || filterType === "number" || filterType === "date") {
    return isAdvActive(value as AdvFilter<string, unknown>)
  }
  if (filterType === "boolean") return value !== undefined
  return true
}

// ---------- panel components -----------------------------------------

type CommonProps<TData, TValue> = {
  column: Column<TData, TValue>
  onClose: () => void
}

export function ColumnFilterPanel<TData, TValue>(
  props: CommonProps<TData, TValue>
) {
  const filterType = props.column.columnDef.meta?.filterType
  switch (filterType) {
    case "text":
      return <TextFilterPanel {...props} />
    case "number":
      return <NumberFilterPanel {...props} />
    case "date":
      return <DateFilterPanel {...props} />
    case "select":
    case "multi-select":
      return <SetFilterPanel {...props} />
    case "boolean":
      return <BooleanFilterPanel {...props} />
    default:
      return null
  }
}

// shared sub-components ------------------------------------------------

function OpSelect<Op extends string>({
  ops,
  value,
  onChange,
}: {
  ops: { v: Op; l: string }[]
  value: Op
  onChange: (v: Op) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Op)}
      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring"
    >
      {ops.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  )
}

function CombineToggle({
  value,
  onChange,
}: {
  value: Combine
  onChange: (v: Combine) => void
}) {
  return (
    <div className="inline-flex h-7 overflow-hidden rounded-md border bg-muted/30 text-[11px]">
      {(["AND", "OR"] as const).map((m) => (
        <button
          key={m}
          type="button"
          className={cn(
            "px-2 transition-colors hover:bg-muted",
            value === m && "bg-primary/10 text-primary"
          )}
          onClick={() => onChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

function FooterBar({
  onApply,
  onClear,
  onClose,
  applyDisabled,
  clearDisabled,
}: {
  onApply?: () => void
  onClear: () => void
  onClose: () => void
  applyDisabled?: boolean
  clearDisabled?: boolean
}) {
  return (
    <div className="mt-2 flex items-center justify-between gap-1.5">
      <Button
        size="xs"
        variant="ghost"
        onClick={onClear}
        disabled={clearDisabled}
      >
        Clear
      </Button>
      <div className="flex items-center gap-1.5">
        <Button size="xs" variant="ghost" onClick={onClose}>
          Close
        </Button>
        {onApply && (
          <Button size="xs" onClick={onApply} disabled={applyDisabled}>
            Apply
          </Button>
        )}
      </div>
    </div>
  )
}

// ----- text -----------------------------------------------------------

function TextFilterPanel<TData, TValue>({
  column,
  onClose,
}: CommonProps<TData, TValue>) {
  const value = column.getFilterValue() as
    | AdvFilter<TextOp, string>
    | undefined
  const [draft, setDraft] = useState<AdvFilter<TextOp, string>>(
    value ?? { c1: { op: "contains", v: "" } }
  )
  // keep draft synced if external value changes
  useEffect(() => {
    setDraft(value ?? { c1: { op: "contains", v: "" } })
  }, [value])

  const apply = () => {
    column.setFilterValue(
      isAdvActive(draft as AdvFilter<string, unknown>) ? draft : undefined
    )
    onClose()
  }
  const clear = () => {
    column.setFilterValue(undefined)
    setDraft({ c1: { op: "contains", v: "" } })
  }

  return (
    <div className="flex flex-col gap-2">
      <ConditionRow
        ops={TEXT_OPS}
        c={draft.c1}
        onChange={(c1) => setDraft((d) => ({ ...d, c1 }))}
        renderInput={(c, set) => (
          <Input
            autoFocus
            className="h-8 text-sm"
            placeholder="Value"
            value={(c.v as string) ?? ""}
            onChange={(e) => set({ ...c, v: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        )}
      />
      <Separator />
      <SecondCondition
        draft={draft}
        setDraft={setDraft}
        ops={TEXT_OPS}
        renderInput={(c, set) => (
          <Input
            className="h-8 text-sm"
            placeholder="Value"
            value={(c.v as string) ?? ""}
            onChange={(e) => set({ ...c, v: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        )}
      />
      <FooterBar onApply={apply} onClear={clear} onClose={onClose} clearDisabled={!value} />
    </div>
  )
}

// ----- number ---------------------------------------------------------

function NumberFilterPanel<TData, TValue>({
  column,
  onClose,
}: CommonProps<TData, TValue>) {
  const value = column.getFilterValue() as
    | AdvFilter<NumberOp, number>
    | undefined
  const [draft, setDraft] = useState<AdvFilter<NumberOp, number>>(
    value ?? { c1: { op: "equals" } }
  )
  useEffect(() => {
    setDraft(value ?? { c1: { op: "equals" } })
  }, [value])

  const apply = () => {
    column.setFilterValue(
      isAdvActive(draft as AdvFilter<string, unknown>) ? draft : undefined
    )
    onClose()
  }
  const clear = () => {
    column.setFilterValue(undefined)
    setDraft({ c1: { op: "equals" } })
  }

  return (
    <div className="flex flex-col gap-2">
      <ConditionRow
        ops={NUMBER_OPS}
        c={draft.c1}
        onChange={(c1) => setDraft((d) => ({ ...d, c1 }))}
        renderInput={(c, set) =>
          isRange(c.op) ? (
            <div className="flex gap-1.5">
              <Input
                autoFocus
                type="number"
                className="h-8 text-sm"
                placeholder="From"
                value={c.v ?? ""}
                onChange={(e) =>
                  set({
                    ...c,
                    v: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
              <Input
                type="number"
                className="h-8 text-sm"
                placeholder="To"
                value={c.v2 ?? ""}
                onChange={(e) =>
                  set({
                    ...c,
                    v2:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
          ) : (
            <Input
              autoFocus
              type="number"
              className="h-8 text-sm"
              placeholder="Value"
              value={c.v ?? ""}
              onChange={(e) =>
                set({
                  ...c,
                  v: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              onKeyDown={(e) => e.key === "Enter" && apply()}
            />
          )
        }
      />
      <Separator />
      <SecondCondition
        draft={draft}
        setDraft={setDraft}
        ops={NUMBER_OPS}
        renderInput={(c, set) =>
          isRange(c.op) ? (
            <div className="flex gap-1.5">
              <Input
                type="number"
                className="h-8 text-sm"
                placeholder="From"
                value={c.v ?? ""}
                onChange={(e) =>
                  set({
                    ...c,
                    v:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
              <Input
                type="number"
                className="h-8 text-sm"
                placeholder="To"
                value={c.v2 ?? ""}
                onChange={(e) =>
                  set({
                    ...c,
                    v2:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
          ) : (
            <Input
              type="number"
              className="h-8 text-sm"
              placeholder="Value"
              value={c.v ?? ""}
              onChange={(e) =>
                set({
                  ...c,
                  v: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          )
        }
      />
      <FooterBar onApply={apply} onClear={clear} onClose={onClose} clearDisabled={!value} />
    </div>
  )
}

// ----- date -----------------------------------------------------------

function DateFilterPanel<TData, TValue>({
  column,
  onClose,
}: CommonProps<TData, TValue>) {
  const value = column.getFilterValue() as
    | AdvFilter<DateOp, string>
    | undefined
  const [draft, setDraft] = useState<AdvFilter<DateOp, string>>(
    value ?? { c1: { op: "equals" } }
  )
  useEffect(() => {
    setDraft(value ?? { c1: { op: "equals" } })
  }, [value])

  const apply = () => {
    column.setFilterValue(
      isAdvActive(draft as AdvFilter<string, unknown>) ? draft : undefined
    )
    onClose()
  }
  const clear = () => {
    column.setFilterValue(undefined)
    setDraft({ c1: { op: "equals" } })
  }

  const renderInput = (
    c: Condition<DateOp, string>,
    set: (n: Condition<DateOp, string>) => void
  ) =>
    isRange(c.op) ? (
      <div className="flex gap-1.5">
        <Input
          type="date"
          className="h-8 text-sm"
          value={c.v ?? ""}
          onChange={(e) => set({ ...c, v: e.target.value || undefined })}
        />
        <Input
          type="date"
          className="h-8 text-sm"
          value={c.v2 ?? ""}
          onChange={(e) => set({ ...c, v2: e.target.value || undefined })}
        />
      </div>
    ) : (
      <Input
        type="date"
        className="h-8 text-sm"
        value={c.v ?? ""}
        onChange={(e) => set({ ...c, v: e.target.value || undefined })}
      />
    )

  return (
    <div className="flex flex-col gap-2">
      <ConditionRow
        ops={DATE_OPS}
        c={draft.c1}
        onChange={(c1) => setDraft((d) => ({ ...d, c1 }))}
        renderInput={renderInput}
      />
      <Separator />
      <SecondCondition
        draft={draft}
        setDraft={setDraft}
        ops={DATE_OPS}
        renderInput={renderInput}
      />
      <FooterBar onApply={apply} onClear={clear} onClose={onClose} clearDisabled={!value} />
    </div>
  )
}

// ----- set filter -----------------------------------------------------

function SetFilterPanel<TData, TValue>({
  column,
  onClose,
}: CommonProps<TData, TValue>) {
  const value = column.getFilterValue() as SetFilter | undefined
  const meta = column.columnDef.meta
  const declared = meta?.selectOptions ?? []

  // build option list — prefer column-defined options, otherwise derive
  // unique values from the rows we have.
  const options = useMemo(() => {
    if (declared.length) return declared
    const rows = column.getFacetedRowModel?.().rows ?? []
    const seen = new Set<string>()
    const out: { value: string; label: string }[] = []
    for (const r of rows) {
      const v = r.getValue(column.id)
      const arr = Array.isArray(v) ? v : [v]
      for (const item of arr) {
        const k = item == null ? "" : String(item)
        if (!seen.has(k)) {
          seen.add(k)
          out.push({ value: k, label: k === "" ? "(Blank)" : k })
        }
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label))
  }, [declared, column])

  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState<string[]>(() => {
    if (value && Array.isArray(value.selected)) return value.selected
    return options.map((o) => o.value)
  })

  // sync with external changes (filter cleared elsewhere)
  useEffect(() => {
    if (!value) setDraft(options.map((o) => o.value))
    else if (Array.isArray(value.selected)) setDraft(value.selected)
  }, [value, options])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  const visibleAllSelected =
    visible.length > 0 && visible.every((o) => draft.includes(o.value))
  const visibleSomeSelected = visible.some((o) => draft.includes(o.value))

  const toggleAll = (checked: boolean) => {
    const visibleVals = visible.map((o) => o.value)
    if (checked) {
      const set = new Set([...draft, ...visibleVals])
      setDraft(Array.from(set))
    } else {
      setDraft(draft.filter((v) => !visibleVals.includes(v)))
    }
  }

  const toggle = (v: string) => {
    setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]))
  }

  const apply = () => {
    if (draft.length === options.length) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue({ selected: draft })
    }
    onClose()
  }
  const clear = () => {
    column.setFilterValue(undefined)
    setDraft(options.map((o) => o.value))
    setSearch("")
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 opacity-60" />
        <Input
          autoFocus
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-7 pr-7 text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
            aria-label="Clear search"
          >
            <XIcon className="size-3" />
          </button>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent">
        <Checkbox
          checked={
            visibleAllSelected
              ? true
              : visibleSomeSelected
              ? "indeterminate"
              : false
          }
          onCheckedChange={(c) => toggleAll(!!c)}
        />
        <span className="text-xs font-medium">
          Select all {search ? "(filtered)" : ""}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {draft.length}/{options.length}
        </span>
      </label>

      <div className="flex max-h-60 flex-col gap-0.5 overflow-auto pr-0.5">
        {visible.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No matches
          </div>
        ) : (
          visible.map((o) => {
            const checked = draft.includes(o.value)
            return (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggle(o.value)}
                />
                <span className="truncate">{o.label}</span>
              </label>
            )
          })
        )}
      </div>

      <FooterBar
        onApply={apply}
        onClear={clear}
        onClose={onClose}
        clearDisabled={!value}
      />
    </div>
  )
}

// ----- boolean -------------------------------------------------------

function BooleanFilterPanel<TData, TValue>({
  column,
  onClose,
}: CommonProps<TData, TValue>) {
  const value = column.getFilterValue()
  return (
    <div className="flex flex-col gap-1">
      {[
        { v: undefined, l: "All" },
        { v: true, l: "True" },
        { v: false, l: "False" },
      ].map((o) => (
        <button
          key={String(o.l)}
          type="button"
          onClick={() => {
            column.setFilterValue(o.v)
            onClose()
          }}
          className={cn(
            "rounded px-2 py-1 text-left text-sm hover:bg-accent",
            value === o.v && "bg-accent text-accent-foreground"
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

// ----- shared condition row ------------------------------------------

function ConditionRow<Op extends string, V>({
  ops,
  c,
  onChange,
  renderInput,
}: {
  ops: { v: Op; l: string }[]
  c: Condition<Op, V>
  onChange: (c: Condition<Op, V>) => void
  renderInput: (
    c: Condition<Op, V>,
    set: (n: Condition<Op, V>) => void
  ) => React.ReactNode
}) {
  const showInput = !isUnary(c.op)
  return (
    <div className="flex flex-col gap-1.5">
      <OpSelect ops={ops} value={c.op} onChange={(op) => onChange({ ...c, op })} />
      {showInput && renderInput(c, onChange)}
    </div>
  )
}

function SecondCondition<Op extends string, V>({
  draft,
  setDraft,
  ops,
  renderInput,
}: {
  draft: AdvFilter<Op, V>
  setDraft: React.Dispatch<React.SetStateAction<AdvFilter<Op, V>>>
  ops: { v: Op; l: string }[]
  renderInput: (
    c: Condition<Op, V>,
    set: (n: Condition<Op, V>) => void
  ) => React.ReactNode
}) {
  const enabled = !!draft.c2
  const c2 = draft.c2
  const combine = draft.combine ?? "AND"

  if (!enabled) {
    return (
      <button
        type="button"
        onClick={() =>
          setDraft((d) => ({
            ...d,
            combine: d.combine ?? "AND",
            c2: { op: ops[0].v },
          }))
        }
        className="self-start text-[11px] font-medium text-primary hover:underline"
      >
        + Add condition
      </button>
    )
  }

  const setC2 = (n: Condition<Op, V>) => setDraft((d) => ({ ...d, c2: n }))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <CombineToggle
          value={combine}
          onChange={(combine) => setDraft((d) => ({ ...d, combine }))}
        />
        <button
          type="button"
          onClick={() =>
            setDraft((d) => ({ ...d, combine: undefined, c2: undefined }))
          }
          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Remove second condition"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <ConditionRow
        ops={ops}
        c={c2!}
        onChange={setC2}
        renderInput={renderInput}
      />
    </div>
  )
}
