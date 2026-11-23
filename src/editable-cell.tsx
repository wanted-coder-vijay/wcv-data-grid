import { useEffect, useRef, useState } from "react"
import type { CellContext } from "@tanstack/react-table"

import { cn } from "./lib/utils"
import { DateEditor } from "./date-editor"
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
  hasDraft?: boolean
  draftValue?: unknown
  onDraftChange?: (value: unknown) => void
  disabled?: boolean
  errorId?: string
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
  hasDraft,
  draftValue,
  onDraftChange,
  disabled,
  errorId,
  onCancel,
  onStartEdit,
}: EditableCellProps<TData, TValue>) {
  const meta = column.columnDef.meta
  const editor = meta?.editor ?? "text"
  const align = meta?.align ?? "left"
  const initial = hasDraft ? draftValue : getValue()
  const [local, setLocal] = useState<unknown>(initial)
  const skipBlurCommit = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setLocal(initial)
  }, [initial, isEditing])

  useEffect(() => {
    if (isEditing && !disabled && inputRef.current) inputRef.current.focus()
  }, [isEditing, disabled])

  const isEditable = (() => {
    const flag = meta?.isEditable
    if (flag === undefined) return true
    if (typeof flag === "function") return flag(row.original)
    return flag
  })()

  if (!isEditing || !isEditable) return <EditableCellDisplay value={initial} meta={meta} formatted={meta?.formatValue?.(initial, row.original)} editable={isEditable} disabled={disabled} onStartEdit={onStartEdit} />

  const commit = (value: unknown) => {
    if (!disabled && isEditable) { onDraftChange?.(value); onCommit(value) }
  }
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.key === "Enter") {
      skipBlurCommit.current = true
      commit(local)
    } else if (e.key === "Escape") {
      skipBlurCommit.current = true
      onCancel()
    }
  }

  if (meta?.renderEditor) return meta.renderEditor({ value: local, row: row.original, columnId: column.id, disabled, errorId,
    onChange: value => { setLocal(value); onDraftChange?.(value) }, onCommit: commit, onCancel })

  if (editor === "select") {
    const opts = meta?.selectOptions ?? []
    return (
      <Select
        disabled={disabled}
        defaultOpen={autoOpen}
        value={String(local ?? "")}
        onValueChange={(v) => { setLocal(v); commit(v) }}
      >
        <SelectTrigger
          ref={selectRef}
          disabled={disabled}
          aria-invalid={!!errorId}
          aria-describedby={errorId}
          data-cell-editor=""
          size="sm"
          className="h-7 w-full text-xs focus-visible:ring-0"
        >
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent onEscapeKeyDown={() => { if (autoOpen) { selectRef.current?.dispatchEvent(new CustomEvent("dynostack-editor-cancel", { bubbles: true })); onCancel() } }}>
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (editor === "date") return <DateEditor value={local} disabled={disabled} autoOpen={autoOpen} errorId={errorId}
    label={"Date editor: " + String(meta?.label ?? column.id)} onChange={value => { setLocal(value); commit(value) }} onCancel={onCancel} />

  if (editor === "checkbox" || editor === "switch") {
    return (
      <div className="flex h-7 items-center justify-center">
        <Checkbox
          disabled={disabled}
          aria-invalid={!!errorId}
          aria-describedby={errorId}
          data-cell-editor=""
          className="focus-visible:ring-0"
          checked={!!local}
          onCheckedChange={(c) => commit(!!c)}
          autoFocus
        />
      </div>
    )
  }

  return (
    <Input
      disabled={disabled}
      aria-invalid={!!errorId}
      aria-describedby={errorId}
      data-cell-editor=""
      ref={inputRef}
      type={
        editor === "number" || editor === "currency"
          ? "number"
          : "text"
      }
      value={local == null ? "" : String(local)}
      onChange={(e) => {
        if (editor === "number" || editor === "currency") {
          const value = e.target.value === "" ? null : Number(e.target.value)
          setLocal(value)
          onDraftChange?.(value)
        } else {
          setLocal(e.target.value)
          onDraftChange?.(e.target.value)
        }
      }}
      onFocus={() => { skipBlurCommit.current = false }}
      onBlur={() => {
        if (!skipBlurCommit.current) commit(local)
        skipBlurCommit.current = false
      }}
      onKeyDown={handleKey}
      className={cn(
        "h-7 px-1.5 text-sm focus-visible:ring-0",
        align === "right" && "text-right",
        align === "center" && "text-center"
      )}
    />
  )
}

export function EditableCellDisplay({ value, meta, editable, disabled, onStartEdit, formatted }: {
  formatted?: React.ReactNode
  value: unknown; editable: boolean; disabled?: boolean; onStartEdit: () => void
  meta?: { format?: { locale?: string; currency?: string; timeZone?: string }; editor?: string; align?: "left" | "right" | "center"; selectOptions?: { value: string; label: string }[]; badgeMap?: NonNullable<Parameters<typeof renderDisplay>[2]>["badgeMap"] }
}) {
  return <div className={cn("flex min-h-7 w-full min-w-0 items-center gap-1.5 rounded px-1.5 text-sm",
    editable && "cursor-text transition-colors hover:bg-muted/60", meta?.align === "right" && "justify-end", meta?.align === "center" && "justify-center")}
    onDoubleClick={() => !disabled && editable && onStartEdit()} title={editable ? "Double-click to edit" : undefined}>
    {formatted !== undefined ? formatted : renderDisplay(value, meta?.editor ?? "text", meta)}
  </div>
}

const currencyFormatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
const numberFormatter = new Intl.NumberFormat()

function renderDisplay(
  value: unknown,
  editor: string,
  meta?: {
    format?: { locale?: string; currency?: string; timeZone?: string }
    selectOptions?: { value: string; label: string }[]
    badgeMap?: Partial<
      Record<
        string,
        | "default"
        | "secondary"
        | "destructive"
        | "success"
        | "warning"
        | "outline"
      >
    >
  }
) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/60">—</span>
  }

  if (editor === "currency") {
    const n = typeof value === "number" ? value : Number(value)
    return Number.isFinite(n)
      ? (meta?.format ? new Intl.NumberFormat(meta.format.locale, { style: "currency", currency: meta.format.currency ?? "USD", maximumFractionDigits: 2 }) : currencyFormatter).format(n)
      : String(value)
  }
  if (editor === "number") {
    const n = typeof value === "number" ? value : Number(value)
    return Number.isFinite(n)
      ? (meta?.format ? new Intl.NumberFormat(meta.format.locale) : numberFormatter).format(n)
      : String(value)
  }
  if (editor === "checkbox" || editor === "switch") {
    return <Checkbox checked={!!value} disabled aria-label="value" />
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
    const date = value instanceof Date ? value : new Date(String(value))
    if (Number.isFinite(date.getTime())) return date.toLocaleDateString(meta?.format?.locale, { timeZone: meta?.format?.timeZone })
    return String(value)
  }
  return String(value)
}
