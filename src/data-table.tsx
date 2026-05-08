import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import {
  type CellContext,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  Loader2Icon,
} from "lucide-react"

import { cn } from "./lib/utils"
import { Checkbox } from "./ui/checkbox"
import { Skeleton } from "./ui/skeleton"

import { DataTableToolbar } from "./data-table-toolbar"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableColumnHeader } from "./data-table-column-header"
import {
  DataTableRowActions,
  type CustomRowAction,
  type RowActionId,
} from "./data-table-row-actions"
import { EditableCell } from "./editable-cell"
import {
  booleanFilterFn,
  dateFilterFn,
  numberFilterFn,
  setFilterFn,
  textFilterFn,
} from "./filters"
import { themeToStyle, type DataTableTheme } from "./theme"
import "./types"

// ----- public configuration types --------------------------------------

export type DataTableFeatures = {
  /** Toolbar global search input (default: true). */
  search?: boolean
  /** Toolbar refresh button (default: true when onRefresh is provided). */
  refresh?: boolean
  /** Column visibility menu (default: true). */
  columnVisibility?: boolean
  /** CSV / Excel export menu (default: true). */
  export?: boolean
  /** "Add row" toolbar button (default: true when onAddRow is provided). */
  addRow?: boolean
  /** Bottom pagination controls (default: true). */
  pagination?: boolean
  /** Sort headers (default: true). */
  sorting?: boolean
  /** Per-column filtering (default: true). */
  filtering?: boolean
  /** Column resizing handles (default: true). */
  resizing?: boolean
  /** Drag-to-reorder columns (default: true). */
  reordering?: boolean
  /** Pin / unpin column controls (default: true). */
  pinning?: boolean
}

export type DataTableLabels = {
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
  noData?: string
  noResults?: string
  refreshing?: string
  rowsPerPage?: string
  page?: string
  of?: string
}

export type DataTableDensity = "compact" | "default" | "comfortable"

// ----- helpers ----------------------------------------------------------

function getPinningStyles<TData>(
  column: ReturnType<TanstackTable<TData>["getAllLeafColumns"]>[number]
): React.CSSProperties {
  const isPinned = column.getIsPinned()
  if (!isPinned) return {}
  const isLast =
    isPinned === "left" && column.getIsLastColumn("left")
  const isFirst =
    isPinned === "right" && column.getIsFirstColumn("right")
  return {
    position: "sticky",
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    zIndex: 1,
    boxShadow: isLast
      ? "1px 0 0 0 var(--border)"
      : isFirst
      ? "-1px 0 0 0 var(--border)"
      : undefined,
  }
}

// ----- editing context --------------------------------------------------
//
// Cell renderers must be stable function references. tanstack-table's
// `flexRender` does `React.createElement(Comp, props)`, so a fresh arrow
// function per render makes React see a brand-new component type at the
// same tree position and unmount/remount the cell. Remounting tears down
// and re-attaches Radix's composed refs (e.g. inside Checkbox / Slot),
// which can trigger an infinite "Maximum update depth" loop under React 19.
//
// To keep the cell renderers stable, we keep editing state and handlers in
// a context and let the host components read from it.

type EditingContextValue<TData> = {
  editingCell: { rowId: string; colId: string } | null
  editingRowId: string | null
  rowDraft: Record<string, Partial<TData>>
  setEditingCell: (next: { rowId: string; colId: string } | null) => void
  setEditingRowId: (next: string | null) => void
  setRowDraft: React.Dispatch<
    React.SetStateAction<Record<string, Partial<TData>>>
  >
  rowActions: ("view" | "edit" | "duplicate" | "delete")[]
  customRowActions?: CustomRowAction<TData>[]
  onRowAction?: (action: RowActionId, row: TData) => void
  onCellEdit?: (row: TData, columnId: string, value: unknown) => void
  onRowSave?: (row: TData, draft: Partial<TData>) => void
}

const DataTableEditingContext = createContext<EditingContextValue<unknown> | null>(
  null
)

function useEditingContext<TData>(): EditingContextValue<TData> {
  const ctx = useContext(DataTableEditingContext)
  if (!ctx) throw new Error("DataTable editing context missing")
  return ctx as unknown as EditingContextValue<TData>
}

