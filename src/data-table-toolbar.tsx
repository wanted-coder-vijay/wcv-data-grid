import type { Table } from "@tanstack/react-table"
import { useEffect, useRef, useState } from "react"
import {
  ColumnsIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { Separator } from "./ui/separator"
import { cn } from "./lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"

import { exportToCsv, exportToExcel } from "./export"

type ToolbarFeatureFlags = {
  search?: boolean
  refresh?: boolean
  columnVisibility?: boolean
  export?: boolean
  addRow?: boolean
}

type ToolbarLabels = {
  search?: string
  addRow?: string
  delete?: string
  clear?: string
  selected?: string
  refresh?: string
  columns?: string
  export?: string
  csv?: string
  excel?: string
  total?: string
}

type Props<TData> = {
  table: Table<TData>
  totalRecords: number
  isFetching?: boolean
  onRefresh?: () => void
  onAddRow?: () => void
  onBulkDelete?: (rows: TData[]) => void
  exportFileName?: string
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  toolbarSlot?: React.ReactNode
  features?: ToolbarFeatureFlags
  labels?: ToolbarLabels
}

const TOOLBAR_DEFAULT_LABELS: Required<ToolbarLabels> = {
  search: "Search...",
  addRow: "Add row",
  delete: "Delete",
  clear: "Clear",
  selected: "selected",
  refresh: "Refresh",
  columns: "Columns",
  export: "Export",
  csv: "CSV",
  excel: "Excel",
  total: "Total",
}

export function DataTableToolbar<TData>({
  table,
  totalRecords,
  isFetching,
  onRefresh,
  onAddRow,
  onBulkDelete,
  exportFileName = "export",
  globalFilter,
  onGlobalFilterChange,
  toolbarSlot,
  features,
  labels: labelsProp,
}: Props<TData>) {
  const labels: Required<ToolbarLabels> = {
    ...TOOLBAR_DEFAULT_LABELS,
    ...labelsProp,
  }
  const showSearch = features?.search ?? true
  const showColumnVisibility = features?.columnVisibility ?? true
  const showExport = features?.export ?? true
  const [searchOpen, setSearchOpen] = useState(Boolean(globalFilter))
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedRows = table.getSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const hideableColumns = table.getAllLeafColumns().filter((c) => c.getCanHide())
  const visibleCount = hideableColumns.filter((c) => c.getIsVisible()).length

  useEffect(() => {
    if (globalFilter) setSearchOpen(true)
  }, [globalFilter])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  return (
    <div className="flex flex-wrap items-center gap-2 border-b p-2">
      {toolbarSlot}

      {selectedCount > 0 && (
        <>
          <Badge
            variant="secondary"
            className="flex h-8 items-center gap-1 rounded-md px-2 text-xs"
          >
            {selectedCount} {labels.selected}
          </Badge>
          {onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={() => onBulkDelete(selectedRows.map((r) => r.original))}
            >
              <Trash2Icon /> {labels.delete}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => table.resetRowSelection()}
          >
            <XIcon /> {labels.clear}
          </Button>
          <Separator orientation="vertical" className="mx-2 !h-6 !self-center" />
        </>
      )}

      <div className="ml-auto flex h-8 items-center gap-1">
        {showSearch && (
          <div
            className={cn(
              "relative h-8 overflow-hidden transition-[width] duration-200 ease-out",
              searchOpen ? "w-56" : "w-8"
            )}
          >
            {searchOpen ? (
              <>
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 opacity-60" />
                <Input
                  ref={searchInputRef}
                  placeholder={labels.search}
                  value={globalFilter}
                  onChange={(e) => onGlobalFilterChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" && !globalFilter) setSearchOpen(false)
                  }}
                  onBlur={() => {
                    if (!globalFilter) setSearchOpen(false)
                  }}
                  className="h-8 w-56 border-input bg-transparent pl-7 pr-7 shadow-none focus-visible:bg-transparent focus-visible:ring-0"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (globalFilter) {
                      onGlobalFilterChange("")
                      searchInputRef.current?.focus()
                      return
                    }
                    setSearchOpen(false)
                  }}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5 hover:bg-muted"
                  aria-label={globalFilter ? "Clear search" : "Close search"}
                >
                  <XIcon className="size-3" />
                </button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <SearchIcon />
              </Button>
            )}
          </div>
        )}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label={labels.refresh}
          >
            <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
          </Button>
        )}

        {showColumnVisibility && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <ColumnsIcon /> {labels.columns}
                <Badge variant="secondary" className="ml-1">
                  {visibleCount}/{hideableColumns.length}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Toggle columns</span>
                <button
                  className="hover:text-foreground"
                  onClick={() => table.resetColumnVisibility()}
                >
                  Reset
                </button>
              </div>
              <div className="flex max-h-72 flex-col gap-0.5 overflow-auto">
                {hideableColumns.map((col) => (
                  <label
                    key={col.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={col.getIsVisible()}
                      onCheckedChange={(c) => col.toggleVisibility(!!c)}
                    />
                    <span className="capitalize">
                      {col.columnDef.meta?.label ??
                        (typeof col.columnDef.header === "string"
                          ? col.columnDef.header
                          : col.id)}
                    </span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadIcon /> {labels.export}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>
                {selectedCount > 0
                  ? `${labels.export} ${selectedCount} ${labels.selected}`
                  : `${labels.export} all rows`}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => exportToCsv(table, exportFileName)}
              >
                <FileTextIcon /> {labels.csv}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => exportToExcel(table, exportFileName)}
              >
                <FileSpreadsheetIcon /> {labels.excel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onAddRow && (
          <Button size="sm" onClick={onAddRow}>
            <PlusIcon /> {labels.addRow}
          </Button>
        )}

        <Separator orientation="vertical" className="mx-2 !h-6 !self-center" />
        <div className="flex h-8 items-center gap-1.5 rounded-md border bg-muted/40 px-2 text-xs">
          <span className="text-muted-foreground">{labels.total}</span>
          <span className="font-semibold tabular-nums">
            {new Intl.NumberFormat().format(totalRecords)}
          </span>
        </div>
      </div>
    </div>
  )
}
