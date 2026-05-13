"use client"

import { useMemo, useState } from "react"
import type { Column, Table } from "@tanstack/react-table"
import { LayoutGridIcon, ListIcon, Rows3Icon } from "lucide-react"

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
  emptyValue?: string
  density?: {
    compact?: string
    relaxed?: string
    comfy?: string
  }
}

export type ViewSheetConfig<TData> = {
  /** Side of the screen to slide in from. Defaults to "right". */
  side?: SheetSide
  /** Initial column count. Defaults to "compact" (1 column). */
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
  compact: "grid-cols-1",
  relaxed: "grid-cols-1 sm:grid-cols-2",
  comfy: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}

const DENSITY_ICON: Record<ViewSheetDensity, React.ReactNode> = {
  compact: <ListIcon className="size-3.5" />,
  relaxed: <Rows3Icon className="size-3.5" />,
  comfy: <LayoutGridIcon className="size-3.5" />,
}

export function DataTableViewSheet<TData>({
  table,
  row,
  open,
  onOpenChange,
  config,
}: {
  table: Table<TData>
  row: TData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: ViewSheetConfig<TData>
}) {
  const [density, setDensity] = useState<ViewSheetDensity>(
    config?.defaultDensity ?? "compact"
  )

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
  }, [table, row, config?.fields])

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
      <SheetContent side={config?.side ?? "right"}>
        {config?.renderHeader ? (
          config.renderHeader(row)
        ) : (
          <SheetHeader>
            <SheetTitle>
              {labels?.title ? labels.title(row) : "Details"}
            </SheetTitle>
            {labels?.description && (
              <SheetDescription>{labels.description(row)}</SheetDescription>
            )}
          </SheetHeader>
        )}

        {!config?.hideDensityTabs && (
          <div
            role="tablist"
            aria-label="Layout density"
            className="inline-flex w-fit gap-0.5 rounded-md border bg-muted/40 p-0.5 text-xs"
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

        <div className={cn("grid gap-3 overflow-y-auto", COLS_CLASS[density])}>
          {fields.map((col) => {
            const colId = col.id
            const colDef = col.columnDef
            const headerLabel =
              (colDef.meta as { label?: string } | undefined)?.label ??
              (typeof colDef.header === "string" ? colDef.header : colId)
            // @ts-expect-error - accessor key is column-specific
            const rawValue = (row as any)[colDef.accessorKey ?? colId]
            const rendered = config?.renderField
              ? config.renderField({ column: col, value: rawValue, row })
              : defaultRenderValue(rawValue, emptyValue)
            return (
              <div
                key={colId}
                className="flex flex-col gap-0.5 rounded-md border bg-card p-2.5"
              >
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {headerLabel}
                </span>
                <span className="text-sm text-foreground break-words">
                  {rendered}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
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