function EditableCellHost<TData, TValue>(ctx: CellContext<TData, TValue>) {
  const {
    editingCell,
    editingRowId,
    setEditingCell,
    setRowDraft,
    onCellEdit,
  } = useEditingContext<TData>()
  const colId = ctx.column.id
  const rowId = ctx.row.id
  const isCellEdit =
    editingCell?.rowId === rowId && editingCell.colId === colId
  const isRowEdit = editingRowId === rowId
  const isEditing = isCellEdit || isRowEdit

  return (
    <EditableCell
      {...ctx}
      isEditing={isEditing}
      autoOpen={isCellEdit}
      onStartEdit={() => setEditingCell({ rowId, colId })}
      onCancel={() => {
        if (isCellEdit) setEditingCell(null)
      }}
      onCommit={(value) => {
        if (isRowEdit) {
          setRowDraft((d) => ({
            ...d,
            [rowId]: {
              ...d[rowId],
              [colId]: value as TData[keyof TData],
            },
          }))
          return
        }
        setEditingCell(null)
        if (value !== ctx.getValue()) {
          onCellEdit?.(ctx.row.original, colId, value)
        }
      }}
    />
  )
}

function ActionsCellHost<TData>({ row }: CellContext<TData, unknown>) {
  const {
    editingRowId,
    setEditingRowId,
    rowDraft,
    setRowDraft,
    rowActions,
    customRowActions,
    onRowAction,
    onRowSave,
  } = useEditingContext<TData>()
  const rowId = row.id
  const isRowEdit = editingRowId === rowId
  return (
    <DataTableRowActions
      row={row.original}
      actions={rowActions}
      customActions={customRowActions}
      isEditing={isRowEdit}
      onSaveEdit={() => {
        onRowSave?.(row.original, rowDraft[rowId] ?? {})
        setRowDraft((d) => {
          const { [rowId]: _, ...rest } = d
          return rest
        })
        setEditingRowId(null)
      }}
      onCancelEdit={() => {
        setRowDraft((d) => {
          const { [rowId]: _, ...rest } = d
          return rest
        })
        setEditingRowId(null)
      }}
      onAction={(a) => {
        if (a === "edit") {
          setEditingRowId(rowId)
          return
        }
        onRowAction?.(a, row.original)
      }}
    />
  )
}

// ----- types ------------------------------------------------------------

export type DataTableProps<TData extends { id: string | number }> = {
  data: TData[]
  columns: ColumnDef<TData>[]

  isLoading?: boolean
  isFetching?: boolean
  onRefresh?: () => void

  totalRecords?: number
  exportFileName?: string

  /** Hide the row-selection checkbox column. */
  enableSelection?: boolean
  /** Render an expandable detail panel under the row. */
  renderSubRow?: (row: TData) => React.ReactNode
  /** Use TanStack's built-in nested rows via this accessor. */
  getSubRows?: (row: TData) => TData[] | undefined

  rowActions?: ("view" | "edit" | "duplicate" | "delete")[]
  customRowActions?: CustomRowAction<TData>[]
  onRowAction?: (action: RowActionId, row: TData) => void

  /** Commit a single edited cell. Receives the row, column id and new value. */
  onCellEdit?: (row: TData, columnId: string, value: unknown) => void
  /** Commit an entire row in row-edit mode. */
  onRowSave?: (row: TData, draft: Partial<TData>) => void
  /** Build a fresh empty row when "Add row" is clicked. */
  onAddRow?: () => Partial<TData>
  /** Bulk delete selected rows. */
  onBulkDelete?: (rows: TData[]) => void

  initialPageSize?: number
  pageSizeOptions?: number[]

  initialColumnPinning?: ColumnPinningState
  initialColumnVisibility?: VisibilityState

  /** Optional controlled global filter (for cross-tab persistence). */
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void

  className?: string
  toolbarSlot?: React.ReactNode

  /** Toggle individual table features. */
  features?: DataTableFeatures
  /** Override every user-facing string. */
  labels?: DataTableLabels
  /** Row + cell padding density. Defaults to "default". */
  density?: DataTableDensity
  /** CSS-variable overrides (shadcn-compatible) scoped to this instance. */
  theme?: DataTableTheme
}

