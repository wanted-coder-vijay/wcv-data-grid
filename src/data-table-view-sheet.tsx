"use client"

import { useEffect, useMemo, useState } from "react"
import type { Column, Table } from "@tanstack/react-table"
import { LayoutGridIcon, ListIcon, Rows3Icon, PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "./ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  type SheetSide,
} from "./ui/sheet"
import { cn } from "./lib/utils"

export type ViewSheetDensity = "compact" | "relaxed" | "comfy"

export type ViewSheetLabels = {
  title?: (row: any) => React.ReactNode
  description?: (row: any) => React.ReactNode
  edit?: string
  delete?: string
  close?: string
  emptyValue?: string
  density?: {
    compact?: string
    relaxed?: string
    comfy?: string
  }
}

export type ViewSheetConfig<TData> = {
  /** Show actions only when the corresponding table callback is available. */
  actions?: { edit?: boolean; delete?: boolean }
  width?: React.CSSProperties["width"]
  /** Side of the screen to slide in from. Defaults to "right". */
  side?: SheetSide
  /** Initial layout density. Defaults to "compact" (more fields per row). */
  defaultDensity?: ViewSheetDensity
  /** Hide the density tabs entirely if you want a fixed layout. */
  hideDensityTabs?: boolean
  /** Override how a field's value is rendered. */
  renderField?: (args: {
    column: Column<TData, unknown>
    value: unknown
    row: TData
  }) => React.ReactNode
  /** Custom header for the sheet. */
  renderHeader?: (row: TData) => React.ReactNode
  /** Filter / reorder which columns appear. Defaults to all visible columns. */
  fields?: string[]
  /** Override label / placeholder strings. */
  labels?: ViewSheetLabels
}

const COLS_CLASS: Record<ViewSheetDensity, string> = {
  compact: "grid-cols-1 sm:grid-cols-2",
  relaxed: "grid-cols-1 sm:grid-cols-2",
  comfy: "grid-cols-1",
}

const CARD_CLASS: Record<ViewSheetDensity, string> = {
  compact: "gap-0.5 p-2.5",
  relaxed: "gap-1 p-3",
  comfy: "gap-1.5 p-4",
}

const DENSITY_ICON: Record<ViewSheetDensity, React.ReactNode> = {
  compact: <LayoutGridIcon className="size-3.5" />,
  relaxed: <Rows3Icon className="size-3.5" />,
  comfy: <ListIcon className="size-3.5" />,
}

export function DataTableViewSheet<TData>({
  table,
  row,
  open,
  onOpenChange,
  config, onEdit, onDelete,
}: {
  table: Table<TData>
  row: TData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (row: TData) => void
  onDelete?: (row: TData) => void
  config?: ViewSheetConfig<TData>
}) {
  const [density, setDensity] = useState<ViewSheetDensity>(
    config?.defaultDensity ?? "compact"
  )

  useEffect(() => { setDensity(config?.defaultDensity ?? "compact") }, [config?.defaultDensity])

  const fields = useMemo(() => {
    if (!row) return []
    const wanted = config?.fields
    const allCols = table.getAllLeafColumns().filter((c) => {
      // skip internal selection/actions columns
      if (c.id === "__select" || c.id === "__actions" || c.id === "__expand")
        return false
      // when no explicit fields list, only include currently visible cols
      if (wanted) return wanted.includes(c.id)
      return c.getIsVisible()
    })
    if (wanted) {
      // preserve consumer ordering
      return wanted
        .map((id) => allCols.find((c) => c.id === id))
        .filter((c): c is Column<TData, unknown> => Boolean(c))
    }
    return allCols
  }, [table, row, config?.fields, table.getState().columnVisibility, table.getState().columnOrder])

  if (!row) return null

  const labels = config?.labels
  const emptyValue = labels?.emptyValue ?? "—"
  const densityLabels = {
    compact: labels?.density?.compact ?? "Compact",
    relaxed: labels?.density?.relaxed ?? "Relaxed",
    comfy: labels?.density?.comfy ?? "Comfy",
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={config?.side ?? "right"} className="gap-0 p-0" style={{ width: config?.side === "top" || config?.side === "bottom" ? undefined : config?.width ?? "min(36rem, 100vw)" }}>
        <div className="border-b bg-muted/20 px-6 py-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">Record details</p>
        {config?.renderHeader ? (
          <><SheetTitle className="sr-only">{labels?.title ? labels.title(row) : "Record details"}</SheetTitle>{config.renderHeader(row)}</>
        ) : (
          <SheetHeader>
            <SheetTitle>
              {labels?.title ? labels.title(row) : "Details"}
            </SheetTitle>
            <SheetDescription>{labels?.description ? labels.description(row) : "Review this record, then edit its fields or manage it using the actions below."}</SheetDescription>
          </SheetHeader>
        )}

        </div>
        <div data-grid-scrollbar="" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {!config?.hideDensityTabs && (
          <div
            role="tablist"
            aria-label="Layout density"
            className="mb-5 inline-flex w-fit gap-0.5 rounded-md border bg-muted/40 p-0.5 text-xs"
          >
            {(["compact", "relaxed", "comfy"] as const).map((d) => (
              <button
                key={d}
                role="tab"
                aria-selected={density === d}
                onClick={() => setDensity(d)}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-1 transition-colors",
                  density === d
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {DENSITY_ICON[d]}
                {densityLabels[d]}
              </button>
            ))}
          </div>
        )}

        <div className={cn("grid gap-3", COLS_CLASS[density])}>
          {fields.map((col) => {
            const colId = col.id
            const colDef = col.columnDef
            const headerLabel =
              (colDef.meta as { label?: string } | undefined)?.label ??
              (typeof colDef.header === "string" ? colDef.header : colId)
            // @ts-expect-error - accessor key is column-specific
            const rawValue = col.accessorFn ? col.accessorFn(row, 0) : (row as any)[colDef.accessorKey ?? colId]
            const rendered = config?.renderField
              ? config.renderField({ column: col, value: rawValue, row })
              : defaultRenderValue(rawValue, emptyValue)
            return (
              <div
                key={colId}
                className={cn(
                  "flex min-w-0 flex-col rounded-lg border bg-muted/10",
                  CARD_CLASS[density]
                )}
              >
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {headerLabel}
                </span>
                <span className="break-words text-sm font-medium text-foreground">
                  {rendered}
                </span>
              </div>
            )
          })}
        </div>

        </div>
        <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t bg-muted/20 px-6 py-4">
          {onDelete && config?.actions?.delete !== false && <Button variant="destructive" size="sm" onClick={() => onDelete(row)}><Trash2Icon />{labels?.delete ?? "Delete record"}</Button>}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>{labels?.close ?? "Close details"}</Button>
          {onEdit && config?.actions?.edit !== false && <Button size="sm" onClick={() => onEdit(row)}><PencilIcon />{labels?.edit ?? "Edit record"}</Button>}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function defaultRenderValue(value: unknown, empty: string): React.ReactNode {
  if (value == null || value === "") return empty
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}
