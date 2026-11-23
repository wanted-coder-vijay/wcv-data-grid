import { RowGrip } from "./row-grip"
import {
  memo,
  createContext,
  useContext,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
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
  getGroupedRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  XIcon,
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
import { EditableCell, EditableCellDisplay } from "./editable-cell"
import {
  booleanFilterFn,
  dateFilterFn,
  numberFilterFn,
  setFilterFn,
  textFilterFn,
} from "./filters"
import {
  ISOLATE_DARK_TOKENS,
  ISOLATE_LIGHT_TOKENS,
  splitTheme,
  tokensToCssBlock,
  tokensToStyle,
  type DataTableTheme,
  type DataTableTokens,
} from "./theme"
import { PortalContainerContext } from "./portal-container"
import {
  DataTableViewSheet,
  type ViewSheetConfig,
} from "./data-table-view-sheet"
import {
  DataTableConfirmDelete,
  type ConfirmDeleteConfig,
  type ConfirmDeleteContext,
} from "./data-table-confirm-delete"
import { useVirtualizer, defaultRangeExtractor } from "@tanstack/react-virtual"
import { useProgressiveRowModel } from "./progressive-row-model"
import { useGridNavigation } from "./grid-navigation"
import "./types"
import { useDataTableState, type DataTableState } from "./table-state"
import { SavedViewsControl, type DataTableSavedViewsConfig } from "./saved-views"
import { matchesGridFilter, summarizeGridValues, type GridFilter, type GridSummaryOperation } from "./grid-operations"

// ----- public configuration types --------------------------------------

export type DataTableFeatures = {
  /** Toolbar global search input (default: true). */
  grouping?: boolean
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
  loadError?: string
  retry?: string
  saving?: string
  saveError?: string
  validationError?: string
  refreshing?: string
  rowsPerPage?: string
  page?: string
  of?: string
}

export type DataTableDensity = "compact" | "default" | "comfortable"

export type DataTableFetchParams = {
  grouping?: string[]
  filterExpression?: GridFilter
  signal?: AbortSignal
  pageIndex: number
  pageSize: number
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
}

export type DataTableDataSourceResult<TData> =
  | TData[]
  | {
      rows: TData[]
      totalRecords?: number
    }

export type DataTableErrorContext = {
  type: "load" | "refresh"
  message: string
}

export type DataTableDataSource<TData> = {
  /**
   * Fetch rows internally. In "client" mode, return the full data set and the
   * table applies client-side sort/filter/pagination. In "server" mode, return
   * the current page and optionally `totalRecords`.
   */
  fetchRows: (
    params: DataTableFetchParams
  ) => Promise<DataTableDataSourceResult<TData>>
  /** "client" by default. Use "server" for API-side pagination/filter/sort. */
  mode?: "client" | "server"
  /** Set false to pause fetching. */
  enabled?: boolean
  /** Optional rows to show before the first fetch resolves. */
  initialData?: TData[]
  /** Refetch when these external values change. Memoize this array. */
  deps?: readonly unknown[]
  /** Called for load/refresh errors so apps can show a toast. */
  onError?: (error: unknown, context: DataTableErrorContext) => void
}

// ----- helpers ----------------------------------------------------------

function getPinningStyles<TData>(
  column: ReturnType<TanstackTable<TData>["getAllLeafColumns"]>[number]
): React.CSSProperties {
  const isPinned = column.getIsPinned()
  if (!isPinned) return {}
  const isLast = isPinned === "left" && column.getIsLastColumn("left")
  const isFirst = isPinned === "right" && column.getIsFirstColumn("right")
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
  formattingRules?: { filter: GridFilter; columnId?: string; style: React.CSSProperties }[]
  isNewRow: (id: string) => boolean
  finishNewRow: (id: string) => void
  announce: (message: string, kind: "success" | "error") => void
  editingCell: { rowId: string; colId: string } | null
  editingRowId: string | null
  rowDraft: Record<string, Partial<TData>>
  setEditingCell: (next: { rowId: string; colId: string } | null) => void
  setEditingRowId: (next: string | null) => void
  setRowDraft: React.Dispatch<
    React.SetStateAction<Record<string, Partial<TData>>>
  >
  saving: boolean
  savingRef: React.MutableRefObject<boolean>
  setSaving: (value: boolean) => void
  fieldErrors: Record<string, string>
  setFieldErrors: (errors: Record<string, string>) => void
  labels: Required<DataTableLabels>
  rowActions: ("view" | "edit" | "duplicate" | "delete")[]
  customRowActions?: CustomRowAction<TData>[]
  onRowAction?: (action: RowActionId, row: TData) => void
  onCellEdit?: (row: TData, columnId: string, value: unknown) => void | Promise<unknown>
  onRowSave?: (row: TData, draft: Partial<TData>) => void | Promise<unknown>
  onView?: (row: TData) => void
  onRequestDelete?: (row: TData) => void
}

const DataTableEditingContext =
  createContext<EditingContextValue<unknown> | null>(null)

function useEditingContext<TData>(): EditingContextValue<TData> {
  const ctx = useContext(DataTableEditingContext)
  if (!ctx) throw new Error("DataTable editing context missing")
  return ctx as unknown as EditingContextValue<TData>
}

function DefaultCellHost<TData, TValue>(ctx: CellContext<TData, TValue>) {
  const value = ctx.getValue()
  return ctx.column.columnDef.meta?.formatValue ? ctx.column.columnDef.meta.formatValue(value, ctx.row.original) : value == null ? null : String(value)
}

function EditableCellHost<TData, TValue>(ctx: CellContext<TData, TValue>) {
  const editing = useEditingContext<TData>()
  const meta = ctx.column.columnDef.meta
  const editable = typeof meta?.isEditable === "function" ? meta.isEditable(ctx.row.original) : meta?.isEditable !== false
  const active = editing.editingRowId === ctx.row.id || editing.editingCell?.rowId === ctx.row.id && editing.editingCell.colId === ctx.column.id
  if (active && editable) return <EditableCellEditorHost {...ctx} />
  return <EditableCellDisplay value={ctx.getValue()} meta={meta} formatted={meta?.formatValue?.(ctx.getValue(), ctx.row.original)} editable={editable} disabled={editing.saving}
    onStartEdit={() => { if (!editing.savingRef.current && !editing.editingRowId && !editing.editingCell) editing.setEditingCell({ rowId: ctx.row.id, colId: ctx.column.id }) }} />
}

function EditableCellEditorHost<TData, TValue>(ctx: CellContext<TData, TValue>) {
  const editing = useEditingContext<TData>()
  const { editingCell, editingRowId, setEditingCell, setRowDraft, onCellEdit,
    rowDraft, saving, savingRef, setSaving, fieldErrors, labels, announce } = editing
  const [error, setError] = useState<string>()
  const colId = ctx.column.id
  const rowId = ctx.row.id
  const isCellEdit = editingCell?.rowId === rowId && editingCell.colId === colId
  const isRowEdit = editingRowId === rowId
  const errorId = useId()
  const message = isRowEdit ? fieldErrors[colId] : isCellEdit ? error : undefined
  const draft = rowDraft[rowId]
  const updateDraft = (value: unknown) => {
    setRowDraft((d) => ({ ...d, [rowId]: { ...d[rowId], [colId]: value } }))
  }
  const commit = async (value: unknown) => {
    if (savingRef.current) return
    if (isRowEdit) { updateDraft(value); return }
    savingRef.current = true
    setSaving(true)
    setError(undefined)
    try {
      const validation = await ctx.column.columnDef.meta?.validate?.(value, ctx.row.original)
      if (validation) { setError(validation); return }
      if (value !== ctx.getValue()) await onCellEdit?.(ctx.row.original, colId, value)
      announce("Cell saved.", "success")
      setEditingCell(null)
      setRowDraft((d) => { const { [rowId]: _, ...rest } = d; return rest })
    } catch {
      setError(labels.saveError)
      announce(`Cell save failed: ${labels.saveError}`, "error")
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  return (
    <div className="w-full min-w-0" aria-busy={saving && (isCellEdit || isRowEdit)}>
      <EditableCell
        {...ctx}
        hasDraft={!!draft && Object.prototype.hasOwnProperty.call(draft, colId)}
        draftValue={draft?.[colId as keyof TData]}
        isEditing={isCellEdit || isRowEdit}
        autoOpen={isCellEdit}
        disabled={saving}
        errorId={message ? errorId : undefined}
        onDraftChange={updateDraft}
        onStartEdit={() => {
          if (savingRef.current || editingRowId || editingCell) return
          setError(undefined)
          setEditingCell({ rowId, colId })
        }}
        onCancel={() => {
          if (savingRef.current || !isCellEdit) return
          setError(undefined)
          setEditingCell(null)
          setRowDraft((d) => { const { [rowId]: _, ...rest } = d; return rest })
        }}
        onCommit={(value) => { void commit(value) }}
      />
      {message && <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">{message}</p>}
      {saving && isCellEdit && <span role="status" className="text-xs text-muted-foreground">{labels.saving}</span>}
    </div>
  )
}

function ActionsCellHost<TData>({ row }: CellContext<TData, unknown>) {
  const { editingCell, editingRowId, setEditingRowId, rowDraft, setRowDraft,
    rowActions, customRowActions, onRowAction, onRowSave, onView,
    onRequestDelete, saving, savingRef, setSaving, setFieldErrors, labels, announce, isNewRow, finishNewRow,
  } = useEditingContext<TData>()
  const [error, setError] = useState<string>()
  const rowId = row.id
  const isRowEdit = editingRowId === rowId
  const clearDraft = () => {
    setRowDraft((d) => { const { [rowId]: _, ...rest } = d; return rest })
    setFieldErrors({})
    setError(undefined)
    setEditingRowId(null)
  }
  const save = async () => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError(undefined)
    setFieldErrors({})
    try {
      const draft = rowDraft[rowId] ?? {}
      const candidate = { ...row.original, ...draft }
      const errors: Record<string, string> = {}
      for (const cell of row.getAllCells()) {
        const meta = cell.column.columnDef.meta
        const editable = typeof meta?.isEditable === "function"
          ? meta.isEditable(row.original) : meta?.isEditable !== false
        if (!(meta?.editor || meta?.renderEditor) || !editable || !meta.validate) continue
        const value = Object.prototype.hasOwnProperty.call(draft, cell.column.id)
          ? draft[cell.column.id as keyof TData] : cell.getValue()
        const message = await meta.validate(value, candidate)
        if (message) errors[cell.column.id] = message
      }
      if (Object.keys(errors).length) {
        setFieldErrors(errors)
        const hiddenErrors = row.getAllCells()
          .filter(cell => !cell.column.getIsVisible() && errors[cell.column.id])
          .map(cell => errors[cell.column.id])
        setError([labels.validationError, ...hiddenErrors].join(" "))
        announce([labels.validationError, ...hiddenErrors].join(" "), "error")
        return
      }
      if (isNewRow(rowId) && !onRowSave) throw new Error("Provide onRowSave to persist new rows.")
      await onRowSave?.(row.original, draft)
      finishNewRow(rowId)
      clearDraft()
      announce("Row saved.", "success")
    } catch {
      setError(labels.saveError)
      announce(labels.saveError, "error")
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  return (
    <DataTableRowActions
      row={row.original}
      actions={rowActions}
      customActions={customRowActions}
      isEditing={isRowEdit}
      isSaving={saving}
      saveError={isRowEdit ? error : undefined}
      savingLabel={labels.saving}
      onSaveEdit={() => { void save() }}
      onCancelEdit={() => { if (!savingRef.current) { finishNewRow(rowId); clearDraft() } }}
      onAction={(a) => {
        if (a === "edit") {
          if (savingRef.current || editingRowId || editingCell) return
          setError(undefined)
          setFieldErrors({})
          setEditingRowId(rowId)
          return
        }
        if (a === "view") onView?.(row.original)
        else if (a === "delete") { onRequestDelete?.(row.original); return }
        onRowAction?.(a, row.original)
      }}
    />
  )
}

// ----- types ------------------------------------------------------------

export type DataTableProps<TData extends { id: string | number }> = {
  format?: { locale?: string; currency?: string; timeZone?: string }
  conditionalFormatting?: { filter: GridFilter; columnId?: string; style: React.CSSProperties }[]
  /** Nested cross-column filter. Server adapters receive this unchanged. */
  filterExpression?: GridFilter
  direction?: "ltr" | "rtl"
  /** Server totals must be supplied explicitly; loaded pages cannot calculate query-wide totals. */
  summary?: { scope: "page" | "filtered" | "server"; columns: Record<string, GridSummaryOperation>; values?: Record<string, number | null>; label?: string }
  onExportXlsx?: (table: TanstackTable<TData>, fileName: string) => Promise<unknown>
  enableKeyboardNavigation?: boolean
  virtualizeRows?: boolean
  /** Extra rows mounted above/below the visible range. Default 8. */
  virtualOverscan?: number
  /** Minimum row height and initial estimate in pixels; taller content is measured. */
  virtualRowHeight?: number
  initialGrouping?: string[]
  /** Group server-provided trees without grouping the loaded page. */
  manualGrouping?: boolean
  /** Commit a manual reorder of flat client rows in the current page. */
  onRowsReorder?: (rows: TData[]) => void
  data?: TData[]
  columns: ColumnDef<TData>[]

  /** Optional internal fetcher. Omit this when using controlled `data`. */
  dataSource?: DataTableDataSource<TData>
  /** Supplied slices are controlled; omitted slices remain internal. */
  state?: Partial<DataTableState>
  initialState?: Partial<DataTableState>
  onStateChange?: (next: DataTableState) => void
  /** Named filter/layout profiles; browser persistence is opt-in. */
  savedViews?: DataTableSavedViewsConfig

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
  /**
   * Handler for the built-in "View" action. If omitted, the grid still opens
   * the View sheet (unless `viewSheet={false}`). Use this to also log,
   * navigate, or fetch detail data when a user opens View.
   */
  onView?: (row: TData) => void
  /**
   * Handler for the built-in "Delete" action. Fires *after* the user confirms
   * in the delete modal (or immediately if `confirmDelete={false}`).
   * If omitted, the grid only emits via `onRowAction("delete", row)`.
   */
  onDelete?: (row: TData) => void
  /**
   * Configure the built-in View sheet — side, density, custom renderers.
   * Pass `false` to disable; clicking "View" will then only fire
   * `onView` / `onRowAction` without opening a sheet.
   */
  viewSheet?: ViewSheetConfig<TData> | false
  /**
   * Configure the delete confirmation modal. Pass `false` to disable it and
   * fire delete handlers immediately. Pass an object to customize title,
   * description, and button labels. Defaults to enabled with built-in copy.
   */
  confirmDelete?: ConfirmDeleteConfig<TData> | boolean

  /** Commit a cell. Return the persistence promise to retain its draft on failure. */
  onCellEdit?: (row: TData, columnId: string, value: unknown) => void | Promise<unknown>
  /** Commit a row. Return the persistence promise to retain its draft on failure. */
  onRowSave?: (row: TData, draft: Partial<TData>) => void | Promise<unknown>
  /** Build a fresh empty row when "Add row" is clicked. */
  onAddRow?: () => Partial<TData>
  /** Bulk delete selected rows. */
  onBulkDelete?: (rows: TData[]) => void

  initialPageSize?: number
  pageSizeOptions?: number[]

  initialColumnPinning?: ColumnPinningState
  initialColumnVisibility?: VisibilityState
  /** Initial sort order. */
  initialSorting?: SortingState
  /** Observe selected row objects (loaded rows only in server mode). */
  onSelectionChange?: (rows: TData[]) => void
  /** Accessible table name. */
  ariaLabel?: string
  /** Alternating row backgrounds. */
  striped?: boolean
  /** Keep headers visible inside a vertically constrained table. */
  stickyHeader?: boolean
  /** Scroll viewport height, e.g. "480px". */
  maxHeight?: React.CSSProperties["maxHeight"]

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
  /**
   * CSS-variable overrides (shadcn-compatible) scoped to this instance.
   *
   * Two accepted shapes:
   *
   *   theme={{ primary: "...", accent: "..." }}              // flat tokens
   *   theme={{ light: { ... }, dark: { ... } }}              // moded — auto-flips
   *
   * Moded themes apply `light` always and swap to `dark` inside
   * `@media (prefers-color-scheme: dark)` *and* inside any `.dark` ancestor.
   *
   * Use `themePresets.violet` (or any preset) for a ready-made moded theme.
   */
  theme?: DataTableTheme
  /**
   * When `true`, the grid does NOT inherit CSS variables from the app's
   * `:root` (shadcn, custom theme, etc.). Instead it renders with the
   * package's bundled defaults (or whatever you pass via `theme`).
   *
   * Useful when embedding the grid inside a heavily-themed shell where you
   * want the table to keep its own look regardless of surrounding context.
   *
   * Defaults to `false` (inherit app theme).
   */
  isolate?: boolean
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
  loadError: "Could not load rows.",
  retry: "Retry",
  refreshing: "Refreshing",
  saving: "Saving…",
  saveError: "Could not save changes. Try again.",
  validationError: "Please fix the highlighted fields and save again.",
  rowsPerPage: "Rows per page",
  page: "Page",
  of: "of",
}

const DENSITY_CLASS: Record<DataTableDensity, string> = {
  compact: "[&_tbody_td]:py-0.5 [&_tbody_td]:text-xs",
  default: "",
  comfortable: "[&_tbody_td]:py-2",
}

const EMPTY_DATA: never[] = []

// ----- component --------------------------------------------------------

export function DataTable<TData extends { id: string | number }>({
  filterExpression, direction, summary, format, conditionalFormatting,
  initialGrouping, manualGrouping = false,
  data, onRowsReorder,
  columns,
  dataSource,
  state: controlledState, initialState, onStateChange, savedViews,
  onExportXlsx, enableKeyboardNavigation = false, virtualizeRows = false, virtualOverscan = 8, virtualRowHeight,
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
  initialSorting,
  onSelectionChange,
  ariaLabel = "Data table",
  striped = false,
  stickyHeader = false,
  maxHeight,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  className,
  toolbarSlot,
  features,
  labels: labelsProp,
  density = "default",
  theme,
  isolate = false,
  onView,
  onDelete,
  viewSheet,
  confirmDelete = true,
}: DataTableProps<TData>) {
  const labels: Required<DataTableLabels> = { ...DEFAULT_LABELS, ...labelsProp }
  const f: Required<DataTableFeatures> = {
    grouping: features?.grouping ?? !!initialGrouping?.length,
    search: features?.search ?? true,
    refresh: features?.refresh ?? !!(onRefresh || dataSource),
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
  const createViewBaseline = useRef({
    sorting: initialState?.sorting ?? initialSorting ?? [],
    columnFilters: initialState?.columnFilters ?? [],
    globalFilter: initialState?.globalFilter ?? "",
    columnVisibility: initialState?.columnVisibility ?? initialColumnVisibility ?? {},
    columnPinning: initialState?.columnPinning ?? initialColumnPinning ?? { left: [], right: [] },
    columnSizing: initialState?.columnSizing ?? {}, columnOrder: initialState?.columnOrder ?? [],
  })
  // ----- theme resolution ----------------------------------------------
  // `theme` can be a flat token map OR a `{ light, dark }` moded shape.
  // When `isolate` is true, fall back to bundled neutral defaults instead
  // of inheriting from the app's :root.
  const rawInstanceId = useId()
  const instanceId = useMemo(
    () => `dyno-grid-${rawInstanceId.replace(/[^a-zA-Z0-9]/g, "")}`,
    [rawInstanceId]
  )
  const { lightStyle, lightCss, darkCss } = useMemo(() => {
    const { light, dark } = splitTheme(theme)
    const lightTokens: DataTableTokens | undefined = isolate
      ? { ...ISOLATE_LIGHT_TOKENS, ...(light ?? {}) }
      : light
    const darkTokens: DataTableTokens | undefined = isolate
      ? { ...ISOLATE_DARK_TOKENS, ...(dark ?? light ?? {}) }
      : dark
    return {
      lightStyle: tokensToStyle(lightTokens),
      lightCss: tokensToCssBlock(lightTokens),
      darkCss: darkTokens ? tokensToCssBlock(darkTokens) : null,
    }
  }, [theme, isolate])

  // ----- portal container -----------------------------------------------
  // Mount popovers / dropdowns / sheets inside the themed grid root so they
  // inherit CSS variables. Using a callback ref ensures the context value
  // flips from null → element on mount and triggers consumers to re-render.
  const [gridRoot, setGridRoot] = useState<HTMLDivElement | null>(null)

  // ----- view sheet + delete confirm state ------------------------------
  const [viewRow, setViewRow] = useState<TData | null>(null)
  const [confirmCtx, setConfirmCtx] =
    useState<ConfirmDeleteContext<TData> | null>(null)

  const confirmEnabled = confirmDelete !== false
  const confirmConfig: ConfirmDeleteConfig<TData> | undefined =
    typeof confirmDelete === "object" ? confirmDelete : undefined
  const viewSheetEnabled = viewSheet !== false
  const viewSheetConfig: ViewSheetConfig<TData> | undefined =
    viewSheet && typeof viewSheet === "object" ? viewSheet : undefined

  const handleViewRequest = (row: TData) => {
    onView?.(row)
    if (viewSheetEnabled) setViewRow(row)
  }
  const handleDeleteRequest = (row: TData) => {
    if (confirmEnabled) {
      setConfirmCtx({ rows: [row], source: "single" })
    } else {
      onDelete?.(row)
    }
  }
  const handleBulkDeleteRequest = (rows: TData[]) => {
    if (confirmEnabled) {
      setConfirmCtx({ rows, source: "bulk" })
    } else {
      onBulkDelete?.(rows)
    }
  }
  const handleConfirmDelete = () => {
    if (!confirmCtx) return
    if (confirmCtx.source === "single") {
      onDelete?.(confirmCtx.rows[0])
    } else {
      onBulkDelete?.(confirmCtx.rows)
    }
    setConfirmCtx(null)
  }

  // ----- state ----------------------------------------------------------
  const tableState = useDataTableState({
    initial: {
      grouping: initialGrouping ?? [], sorting: initialSorting ?? [], columnVisibility: initialColumnVisibility ?? {},
      columnPinning: initialColumnPinning ?? { left: [], right: [] },
      pagination: { pageIndex: 0, pageSize: initialPageSize }, ...initialState,
    },
    controlled: controlledState, onChange: onStateChange,
    globalFilter: globalFilterProp, onGlobalFilterChange,
  })
  const { sorting, columnFilters, globalFilter, columnVisibility, columnPinning,
    columnSizing, rowSelection, expanded, pagination, columnOrder } = tableState.state
  const grouping = tableState.state.grouping ?? []
  const setGrouping = (value: React.SetStateAction<string[]>) => tableState.set("grouping", previous => typeof value === "function" ? value(previous ?? []) : value)
  const setSorting = (value: React.SetStateAction<SortingState>) => tableState.set("sorting", value)
  const setColumnFilters = (value: React.SetStateAction<ColumnFiltersState>) => tableState.set("columnFilters", value)
  const setGlobalFilter = (value: React.SetStateAction<string>) => tableState.set("globalFilter", value)
  const setColumnVisibility = (value: React.SetStateAction<VisibilityState>) => tableState.set("columnVisibility", value)
  const setColumnPinning = (value: React.SetStateAction<ColumnPinningState>) => tableState.set("columnPinning", value)
  const setColumnSizing = (value: React.SetStateAction<ColumnSizingState>) => tableState.set("columnSizing", value)
  const setRowSelection = (value: React.SetStateAction<RowSelectionState>) => tableState.set("rowSelection", value)
  const setExpanded = (value: React.SetStateAction<ExpandedState>) => tableState.set("expanded", value)
  const setPagination = (value: React.SetStateAction<PaginationState>) => tableState.set("pagination", value)
  const setColumnOrder = (value: React.SetStateAction<ColumnOrderState>) => tableState.set("columnOrder", value)
  const [sourceRows, setSourceRows] = useState<TData[]>(
    () => dataSource?.initialData ?? []
  )
  const [sourceTotalRecords, setSourceTotalRecords] = useState<
    number | undefined
  >(undefined)
  const [sourceError, setSourceError] = useState<unknown>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceFetching, setSourceFetching] = useState(false)
  const [sourceRefreshKey, setSourceRefreshKey] = useState(0)

  // editing state — single cell or whole row
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    colId: string
  } | null>(null)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; kind: "success" | "error" } | null>(null)
  const announce = (message: string, kind: "success" | "error") => setFeedback({ message, kind })
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), feedback.kind === "error" ? 8000 : 3500)
    return () => clearTimeout(timer)
  }, [feedback])
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [rowDraft, setRowDraft] = useState<Record<string, Partial<TData>>>({})

  const dataSourceEnabled = !!dataSource && dataSource.enabled !== false
  const dataSourceMode = dataSource?.mode ?? "client"
  const isServerSideDataSource =
    dataSourceEnabled && dataSourceMode === "server"
  const dataSourceDeps = dataSource?.deps ?? []

  useEffect(() => {
    if (!dataSourceEnabled || !dataSource) return

    let cancelled = false
    const controller = new AbortController()
    const isInitialLoad = sourceRows.length === 0

    setSourceError(null)
    setSourceLoading(isInitialLoad)
    setSourceFetching(!isInitialLoad)

    Promise.resolve().then(() => dataSource.fetchRows({
        grouping, filterExpression, signal: controller.signal,
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        columnFilters,
        globalFilter,
      }))
      .then((result) => {
        if (cancelled) return
        const rows = Array.isArray(result) ? result : result.rows
        setSourceRows(rows)
        setSourceTotalRecords(
          Array.isArray(result)
            ? rows.length
            : (result.totalRecords ?? rows.length)
        )
      })
      .catch((error) => {
        if (cancelled) return
        setSourceError(error)
        dataSource.onError?.(error, {
          type: isInitialLoad ? "load" : "refresh",
          message: isInitialLoad ? labels.loadError : labels.refreshing,
        })
      })
      .finally(() => {
        if (cancelled) return
        setSourceLoading(false)
        setSourceFetching(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    dataSourceEnabled,
    dataSource,
    sourceRefreshKey,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
    grouping, filterExpression,
    labels.loadError,
    labels.refreshing,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...dataSourceDeps,
  ])

  const rawData = dataSourceEnabled ? sourceRows : (data ?? EMPTY_DATA)
  const baseData = useMemo(() => filterExpression && !isServerSideDataSource ? rawData.filter(row => matchesGridFilter(row, filterExpression)) : rawData, [rawData, filterExpression, isServerSideDataSource])
  const dataIsLoading = dataSourceEnabled ? sourceLoading : isLoading
  const effectiveIsFetching = dataSourceEnabled ? sourceFetching : isFetching
  const effectiveOnRefresh = dataSourceEnabled
    ? () => setSourceRefreshKey((key) => key + 1)
    : onRefresh

  // newly added rows kept in local state until persisted
  const [extraRows, setExtraRows] = useState<TData[]>([])
  const mergedData = useMemo(
    () => (extraRows.length ? [...extraRows, ...baseData] : baseData),
    [extraRows, baseData]
  )
  const effectiveTotalRecords =
    totalRecords ??
    (dataSourceEnabled
      ? (sourceTotalRecords ?? mergedData.length)
      : mergedData.length)

  // ----- column augmentation -------------------------------------------
  const reorderedData = useRef<TData[] | null>(null)
  const allowMove = !!onRowsReorder && !!data && !dataSourceEnabled && !virtualizeRows && !getSubRows
    && !sorting.length && !grouping.length && !filterExpression && !extraRows.length
    && !editingRowId && !editingCell && !effectiveIsFetching && !(expanded === true || Object.values(expanded).some(Boolean))
  const augmentedColumns = useMemo<ColumnDef<TData>[]>(() => {
    const wrap = (col: ColumnDef<TData>): ColumnDef<TData> => {
      const meta = format ? { ...col.meta, format: { ...format, ...col.meta?.format } } : col.meta
      const hasEditor = !!(meta?.editor || meta?.renderEditor)
      const id = col.id ?? (col as { accessorKey?: string }).accessorKey

      const original = col.cell
      const headerLabel =
        meta?.label ??
        (typeof col.header === "string" ? col.header : (id ?? ""))

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

      return {
        ...col,
        meta,
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
        cell: hasEditor
          ? (EditableCellHost as ColumnDef<TData>["cell"])
          : (original ?? DefaultCellHost),
      } as ColumnDef<TData>
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
            <input type="checkbox" className="dyno-row-checkbox" checked={row.getIsSelected()}
              onChange={event => row.toggleSelected(event.target.checked)} aria-label="Select row" />
          </div>
        ),
      })
    }

    if (rowActions.length || customRowActions?.length || onAddRow || onRowSave) {
      built.push({
        id: "__actions",
        size: 80,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        header: () => <div className="text-right text-xs">Actions</div>,
        cell: ActionsCellHost as ColumnDef<TData>["cell"],
      })
    }

    if (allowMove && onRowsReorder) built.unshift({
      id: "__move", size: 42, enableSorting: false, enableHiding: false, enableResizing: false,
      header: () => null,
      cell: ({ row, table }) => <RowGrip row={row} table={table} commit={next => { reorderedData.current = next; onRowsReorder(next) }} />,
    })
    return built
  }, [
    columns, format, allowMove, onRowsReorder,
    enableSelection,
    renderSubRow,
    getSubRows,
    rowActions.length,
    customRowActions?.length,
    onAddRow, onRowSave,
  ])

  // Append newly enabled utility columns while keeping user order intact.
  useEffect(() => {
    const ids = augmentedColumns.map(c => c.id ?? (c as { accessorKey?: string }).accessorKey ?? "")
    tableState.set("columnOrder", previous => {
      const utility = ["__move", "__select", "__expand"].filter(id => ids.includes(id))
      const existing = previous.filter(id => ids.includes(id) && !utility.includes(id))
      const next = [...utility, ...existing, ...ids.filter(id => !previous.includes(id) && !utility.includes(id))]
      return next.length === previous.length && next.every((id, i) => previous[i] === id) ? previous : next
    })
    // Maintain the existing expand/selection adjacency for internally pinned columns.
    if (initialState?.columnPinning === undefined && controlledState?.columnPinning === undefined
      && (renderSubRow || getSubRows)) {
      tableState.set("columnPinning", previous => {
        const left = previous.left ?? []
        if (!left.includes("__select") || left.includes("__expand")) return previous
        const next = [...left]
        next.splice(next.indexOf("__select") + 1, 0, "__expand")
        return { ...previous, left: next }
      })
    }
  }, [augmentedColumns, tableState.set])

  const coreModel = useProgressiveRowModel(mergedData, !getSubRows && mergedData.length >= 2000)
  useEffect(() => { reorderedData.current = null }, [mergedData])
  const effectiveIsLoading = dataIsLoading || coreModel.preparing

  // ----- table ----------------------------------------------------------
  const table = useReactTable({
    data: mergedData,
    autoResetPageIndex: mergedData === reorderedData.current ? false : undefined,
    columns: augmentedColumns,
    state: {
      grouping,
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
    onGroupingChange: setGrouping,
    enableGrouping: f.grouping,
    groupedColumnMode: false,
    manualGrouping: manualGrouping || isServerSideDataSource,
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
    enableRowSelection: enableSelection,
    enableExpanding: f.grouping || !!(renderSubRow || getSubRows),
    enablePinning: f.pinning,
    manualPagination: isServerSideDataSource || !f.pagination,
    manualSorting: isServerSideDataSource,
    manualFiltering: isServerSideDataSource,
    pageCount: isServerSideDataSource
      ? Math.max(1, Math.ceil(effectiveTotalRecords / pagination.pageSize))
      : undefined,
    getRowId: (row) => String(row.id),
    getSubRows,
    getRowCanExpand: (row) => {
      if (row.getIsGrouped()) return true
      if (renderSubRow) return true
      const subs = getSubRows?.(row.original)
      return !!subs && subs.length > 0
    },
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value ?? "")
        .toLowerCase()
        .trim()
      if (!q) return true
      return row.getAllCells().some((cell) => {
        const v = cell.getValue()
        return v != null && String(v).toLowerCase().includes(q)
      })
    },
    filterFns: {
      // attached via columnDef.filterFn below where needed
    },
    getCoreRowModel: coreModel.getCoreRowModel,
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
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
        if (savingRef.current || editingCell || editingRowId) return
        const draft = onAddRow()
        const newRow = { ...draft, id: draft.id ?? `__new_${crypto.randomUUID()}` } as unknown as TData
        setExtraRows((r) => [newRow, ...r])
        tableState.update(previous => ({ ...previous, globalFilter: "", columnFilters: [], sorting: [], pagination: { ...previous.pagination, pageIndex: 0 } }))
        setEditingRowId(String(newRow.id))
      }
    : undefined

  // ----- render ---------------------------------------------------------
  const rows = table.getRowModel().rows
  const viewport = useRef<HTMLDivElement>(null)
  const virtualEnabled = virtualizeRows
  const scrollVirtualRow = useRef<((index: number) => void) | null>(null)
  const navigation = useGridNavigation({ enabled: enableKeyboardNavigation, root: gridRoot, rows,
    saving, editing: !!editingCell || !!editingRowId,
    startEdit: (rowId, colId) => { if (!editingRowId && !editingCell) setEditingCell({ rowId, colId }) },
    scrollToRow: index => { if (virtualEnabled && index >= 0) scrollVirtualRow.current?.(index) },
  })
  useEffect(() => { if (virtualEnabled) viewport.current?.scrollTo({ top: 0 }) }, [globalFilter, columnFilters, sorting, pagination.pageIndex, virtualEnabled])

  const selectionCallback = useRef(onSelectionChange)
  selectionCallback.current = onSelectionChange
  useEffect(() => {
    if (coreModel.preparing) return
    selectionCallback.current?.(
      table.getSelectedRowModel().flatRows.filter(row => !row.getIsGrouped()).map((row) => row.original)
    )
  }, [rowSelection, mergedData, table, coreModel.preparing])
  const visibleLeafCount = table.getVisibleLeafColumns().length

  const editingContextValue = useMemo<EditingContextValue<TData>>(
    () => ({
      formattingRules: conditionalFormatting,
      isNewRow: id => extraRows.some(row => String(row.id) === id),
      finishNewRow: id => setExtraRows(previous => previous.filter(row => String(row.id) !== id)),
      announce,
      editingCell,
      editingRowId,
      rowDraft,
      saving, savingRef, setSaving, fieldErrors, setFieldErrors, labels,
      setEditingCell,
      setEditingRowId,
      setRowDraft,
      rowActions,
      customRowActions,
      onRowAction,
      onCellEdit,
      onRowSave,
      onView: handleViewRequest,
      onRequestDelete: handleDeleteRequest,
    }),
    [
      editingCell,
      conditionalFormatting,
      editingRowId,
      rowDraft,
      extraRows, saving, fieldErrors, labelsProp,
      rowActions,
      customRowActions,
      onRowAction,
      onCellEdit,
      onRowSave,
      // intentional: handleViewRequest / handleDeleteRequest close over
      // viewSheetEnabled / confirmEnabled which are derived from props above.
      // They're recreated each render; the inputs here capture the prop deps.
      onView,
      onDelete,
      onBulkDelete,
      viewSheetEnabled,
      confirmEnabled,
    ]
  )

  return (
    <PortalContainerContext.Provider value={gridRoot}>
      <DataTableEditingContext.Provider
        value={editingContextValue as unknown as EditingContextValue<unknown>}
      >
        <div
          ref={setGridRoot} dir={direction}
          data-dyno-grid={instanceId}
          className={cn(
            "relative flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm",
            DENSITY_CLASS[density],
            className
          )}
          style={darkCss ? undefined : lightStyle}
        >
          {feedback && <div role={feedback.kind === "error" ? "alert" : "status"} className="absolute bottom-3 right-3 z-50 max-w-sm rounded-md border bg-popover px-3 py-2 text-sm shadow-lg" data-save-feedback={feedback.kind}>
            <span>{feedback.message}</span><button type="button" aria-label="Dismiss save notification" className="ml-3 inline-flex align-middle" onClick={() => setFeedback(null)}><XIcon className="size-3" /></button>
          </div>}
          {darkCss && (
            <style>
              {`[data-dyno-grid="${instanceId}"]{${lightCss}}`}
              {`@media (prefers-color-scheme: dark){[data-dyno-grid="${instanceId}"]{${darkCss}}}`}
              {`.dark [data-dyno-grid="${instanceId}"]{${darkCss}}`}
              {`.light [data-dyno-grid="${instanceId}"]{${lightCss}}`}
              {`[data-dyno-grid="${instanceId}"].dark{${darkCss}}`}
              {`[data-dyno-grid="${instanceId}"].light{${lightCss}}`}
            </style>
          )}
          {f.grouping && <div className="dyno-group-controls"><span>Group by</span>{table.getAllLeafColumns().filter(c=>!c.id.startsWith('__')&&c.getCanGroup()).map(c=><button key={c.id} type="button" aria-pressed={grouping.includes(c.id)} disabled={effectiveIsLoading||saving} onClick={()=>{setGrouping(grouping.includes(c.id)?grouping.filter(id=>id!==c.id):[...grouping,c.id]);setExpanded({});setPagination(p=>({...p,pageIndex:0}))}}>{c.columnDef.meta?.label ?? c.id}{grouping.includes(c.id)?` (${grouping.indexOf(c.id)+1})`:''}</button>)}{grouping.length>0&&<><button onClick={()=>table.toggleAllRowsExpanded(true)}>Expand all groups</button><button onClick={()=>table.toggleAllRowsExpanded(false)}>Collapse all groups</button><button onClick={()=>setGrouping([])}>Clear grouping</button>{isServerSideDataSource&&!manualGrouping&&<span>Grouping must be implemented by your server adapter.</span>}</>}</div>}
          <DataTableToolbar
            onExportXlsx={onExportXlsx}
            table={table}
            totalRecords={effectiveTotalRecords}
            isFetching={effectiveIsFetching}
            onRefresh={f.refresh ? effectiveOnRefresh : undefined}
            onAddRow={f.addRow ? handleAddRow : undefined}
            onBulkDelete={onBulkDelete ? handleBulkDeleteRequest : undefined}
            exportFileName={exportFileName}
            globalFilter={globalFilter}
            onGlobalFilterChange={(v) => {
              setGlobalFilter(v)
              table.setPageIndex(0)
            }}
            toolbarSlot={<>
              {savedViews && <SavedViewsControl config={savedViews}
                state={tableState.state} disabled={saving || !!editingCell || !!editingRowId}
                baseline={createViewBaseline.current}
                onApply={view => tableState.update(previous => ({ ...previous, ...view,
                  pagination: { ...previous.pagination, pageIndex: 0 } }))} />}
              {toolbarSlot}
            </>}
            features={f}
            labels={labels}
          />

          {enableKeyboardNavigation && <span className="sr-only" aria-live="polite">{navigation.current ? `Row ${rows.findIndex(row => row.id === navigation.current?.row) + 1} of ${rows.length}, column ${navigation.current.column}. Arrow keys navigate; Enter or F2 edits; Escape cancels.` : "No cells."}</span>}
          {coreModel.preparing && <div role="status" className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground"><Loader2Icon className="size-3 animate-spin" />Preparing rows… {coreModel.progress.toLocaleString()} / {mergedData.length.toLocaleString()}</div>}
          <div data-grid-scrollbar="" ref={viewport} onKeyDown={navigation.onKeyDown} className="relative w-full overflow-auto" style={{ maxHeight: virtualizeRows ? maxHeight ?? "480px" : maxHeight }}>
            <table data-virtual-table={virtualEnabled ? "" : undefined}
              role="table" aria-label={ariaLabel}
              aria-rowcount={enableKeyboardNavigation || virtualizeRows ? rows.length + 1 : undefined}
              className={cn(
                "w-full caption-bottom text-sm"
              )}
              style={{
                display: virtualEnabled ? "grid" : undefined,
                width: virtualEnabled ? table.getTotalSize() : table.getCenterTotalSize() ? undefined : "100%",
                minWidth: "100%",
              }}
            >
              <thead role="rowgroup" style={{ display: virtualEnabled ? "grid" : undefined }}
                className={cn("bg-card", stickyHeader && "sticky top-0 z-10")}
              >
                {table.getHeaderGroups().map((hg) => (
                  <tr role="row" key={hg.id} className="border-b" style={{ display: virtualEnabled ? "flex" : undefined }}>
                    {hg.headers.map((header) => {
                      const meta = header.column.columnDef.meta
                      const isUtility =
                        header.column.id === "__move" || header.column.id === "__select" ||
                        header.column.id === "__expand" ||
                        header.column.id === "__actions"
                      const isPinned = !!header.column.getIsPinned()
                      const canReorder = !isUtility && f.reordering
                      const isDropTarget =
                        canReorder && dragOverColId === header.column.id
                      const isBeingDragged =
                        canReorder && activeReorderId === header.column.id
                      return (
                        <th role="columnheader"
                          key={header.id}
                          colSpan={header.colSpan}
                          data-col-id={header.column.id}
                          onPointerDown={
                            canReorder
                              ? onHeaderPointerDown(header.column.id)
                              : undefined
                          }
                          onPointerMove={
                            canReorder ? onHeaderPointerMove : undefined
                          }
                          onPointerUp={
                            canReorder ? onHeaderPointerUp : undefined
                          }
                          onPointerCancel={
                            canReorder ? onHeaderPointerUp : undefined
                          }
                          style={{
                            width: header.getSize(), flexShrink: virtualEnabled ? 0 : undefined,
                            ...getPinningStyles(header.column),
                            ...(isPinned ? { zIndex: 2 } : {}),
                          }}
                          className={cn(
                            "group/th relative h-9 px-2 text-left align-middle text-xs font-medium text-muted-foreground select-none",
                            canReorder && "cursor-grab active:cursor-grabbing",
                            isPinned && "bg-card",
                            isBeingDragged && "opacity-50",
                            isDropTarget &&
                              "bg-primary/10 ring-2 ring-primary/40 ring-inset",
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
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
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
                                "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-transparent transition-colors select-none hover:bg-primary/40",
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

              {virtualEnabled && !effectiveIsLoading && rows.length > 0 ? <VirtualTableRows rows={rows} viewport={viewport} density={density}
                    overscan={virtualOverscan} estimatedHeight={virtualRowHeight} expanded={expanded} renderState={tableState.state} striped={striped}
                    columnCount={visibleLeafCount} renderSubRow={renderSubRow}
                    editingId={editingRowId ?? editingCell?.rowId} editingRowId={editingRowId}
                    navigation={enableKeyboardNavigation ? navigation : undefined} scrollRow={scrollVirtualRow} /> : <tbody role="rowgroup" style={virtualEnabled ? {display:"grid",width:"100%"} : undefined}>
                {effectiveIsLoading ? (
                  renderSkeleton(table.getVisibleLeafColumns(), Math.min(20, pagination.pageSize), virtualEnabled)
                ) : sourceError && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleLeafCount}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span>{labels.loadError}</span>
                        {effectiveOnRefresh && (
                          <button
                            type="button"
                            onClick={effectiveOnRefresh}
                            className="rounded-md border px-2 py-1 text-xs text-foreground hover:bg-muted"
                          >
                            {labels.retry}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
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
rows.map((row, index) => (
                    <DataTableRow key={row.id} row={row} index={index} striped={striped} renderSubRow={renderSubRow}
                      isRowEditing={editingRowId === row.id} navigation={enableKeyboardNavigation ? navigation : undefined} />
                  ))
                )}
              </tbody>}
              {summary && <tfoot style={virtualEnabled ? { display: "block", position: "sticky", bottom: 0, background: "var(--background)", zIndex: 2 } : { position: "sticky", bottom: 0, background: "var(--background)", zIndex: 2 }}><tr style={virtualEnabled ? { display: "flex" } : undefined}>{table.getVisibleLeafColumns().map((column, index) => {
                const operation = summary.columns[column.id]
                const source = summary.scope === "page" ? table.getRowModel() : table.getFilteredRowModel()
                const value = summary.scope === "server" ? summary.values?.[column.id] : isServerSideDataSource && summary.scope === "filtered" ? undefined : operation ? summarizeGridValues(source.flatRows.filter(row => !row.getIsGrouped()).map(row => row.getValue(column.id)), operation) : undefined
                return <td key={column.id} style={{ width: column.getSize(), flexShrink: 0, ...getPinningStyles(column) }} className="border-t px-2 py-2 text-sm font-medium">{index === 0 ? `${summary.label ?? "Summary"}${value == null ? "" : ": " + value.toLocaleString()}` : value == null ? "—" : value.toLocaleString()}</td>
              })}</tr></tfoot>}
            </table>

            {effectiveIsFetching && !effectiveIsLoading && (
              <div className="pointer-events-none absolute top-1.5 right-2 flex items-center gap-1.5 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
                <Loader2Icon className="size-3 animate-spin" />{" "}
                {labels.refreshing}
              </div>
            )}
          </div>

          {f.pagination && (
            <DataTablePagination
              table={table}
              pageSizeOptions={pageSizeOptions}
            />
          )}

          <DataTableViewSheet
            table={table}
            row={viewRow}
            open={viewRow != null}
            onOpenChange={(o) => !o && setViewRow(null)}
            config={viewSheetConfig}
            onEdit={onRowSave ? row => {
              if (savingRef.current || editingRowId || editingCell) return
              const index = table.getPrePaginationRowModel().rows.findIndex(item => item.id === String(row.id))
              if (index < 0) return
              if (f.pagination) setPagination(previous => ({ ...previous, pageIndex: Math.floor(index / previous.pageSize) }))
              setViewRow(null); setFieldErrors({}); setEditingRowId(String(row.id))
            } : undefined}
            onDelete={onDelete ? row => { setViewRow(null); handleDeleteRequest(row) } : undefined}
          />
          <DataTableConfirmDelete
            open={confirmCtx != null}
            onOpenChange={(o) => !o && setConfirmCtx(null)}
            context={confirmCtx}
            onConfirm={handleConfirmDelete}
            config={confirmConfig}
          />
        </div>
      </DataTableEditingContext.Provider>
    </PortalContainerContext.Provider>
  )
}

function VirtualTableRows<T>({ rows, viewport, density, overscan, estimatedHeight, expanded,
  columnCount, renderSubRow, editingId, editingRowId, navigation, scrollRow, renderState, striped }: {
  rows: Row<T>[]; viewport: React.RefObject<HTMLDivElement | null>; density: DataTableDensity
  overscan: number; estimatedHeight?: number; expanded: ExpandedState; columnCount: number; renderState: DataTableState; striped: boolean
  renderSubRow?: (row: T) => React.ReactNode; editingId?: string | null; editingRowId?: string | null
  navigation?: ReturnType<typeof useGridNavigation<T>>; scrollRow: React.RefObject<((index: number) => void) | null>
}) {
  const entries = useMemo(() => rows.flatMap((row, rowIndex) => {
    const item = { row, rowIndex, detail: false, key: row.id }
    return renderSubRow && !row.getIsGrouped() && row.getIsExpanded() ? [item, { ...item, detail: true, key: row.id + "::detail" }] : [item]
  }), [rows, expanded, renderSubRow])
  const editingIndex = useMemo(() => editingId ? entries.findIndex(item => !item.detail && item.row.id === editingId) : -1, [entries, editingId])
  const rangeExtractor = useCallback((range: Parameters<typeof defaultRangeExtractor>[0]) => {
    const indexes = defaultRangeExtractor(range)
    if (editingIndex >= 0 && !indexes.includes(editingIndex)) indexes.push(editingIndex)
    return indexes.sort((a, b) => a - b)
  }, [editingIndex])
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    directDomUpdates: true, directDomUpdatesMode: "position",
    count: entries.length, getScrollElement: () => viewport.current,
    estimateSize: useCallback((index: number) => entries[index].detail ? 100 : estimatedHeight ?? (density === "compact" ? 36 : density === "comfortable" ? 52 : 40), [entries, density, estimatedHeight]),
    getItemKey: useCallback((index: number) => entries[index].key, [entries]),
    measureElement: (element, entry, instance) => {
      const box = entry?.borderBoxSize?.[0]
      if (box) return Math.round(box.blockSize)
      const index = instance.indexFromElement(element)
      return instance.itemSizeCache.get(instance.options.getItemKey(index)) ?? instance.options.estimateSize(index)
    },
    useAnimationFrameWithResizeObserver: true,
    overscan: Math.max(1, Math.min(100, overscan)), rangeExtractor,
  })
  useEffect(() => {
    scrollRow.current = index => {
      const position = entries.findIndex(item => !item.detail && item.rowIndex === index)
      if (position >= 0) virtualizer.scrollToIndex(position, { align: "auto" })
    }
    return () => { scrollRow.current = null }
  }, [entries, scrollRow, virtualizer])
  const items = virtualizer.getVirtualItems()
  return <tbody role="rowgroup" ref={virtualizer.containerRef} style={{ display: "grid", position: "relative", width: "100%" }}>
    {items.map(item => {
      const entry = entries[item.index]
      return entry.detail ? <tr role="row" key={item.key} ref={virtualizer.measureElement} data-index={item.index} data-virtual-detail=""
        style={{ position: "absolute", display: "flex", width: "100%", minHeight: 100 }} className="border-b bg-muted/30">
        <td role="cell" style={{ width: "100%" }} className="p-3"><div className="rounded-md border bg-background p-3">{renderSubRow?.(entry.row.original)}</div></td>
      </tr> : <MemoDataTableRow key={item.key} virtual striped={striped} logicalIndex={entry.rowIndex} minimumHeight={estimatedHeight ?? (density === "compact" ? 36 : density === "comfortable" ? 52 : 40)} row={entry.row} index={item.index} measure={virtualizer.measureElement}
        renderState={renderState} isRowEditing={editingRowId === entry.row.id} navigation={navigation} />
    })}
  </tbody>
}

function DataTableRow<TData>({
  row,
  renderSubRow,
  isRowEditing,
  index, measure, navigation, virtual, minimumHeight, striped, logicalIndex,
}: {
  virtual?: boolean
  striped?: boolean
  logicalIndex?: number
  minimumHeight?: number
  renderState?: DataTableState
  index?: number
  measure?: (element: HTMLTableRowElement | null) => void
  navigation?: ReturnType<typeof useGridNavigation<TData>>
  row: Row<TData>
  renderSubRow?: (row: TData) => React.ReactNode
  isRowEditing?: boolean
}) {
  const { formattingRules } = useEditingContext<TData>()
  const expanded = row.getIsExpanded()
  const isSelected = row.getIsSelected()
  return (
    <>
      <tr role="row" style={virtual ? { position: "absolute", display: "flex", width: "100%", minHeight: minimumHeight } : undefined}
        ref={measure} data-index={index} aria-rowindex={index == null ? undefined : index + 2}
        data-row-editing={isRowEditing ? "true" : undefined}
        data-state={isSelected ? "selected" : undefined}
        className={cn(
          "group/row border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5",
          isRowEditing && "bg-amber-500/5",
          striped && (logicalIndex ?? index ?? row.index) % 2 === 1 && "bg-muted/25",
          row.depth > 0 && "bg-muted/20"
        )}
      >
        {row.getVisibleCells().map((cell) => {
          const meta = cell.column.columnDef.meta
          const isPinned = !!cell.column.getIsPinned()
          return (
            <td role="cell"
              key={cell.id}
              data-nav-cell={navigation ? "" : undefined} data-nav-row={row.id} data-nav-column={cell.column.id}
              tabIndex={navigation ? navigation.current?.row === row.id && navigation.current.column === cell.column.id ? 0 : -1 : undefined}
              onFocus={navigation ? event => { if (event.target === event.currentTarget) navigation.setActive({ row: row.id, column: cell.column.id }) } : undefined}
              style={{
                width: cell.column.getSize(),
                ...(virtual ? { flexShrink: 0, display: "flex", alignItems: "center", minWidth: 0, justifyContent: cell.column.id === "__actions" ? "flex-end" : meta?.align === "right" ? "flex-end" : meta?.align === "center" ? "center" : undefined } : {}),
                ...(!row.getIsGrouped() ? meta?.cellStyle?.(cell.getValue(), row.original) : {}),
                ...(!row.getIsGrouped() ? Object.assign({}, ...formattingRules?.filter(rule => (!rule.columnId || rule.columnId === cell.column.id) && matchesGridFilter(row.original as object, rule.filter)).map(rule => rule.style) ?? []) : {}),
                ...getPinningStyles(cell.column),
              }}
              className={cn(
                "px-2 py-1 align-middle text-sm outline-none focus-visible:bg-primary/10",
                isPinned &&
                  "bg-card group-hover/row:bg-[color-mix(in_oklab,var(--card),var(--muted)_40%)] group-data-[state=selected]/row:bg-[color-mix(in_oklab,var(--card),var(--primary)_5%)]",
                isPinned &&
                  isRowEditing &&
                  "bg-[color-mix(in_oklab,var(--card),#f59e0b_5%)]",
                meta?.cellClassName
              )}
            >
              {cell.getIsGrouped() ? <button type="button" className="inline-flex items-center gap-2 font-medium" onClick={row.getToggleExpandedHandler()} aria-expanded={row.getIsExpanded()} aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} group ${String(cell.getValue())}`}>
                {row.getIsExpanded() ? <ChevronDownIcon className="size-4"/> : <ChevronRightIcon className="size-4"/>}{String(cell.getValue() ?? 'Empty')} <span className="text-xs text-muted-foreground">({row.getLeafRows().filter(r=>!r.getIsGrouped()).length})</span></button>
              : row.getIsGrouped() ? cell.column.id.startsWith('__') || cell.getIsPlaceholder() ? null : cell.getIsAggregated() ? cell.column.columnDef.aggregatedCell ? flexRender(cell.column.columnDef.aggregatedCell,cell.getContext()) : String(cell.getValue() ?? '') : null
              : flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          )
        })}
      </tr>
      {expanded && !row.getIsGrouped() && renderSubRow && (
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

const MemoDataTableRow = memo(DataTableRow) as typeof DataTableRow

function renderSkeleton<T>(columns: TanstackTable<T>["getVisibleLeafColumns"] extends () => infer C ? C : never, rows: number, virtual: boolean) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr role="row" key={r} className="border-b" data-loading-row="" style={virtual ? {display:"flex",width:"100%"} : undefined}>
      {columns.map((column) => (
        <td role="cell" key={column.id} className="px-2 py-2" style={{width:column.getSize(),flexShrink:0,...getPinningStyles(column)}}>
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  ))
}