const DEFAULT_LABELS: Required<DataTableLabels> = {
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
  noData: "No data.",
  noResults: "No rows match the current filters.",
  refreshing: "Refreshing",
  rowsPerPage: "Rows per page",
  page: "Page",
  of: "of",
}

const DENSITY_CLASS: Record<DataTableDensity, string> = {
  compact: "[&_tbody_td]:py-0.5 [&_tbody_td]:text-xs",
  default: "",
  comfortable: "[&_tbody_td]:py-2",
}

// ----- component --------------------------------------------------------

export function DataTable<TData extends { id: string | number }>({
  data,
  columns,
  isLoading,
  isFetching,
  onRefresh,
  totalRecords,
  exportFileName,
  enableSelection = true,
  renderSubRow,
  getSubRows,
  rowActions = ["view", "edit", "duplicate", "delete"],
  customRowActions,
  onRowAction,
  onCellEdit,
  onRowSave,
  onAddRow,
  onBulkDelete,
  initialPageSize = 10,
  pageSizeOptions,
  initialColumnPinning,
  initialColumnVisibility,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  className,
  toolbarSlot,
  features,
  labels: labelsProp,
  density = "default",
  theme,
}: DataTableProps<TData>) {
  const labels: Required<DataTableLabels> = { ...DEFAULT_LABELS, ...labelsProp }
  const f: Required<DataTableFeatures> = {
    search: features?.search ?? true,
    refresh: features?.refresh ?? !!onRefresh,
    columnVisibility: features?.columnVisibility ?? true,
    export: features?.export ?? true,
    addRow: features?.addRow ?? !!onAddRow,
    pagination: features?.pagination ?? true,
    sorting: features?.sorting ?? true,
    filtering: features?.filtering ?? true,
    resizing: features?.resizing ?? true,
    reordering: features?.reordering ?? true,
    pinning: features?.pinning ?? true,
  }
  const themeStyle = themeToStyle(theme)
  // ----- state ----------------------------------------------------------
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("")
  const isControlledFilter = globalFilterProp !== undefined
  const globalFilter = isControlledFilter ? globalFilterProp : internalGlobalFilter
  const setGlobalFilter = (v: string) => {
    if (isControlledFilter) onGlobalFilterChange?.(v)
    else setInternalGlobalFilter(v)
  }
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialColumnVisibility ?? {}
  )
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(
    () => {
      const base = initialColumnPinning ?? { left: [], right: [] }
      const left = [...(base.left ?? [])]
      const right = [...(base.right ?? [])]
      const hasExpandColumn = !!(renderSubRow || getSubRows)
      // Keep __expand glued to __select: if __select is pinned left and the
      // table has an expand column, ensure __expand sits right after it on
      // the left side regardless of user-supplied pin config.
      if (hasExpandColumn && left.includes("__select") && !left.includes("__expand")) {
        const idx = left.indexOf("__select")
        left.splice(idx + 1, 0, "__expand")
      }
      return { left, right }
    }
  )
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  // editing state — single cell or whole row
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [rowDraft, setRowDraft] = useState<Record<string, Partial<TData>>>({})

  // newly added rows kept in local state until persisted
  const [extraRows, setExtraRows] = useState<TData[]>([])
  const mergedData = useMemo(
    () => (extraRows.length ? [...extraRows, ...data] : data),
    [extraRows, data]
  )

  // ----- column augmentation -------------------------------------------
  const augmentedColumns = useMemo<ColumnDef<TData>[]>(() => {
    const wrap = (col: ColumnDef<TData>): ColumnDef<TData> => {
      const meta = col.meta
      const hasEditor = !!meta?.editor
      const id = col.id ?? (col as { accessorKey?: string }).accessorKey

      const original = col.cell
      const headerLabel =
        meta?.label ?? (typeof col.header === "string" ? col.header : id ?? "")

      // Pick a default filterFn based on declared filterType. The user can
      // still override it by setting `filterFn` directly on the column.
      const defaultFilterFn = (() => {
        switch (meta?.filterType) {
          case "text":
            return textFilterFn
          case "number":
            return numberFilterFn
          case "date":
            return dateFilterFn
          case "select":
          case "multi-select":
            return setFilterFn
          case "boolean":
            return booleanFilterFn
          default:
            return undefined
        }
      })()

      return ({
        ...col,
        filterFn: col.filterFn ?? defaultFilterFn,
        header:
          typeof col.header === "function"
            ? col.header
            : (ctx) => (
                <DataTableColumnHeader
                  column={ctx.column}
                  title={headerLabel}
                />
              ),
        cell: hasEditor ? (EditableCellHost as ColumnDef<TData>["cell"]) : original,
      } as ColumnDef<TData>)
    }

    const built: ColumnDef<TData>[] = columns.map(wrap)

    // Order matters: unshift expand first, then select, so the final order is
    // [__select, __expand, ...userColumns]. The expand toggle should always
    // sit right next to the selection checkbox.
    if (renderSubRow || getSubRows) {
      built.unshift({
        id: "__expand",
        size: 32,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: () => null,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              onClick={row.getToggleExpandedHandler()}
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
            >
              {row.getIsExpanded() ? (
                <ChevronDownIcon className="size-3.5" />
              ) : (
                <ChevronRightIcon className="size-3.5" />
              )}
            </button>
          ) : null,
      })
    }

    if (enableSelection) {
      built.unshift({
        id: "__select",
        size: 36,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: ({ table }) => (
          <div className="flex items-center justify-center px-1">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected()
                  ? true
                  : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
              }
              onCheckedChange={(c) => table.toggleAllPageRowsSelected(!!c)}
              aria-label="Select all rows on this page"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center px-1">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(c) => row.toggleSelected(!!c)}
              aria-label="Select row"
            />
          </div>
        ),
      })
    }

    if (rowActions.length || customRowActions?.length) {
      built.push({
        id: "__actions",
        size: 56,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: () => <div className="text-right text-xs">Actions</div>,
        cell: ActionsCellHost as ColumnDef<TData>["cell"],
      })
    }

    return built
  }, [
    columns,
    enableSelection,
    renderSubRow,
    getSubRows,
    rowActions.length,
    customRowActions?.length,
  ])

  // initial column order
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
    augmentedColumns.map((c) => c.id ?? (c as { accessorKey?: string }).accessorKey ?? "")
  )
  useEffect(() => {
    const next = augmentedColumns.map(
      (c) => c.id ?? (c as { accessorKey?: string }).accessorKey ?? ""
    )
    setColumnOrder((prev) => {
      // preserve user-reordered positions; append new columns at the end
      const existing = prev.filter((id) => next.includes(id))
      const added = next.filter((id) => !prev.includes(id))
      const final = [...existing, ...added]
      return final.length === prev.length && final.every((v, i) => prev[i] === v)
        ? prev
        : final
    })
  }, [augmentedColumns])

  // ----- table ----------------------------------------------------------
  const table = useReactTable({
    data: mergedData,
    columns: augmentedColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnPinning,
      columnSizing,
      columnOrder,
      rowSelection,
      expanded,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,

    enableSorting: f.sorting,
    enableColumnFilters: f.filtering,
    enableColumnResizing: f.resizing,
    columnResizeMode: "onChange",
    enableRowSelection: true,
    enableExpanding: !!(renderSubRow || getSubRows),
    enablePinning: f.pinning,
    getRowId: (row) => String(row.id),
    getSubRows,
    getRowCanExpand: (row) => {
      if (renderSubRow) return true
      const subs = getSubRows?.(row.original)
      return !!subs && subs.length > 0
    },
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value ?? "").toLowerCase().trim()
      if (!q) return true
      return row.getAllCells().some((cell) => {
        const v = cell.getValue()
        return v != null && String(v).toLowerCase().includes(q)
      })
    },
    filterFns: {
      // attached via columnDef.filterFn below where needed
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Pointer-event-based column reorder. HTML5 drag-and-drop refused to
  // initiate when the user mousedown'd on an interactive child (sort
  // dropdown button, filter trigger), which is most of the visible header
  // area. Pointer events sidestep that.
  const reorderState = useRef<{ x: number; y: number; id: string } | null>(null)
  const [activeReorderId, setActiveReorderId] = useState<string | null>(null)
  const [dragOverColId, setDragOverColId] = useState<string | null>(null)

  const isInteractiveTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    if (!el || !el.closest) return false
    return !!el.closest(
      'button, a, input, select, textarea, [role="menuitem"], [data-no-drag]'
    )
  }

  const onHeaderPointerDown =
    (id: string) => (e: React.PointerEvent<HTMLTableCellElement>) => {
      if (e.button !== 0) return
      if (isInteractiveTarget(e.target)) return
      reorderState.current = { x: e.clientX, y: e.clientY, id }
    }

  const onHeaderPointerMove = (e: React.PointerEvent<HTMLTableCellElement>) => {
    const start = reorderState.current
    if (!start) return
    if (!activeReorderId) {
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (Math.hypot(dx, dy) < 6) return
      setActiveReorderId(start.id)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const th = el ? (el.closest("th[data-col-id]") as HTMLElement | null) : null
    const overId = th?.dataset.colId ?? null
    const next = overId && overId !== start.id ? overId : null
    if (next !== dragOverColId) setDragOverColId(next)
  }

  const onHeaderPointerUp = (e: React.PointerEvent<HTMLTableCellElement>) => {
    const start = reorderState.current
    reorderState.current = null
    if (!activeReorderId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // pointer may already be released
    }
    const target = dragOverColId
    setActiveReorderId(null)
    setDragOverColId(null)
    if (!start || !target || target === start.id) return
    setColumnOrder((order) => {
      const next = [...order]
      const from = next.indexOf(start.id)
      const to = next.indexOf(target)
      if (from === -1 || to === -1) return order
      next.splice(from, 1)
      next.splice(to, 0, start.id)
      return next
    })
  }

  // ----- "add row" handling --------------------------------------------
  const handleAddRow = onAddRow
    ? () => {
        const draft = onAddRow()
        const tempId = `__new_${Date.now()}`
        const newRow = { id: tempId, ...draft } as unknown as TData
        setExtraRows((r) => [newRow, ...r])
        setPagination((p) => ({ ...p, pageIndex: 0 }))
        setEditingRowId(tempId)
      }
    : undefined

  // ----- render ---------------------------------------------------------
  const rows = table.getRowModel().rows
  const visibleLeafCount = table.getVisibleLeafColumns().length

  const editingContextValue = useMemo<EditingContextValue<TData>>(
    () => ({
      editingCell,
      editingRowId,
      rowDraft,
      setEditingCell,
      setEditingRowId,
      setRowDraft,
      rowActions,
      customRowActions,
      onRowAction,
      onCellEdit,
      onRowSave,
    }),
    [
      editingCell,
      editingRowId,
      rowDraft,
      rowActions,
      customRowActions,
      onRowAction,
      onCellEdit,
      onRowSave,
    ]
  )

  return (
    <DataTableEditingContext.Provider
      value={editingContextValue as unknown as EditingContextValue<unknown>}
    >
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm",
        DENSITY_CLASS[density],
        className
      )}
      style={themeStyle}
    >
      <DataTableToolbar
        table={table}
        totalRecords={totalRecords ?? mergedData.length}
        isFetching={isFetching}
        onRefresh={f.refresh ? onRefresh : undefined}
        onAddRow={f.addRow ? handleAddRow : undefined}
        onBulkDelete={onBulkDelete}
        exportFileName={exportFileName}
        globalFilter={globalFilter}
        onGlobalFilterChange={(v) => {
          setGlobalFilter(v)
          table.setPageIndex(0)
        }}
        toolbarSlot={toolbarSlot}
        features={f}
        labels={labels}
      />

      <div className="relative w-full overflow-auto">
        <table
          className="w-full caption-bottom text-sm"
          style={{
            width: table.getCenterTotalSize() ? undefined : "100%",
            minWidth: "100%",
          }}
        >
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/70">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b">
                {hg.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  const isUtility =
                    header.column.id === "__select" ||
                    header.column.id === "__expand" ||
                    header.column.id === "__actions"
                  const isPinned = !!header.column.getIsPinned()
                  const canReorder = !isUtility && f.reordering
                  const isDropTarget =
                    canReorder && dragOverColId === header.column.id
                  const isBeingDragged =
                    canReorder && activeReorderId === header.column.id
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      data-col-id={header.column.id}
                      onPointerDown={
                        canReorder
                          ? onHeaderPointerDown(header.column.id)
                          : undefined
                      }
                      onPointerMove={canReorder ? onHeaderPointerMove : undefined}
                      onPointerUp={canReorder ? onHeaderPointerUp : undefined}
                      onPointerCancel={
                        canReorder ? onHeaderPointerUp : undefined
                      }
                      style={{
                        width: header.getSize(),
                        ...getPinningStyles(header.column),
                        ...(isPinned ? { zIndex: 2 } : {}),
                      }}
                      className={cn(
                        "group/th relative h-9 px-2 text-left align-middle text-xs font-medium text-muted-foreground select-none",
                        canReorder && "cursor-grab active:cursor-grabbing",
                        isPinned && "bg-card",
                        isBeingDragged && "opacity-50",
                        isDropTarget &&
                          "bg-primary/10 ring-2 ring-inset ring-primary/40",
                        meta?.headerClassName
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {canReorder && (
                          <GripVerticalIcon
                            className="-ml-1 size-3 shrink-0 text-muted-foreground/40 opacity-0 transition group-hover/th:opacity-100"
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                      </div>

                      {header.column.getCanResize() && (
                        <span
                          data-no-drag
                          onPointerDown={(e) => e.stopPropagation()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onDoubleClick={() => header.column.resetSize()}
                          className={cn(
                            "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none bg-transparent transition-colors hover:bg-primary/40",
                            header.column.getIsResizing() && "bg-primary"
                          )}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {isLoading ? (
              renderSkeleton(visibleLeafCount, pagination.pageSize)
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleLeafCount}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {globalFilter || columnFilters.length
                    ? labels.noResults
                    : labels.noData}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <DataTableRow
                  key={row.id}
                  row={row}
                  renderSubRow={renderSubRow}
                  isRowEditing={editingRowId === row.id}
                />
              ))
            )}
          </tbody>
        </table>

        {isFetching && !isLoading && (
          <div className="pointer-events-none absolute top-1.5 right-2 flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
            <Loader2Icon className="size-3 animate-spin" /> {labels.refreshing}
          </div>
        )}
      </div>

      {f.pagination && (
        <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
      )}
    </div>
    </DataTableEditingContext.Provider>
  )
}

function DataTableRow<TData>({
  row,
  renderSubRow,
  isRowEditing,
}: {
  row: Row<TData>
  renderSubRow?: (row: TData) => React.ReactNode
  isRowEditing?: boolean
}) {
  const expanded = row.getIsExpanded()
  const isSelected = row.getIsSelected()
  return (
    <>
      <tr
        data-state={isSelected ? "selected" : undefined}
        className={cn(
          "group/row border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5",
          isRowEditing && "bg-amber-500/5",
          row.depth > 0 && "bg-muted/20"
        )}
      >
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta
          const isPinned = !!cell.column.getIsPinned()
          return (
            <td
              key={cell.id}
              style={{
                width: cell.column.getSize(),
                ...getPinningStyles(cell.column),
              }}
              className={cn(
                "px-2 py-1 align-middle text-sm",
                isPinned &&
                  "bg-card group-hover/row:bg-[color-mix(in_oklab,var(--card),var(--muted)_40%)] group-data-[state=selected]/row:bg-[color-mix(in_oklab,var(--card),var(--primary)_5%)]",
                isPinned && isRowEditing &&
                  "bg-[color-mix(in_oklab,var(--card),#f59e0b_5%)]",
                meta?.cellClassName
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          )
        })}
      </tr>
      {expanded && renderSubRow && (
        <tr className="border-b bg-muted/30">
          <td colSpan={row.getVisibleCells().length} className="p-3">
            <div className="rounded-md border bg-background p-3 shadow-inner">
              {renderSubRow(row.original)}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function renderSkeleton(cols: number, rows: number) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="border-b">
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c} className="px-2 py-2">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  ))
}
