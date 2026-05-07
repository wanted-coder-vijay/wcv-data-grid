import { useEffect, useRef, useState } from "react"
import type { CellContext } from "@tanstack/react-table"

import { cn } from "./lib/utils"
import { Input } from "./ui/input"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export type EditableCellProps<TData, TValue> = CellContext<TData, TValue> & {
  isEditing: boolean
  /** True only when this cell was directly opened for edit (double-click). Row-edit mode keeps this false to avoid auto-opening every editor at once. */
  autoOpen?: boolean
  onCommit: (value: unknown) => void
  onCancel: () => void
  onStartEdit: () => void
}

export function EditableCell<TData, TValue>({
  getValue,
  column,
  row,
  isEditing,
  autoOpen,
  onCommit,
  onCancel,
  onStartEdit,
}: EditableCellProps<TData, TValue>) {
  const meta = column.columnDef.meta
  const editor = meta?.editor ?? "text"
  const align = meta?.align ?? "left"
  const initial = getValue()
  const [local, setLocal] = useState<unknown>(initial)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocal(initial)
  }, [initial, isEditing])

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus()
  }, [isEditing])

  const isEditable = (() => {
    const flag = meta?.isEditable
    if (flag === undefined) return true
    if (typeof flag === "function") return flag(row.original)
    return flag
  })()

  // Display mode
  if (!isEditing) {
    const display = renderDisplay(initial, editor, meta)
    return (
      <div
        className={cn(
          "flex h-7 items-center gap-1.5 rounded px-1.5 text-sm",
          isEditable &&
            "cursor-text outline-1 outline-transparent transition-colors hover:bg-muted/60 hover:outline-border",
          align === "right" && "justify-end",
          align === "center" && "justify-center"
        )}
        onDoubleClick={() => isEditable && onStartEdit()}
        title={isEditable ? "Double-click to edit" : undefined}
      >
        {display}
      </div>
    )
  }

  const commit = (value: unknown) => onCommit(value)
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit(local)
    else if (e.key === "Escape") onCancel()
  }

  if (editor === "select") {
    const opts = meta?.selectOptions ?? []
    if (!autoOpen) {
      return (
        <select
          value={String(local ?? "")}
          onChange={(e) => {
            setLocal(e.target.value)
            commit(e.target.value)
          }}
          className={cn(
            "h-7 w-full rounded-md border border-input bg-background px-1.5 text-xs outline-none focus-visible:border-ring",
            align === "right" && "text-right",
            align === "center" && "text-center"
          )}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <Select
        defaultOpen={autoOpen}
        value={String(local ?? "")}
        onValueChange={(v) => commit(v)}
      >
        <SelectTrigger size="sm" className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (editor === "checkbox" || editor === "switch") {
    return (
      <div className="flex h-7 items-center justify-center">
        <Checkbox
          checked={!!local}
          onCheckedChange={(c) => commit(!!c)}
          autoFocus
        />
      </div>
    )
  }

  return (
    <Input
      ref={inputRef}
      type={
        editor === "number" || editor === "currency"
          ? "number"
          : editor === "date"
          ? "date"
          : "text"
      }
      value={local == null ? "" : String(local)}
      onChange={(e) => {
        if (editor === "number" || editor === "currency") {
          setLocal(e.target.value === "" ? null : Number(e.target.value))
        } else {
          setLocal(e.target.value)
        }
      }}
      onBlur={() => commit(local)}
      onKeyDown={handleKey}
      className={cn(
        "h-7 px-1.5 text-sm",
        align === "right" && "text-right",
        align === "center" && "text-center"
      )}
    />
  )
}

function renderDisplay(
  value: unknown,
  editor: string,
  meta?: { selectOptions?: { value: string; label: string }[]; badgeMap?: Partial<Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline">> }
) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/60">—</span>
  }

  if (editor === "currency") {
    const n = typeof value === "number" ? value : Number(value)
    return Number.isFinite(n)
      ? new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 2,
        }).format(n)
      : String(value)
  }
  if (editor === "number") {
    const n = typeof value === "number" ? value : Number(value)
    return Number.isFinite(n) ? new Intl.NumberFormat().format(n) : String(value)
  }
  if (editor === "checkbox" || editor === "switch") {
    return (
      <Checkbox checked={!!value} disabled aria-label="value" />
    )
  }
  if (editor === "select") {
    const opt = meta?.selectOptions?.find((o) => o.value === value)
    const label = opt?.label ?? String(value)
    if (meta?.badgeMap) {
      const variant = meta.badgeMap[String(value)] ?? "default"
      return <Badge variant={variant}>{label}</Badge>
    }
    return label
  }
  if (editor === "date") {
    if (value instanceof Date) return value.toLocaleDateString()
    return String(value)
  }
  return String(value)
}
