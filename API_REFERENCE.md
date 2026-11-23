# Dynostack React Grid API reference

API for the 0.6.0 release. Regenerate with `node scripts/generate-api-docs.mjs`. Full usage examples are on the website docs and in ADVANCED_GRID.md.

## DataTableProps

```ts
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
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `format` | true | not supplied |  |
| `conditionalFormatting` | true | not supplied |  |
| `filterExpression` | true | not supplied | Nested cross-column filter. Server adapters receive this unchanged. |
| `direction` | true | not supplied |  |
| `summary` | true | not supplied | Server totals must be supplied explicitly; loaded pages cannot calculate query-wide totals. |
| `onExportXlsx` | true | not supplied |  |
| `enableKeyboardNavigation` | true | false |  |
| `virtualizeRows` | true | false |  |
| `virtualOverscan` | true | 8 | Extra rows mounted above/below the visible range. Default 8. |
| `virtualRowHeight` | true | density estimate (36 / 40 / 52 px) | Minimum row height and initial estimate in pixels; taller content is measured. |
| `initialGrouping` | true | not supplied |  |
| `manualGrouping` | true | not supplied | Group server-provided trees without grouping the loaded page. |
| `onRowsReorder` | true | not supplied | Commit a manual reorder of flat client rows in the current page. |
| `data` | true | not supplied |  |
| `columns` | false | not supplied |  |
| `dataSource` | true | disabled | Optional internal fetcher. Omit this when using controlled `data`. |
| `state` | true | internal state | Supplied slices are controlled; omitted slices remain internal. |
| `initialState` | true | not supplied |  |
| `onStateChange` | true | not supplied |  |
| `savedViews` | true | disabled | Named filter/layout profiles; browser persistence is opt-in. |
| `isLoading` | true | not supplied |  |
| `isFetching` | true | not supplied |  |
| `onRefresh` | true | not supplied |  |
| `totalRecords` | true | not supplied |  |
| `exportFileName` | true | "export" |  |
| `enableSelection` | true | true | Hide the row-selection checkbox column. |
| `renderSubRow` | true | not supplied | Render an expandable detail panel under the row. |
| `getSubRows` | true | not supplied | Use TanStack's built-in nested rows via this accessor. |
| `rowActions` | true | ["view", "edit", "duplicate", "delete"] |  |
| `customRowActions` | true | not supplied |  |
| `onRowAction` | true | not supplied |  |
| `onView` | true | not supplied | Handler for the built-in "View" action. If omitted, the grid still opens the View sheet (unless `viewSheet={false}`). Use this to also log, navigate, or fetch detail data when a user opens View. |
| `onDelete` | true | not supplied | Handler for the built-in "Delete" action. Fires *after* the user confirms in the delete modal (or immediately if `confirmDelete={false}`). If omitted, the grid only emits via `onRowAction("delete", row)`. |
| `viewSheet` | true | built-in panel | Configure the built-in View sheet — side, density, custom renderers. Pass `false` to disable; clicking "View" will then only fire `onView` / `onRowAction` without opening a sheet. |
| `confirmDelete` | true | true | Configure the delete confirmation modal. Pass `false` to disable it and fire delete handlers immediately. Pass an object to customize title, description, and button labels. Defaults to enabled with built-in copy. |
| `onCellEdit` | true | not supplied | Commit a cell. Return the persistence promise to retain its draft on failure. |
| `onRowSave` | true | not supplied | Commit a row. Return the persistence promise to retain its draft on failure. |
| `onAddRow` | true | not supplied | Build a fresh empty row when "Add row" is clicked. |
| `onBulkDelete` | true | not supplied | Bulk delete selected rows. |
| `initialPageSize` | true | 10 |  |
| `pageSizeOptions` | true | [10, 25, 50, 100] |  |
| `initialColumnPinning` | true | not supplied |  |
| `initialColumnVisibility` | true | not supplied |  |
| `initialSorting` | true | not supplied | Initial sort order. |
| `onSelectionChange` | true | not supplied | Observe selected row objects (loaded rows only in server mode). |
| `ariaLabel` | true | "Data table" | Accessible table name. |
| `striped` | true | false | Alternating row backgrounds. |
| `stickyHeader` | true | false | Keep headers visible inside a vertically constrained table. |
| `maxHeight` | true | 480px when virtualized; otherwise unconstrained | Scroll viewport height, e.g. "480px". |
| `globalFilter` | true | not supplied | Optional controlled global filter (for cross-tab persistence). |
| `onGlobalFilterChange` | true | not supplied |  |
| `className` | true | not supplied |  |
| `toolbarSlot` | true | not supplied |  |
| `features` | true | see DataTableFeatures | Toggle individual table features. |
| `labels` | true | not supplied | Override every user-facing string. |
| `density` | true | "default" | Row + cell padding density. Defaults to "default". |
| `theme` | true | not supplied | CSS-variable overrides (shadcn-compatible) scoped to this instance.  Two accepted shapes:    theme={{ primary: "...", accent: "..." }}              // flat tokens   theme={{ light: { ... }, dark: { ... } }}              // moded — auto-flips  Moded themes apply `light` always and swap to `dark` inside `@media (prefers-color-scheme: dark)` *and* inside any `.dark` ancestor.  Use `themePresets.violet` (or any preset) for a ready-made moded theme. |
| `isolate` | true | false | When `true`, the grid does NOT inherit CSS variables from the app's `:root` (shadcn, custom theme, etc.). Instead it renders with the package's bundled defaults (or whatever you pass via `theme`).  Useful when embedding the grid inside a heavily-themed shell where you want the table to keep its own look regardless of surrounding context.  Defaults to `false` (inherit app theme). |

## DataTableFeatures

```ts
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
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `grouping` | true |  | Toolbar global search input (default: true). |
| `search` | true |  |  |
| `refresh` | true |  | Toolbar refresh button (default: true when onRefresh is provided). |
| `columnVisibility` | true |  | Column visibility menu (default: true). |
| `export` | true |  | CSV / Excel export menu (default: true). |
| `addRow` | true |  | "Add row" toolbar button (default: true when onAddRow is provided). |
| `pagination` | true |  | Bottom pagination controls (default: true). |
| `sorting` | true |  | Sort headers (default: true). |
| `filtering` | true |  | Per-column filtering (default: true). |
| `resizing` | true |  | Column resizing handles (default: true). |
| `reordering` | true |  | Drag-to-reorder columns (default: true). |
| `pinning` | true |  | Pin / unpin column controls (default: true). |

## ColumnMeta

```ts
interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    editor?: CellEditorType
    renderEditor?: (props: CustomCellEditorProps<TData>) => ReactNode
    formatValue?: (value: unknown, row: TData) => ReactNode
    format?: { locale?: string; currency?: string; timeZone?: string }
    cellStyle?: (value: unknown, row: TData) => CSSProperties | undefined
    filterType?: FilterType
    selectOptions?: SelectOption[]
    align?: "left" | "right" | "center"
    cellClassName?: string
    headerClassName?: string
    exportable?: boolean
    /** Return an error message to reject a value. Row saves receive the merged draft. */
    validate?: (value: unknown, row: TData) => string | undefined | Promise<string | undefined>
    isEditable?: boolean | ((row: TData) => boolean)
    badgeMap?: Partial<Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline">>
  }
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `label` | true |  |  |
| `editor` | true |  |  |
| `renderEditor` | true |  |  |
| `formatValue` | true |  |  |
| `format` | true |  |  |
| `cellStyle` | true |  |  |
| `filterType` | true |  |  |
| `selectOptions` | true |  |  |
| `align` | true |  |  |
| `cellClassName` | true |  |  |
| `headerClassName` | true |  |  |
| `exportable` | true |  |  |
| `validate` | true |  | Return an error message to reject a value. Row saves receive the merged draft. |
| `isEditable` | true |  |  |
| `badgeMap` | true |  |  |

## DataTableState

```ts
export type DataTableState = {
  grouping?: string[]
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  columnVisibility: VisibilityState
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
  columnOrder: ColumnOrderState
  rowSelection: RowSelectionState
  expanded: ExpandedState
  pagination: PaginationState
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `grouping` | true |  |  |
| `sorting` | false |  |  |
| `columnFilters` | false |  |  |
| `globalFilter` | false |  |  |
| `columnVisibility` | false |  |  |
| `columnPinning` | false |  |  |
| `columnSizing` | false |  |  |
| `columnOrder` | false |  |  |
| `rowSelection` | false |  |  |
| `expanded` | false |  |  |
| `pagination` | false |  |  |

## DataTableDataSource

```ts
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
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `fetchRows` | false |  | Fetch rows internally. In "client" mode, return the full data set and the table applies client-side sort/filter/pagination. In "server" mode, return the current page and optionally `totalRecords`. |
| `mode` | true |  | "client" by default. Use "server" for API-side pagination/filter/sort. |
| `enabled` | true |  | Set false to pause fetching. |
| `initialData` | true |  | Optional rows to show before the first fetch resolves. |
| `deps` | true |  | Refetch when these external values change. Memoize this array. |
| `onError` | true |  | Called for load/refresh errors so apps can show a toast. |

## DataTableFetchParams

```ts
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
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `grouping` | true |  |  |
| `filterExpression` | true |  |  |
| `signal` | true |  |  |
| `pageIndex` | false |  |  |
| `pageSize` | false |  |  |
| `sorting` | false |  |  |
| `columnFilters` | false |  |  |
| `globalFilter` | false |  |  |

## DataTableDataSourceResult

```ts
export type DataTableDataSourceResult<TData> =
  | TData[]
  | {
      rows: TData[]
      totalRecords?: number
    }
```

## DataTableSavedViewsConfig

```ts
export type DataTableSavedViewsConfig = {
  initialViews?: DataTableSavedView[]
  views?: DataTableSavedView[]
  onViewsChange?: (views: DataTableSavedView[]) => void
  /** Opt-in browser persistence. Use a distinct key per dataset/schema. */
  storageKey?: string
  labels?: DataTableSavedViewLabels
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `initialViews` | true |  |  |
| `views` | true |  |  |
| `onViewsChange` | true |  |  |
| `storageKey` | true |  | Opt-in browser persistence. Use a distinct key per dataset/schema. |
| `labels` | true |  |  |

## DataTableSavedView

```ts
export type DataTableSavedView = { id: string; name: string; state: DataTableViewState }
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `id` | false |  |  |
| `name` | false |  |  |
| `state` | false |  |  |

## DataTableViewState

```ts
export type DataTableViewState = Pick<DataTableState, "grouping" | "sorting" | "columnFilters" | "globalFilter" | "columnVisibility" | "columnPinning" | "columnSizing" | "columnOrder">
```

## ViewSheetConfig

```ts
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
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `actions` | true |  | Show actions only when the corresponding table callback is available. |
| `width` | true |  |  |
| `side` | true |  | Side of the screen to slide in from. Defaults to "right". |
| `defaultDensity` | true |  | Initial layout density. Defaults to "compact" (more fields per row). |
| `hideDensityTabs` | true |  | Hide the density tabs entirely if you want a fixed layout. |
| `renderField` | true |  | Override how a field's value is rendered. |
| `renderHeader` | true |  | Custom header for the sheet. |
| `fields` | true |  | Filter / reorder which columns appear. Defaults to all visible columns. |
| `labels` | true |  | Override label / placeholder strings. |

## ViewSheetLabels

```ts
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
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `title` | true |  |  |
| `description` | true |  |  |
| `edit` | true |  |  |
| `delete` | true |  |  |
| `close` | true |  |  |
| `emptyValue` | true |  |  |
| `density` | true |  |  |

## ConfirmDeleteConfig

```ts
export type ConfirmDeleteConfig<TData> = {
  /** Modal title. Receives the same context the resolver receives. */
  title?: (ctx: ConfirmDeleteContext<TData>) => React.ReactNode
  /** Modal description / body. */
  description?: (ctx: ConfirmDeleteContext<TData>) => React.ReactNode
  /** Confirm button label. Defaults to "Delete". */
  confirmLabel?: string
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `title` | true |  | Modal title. Receives the same context the resolver receives. |
| `description` | true |  | Modal description / body. |
| `confirmLabel` | true |  | Confirm button label. Defaults to "Delete". |
| `cancelLabel` | true |  | Cancel button label. Defaults to "Cancel". |

## CustomRowAction

```ts
export type CustomRowAction<TData> = {
  id: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  show?: (row: TData) => boolean
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `id` | false |  |  |
| `label` | false |  |  |
| `icon` | true |  |  |
| `danger` | true |  |  |
| `show` | true |  |  |

## DataTableLabels

```ts
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
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `search` | true |  |  |
| `addRow` | true |  |  |
| `delete` | true |  |  |
| `clear` | true |  |  |
| `selected` | true |  |  |
| `refresh` | true |  |  |
| `columns` | true |  |  |
| `export` | true |  |  |
| `csv` | true |  |  |
| `excel` | true |  |  |
| `total` | true |  |  |
| `noData` | true |  |  |
| `noResults` | true |  |  |
| `loadError` | true |  |  |
| `retry` | true |  |  |
| `saving` | true |  |  |
| `saveError` | true |  |  |
| `validationError` | true |  |  |
| `refreshing` | true |  |  |
| `rowsPerPage` | true |  |  |
| `page` | true |  |  |
| `of` | true |  |  |

## AdvFilter

```ts
export type AdvFilter<Op extends string, V> = {
  c1: Condition<Op, V>
  combine?: Combine
  c2?: Condition<Op, V>
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `c1` | false |  |  |
| `combine` | true |  |  |
| `c2` | true |  |  |

## applyGridUpdates

```ts
applyGridUpdates<T extends { id: string | number }>(rows: T[], updates: GridUpdate<T>[], dirtyRowIds: readonly string[] = []): { rows: T[]; conflicts: GridUpdate<T>[]; }
```

## booleanFilterFn

```ts
booleanFilterFn: FilterFn<unknown>
```

## buildPreset

```ts
buildPreset(hue: number, chroma = 0.03): DataTableModedTheme
```

## CellEditorType

```ts
export type CellEditorType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "switch"
  | "checkbox"
```

## Combine

```ts
export type Combine = "AND" | "OR"
```

## Condition

```ts
export type Condition<Op extends string, V> = {
  op: Op
  v?: V
  v2?: V
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `op` | false |  |  |
| `v` | true |  |  |
| `v2` | true |  |  |

## ConfirmDeleteContext

```ts
export type ConfirmDeleteContext<TData> = {
  /** The rows being deleted. Single-row delete passes one row; bulk passes many. */
  rows: TData[]
  /** "single" when triggered from the row actions menu; "bulk" from the toolbar. */
  source: "single" | "bulk"
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `rows` | false |  | The rows being deleted. Single-row delete passes one row; bulk passes many. |
| `source` | false |  | "single" when triggered from the row actions menu; "bulk" from the toolbar. |

## createDataTableState

```ts
createDataTableState(initial: Partial<DataTableState> = {}): DataTableState
```

## createGridTransaction

```ts
createGridTransaction<T extends { id: string | number }>(rows: T[], patches: GridPatch[], options: {
  reason?: GridTransaction<T>["reason"];
  editable: (row: T, columnId: string) => boolean;
  validate?: (value: unknown, row: T, columnId: string) => string | undefined | Promise<string | undefined>;
}): Promise<GridTransaction<T>>
```

## createXlsxWorkbook

```ts
createXlsxWorkbook(sheets: XlsxSheet[]): Promise<Uint8Array>
```

## CustomCellEditorProps

```ts
export type CustomCellEditorProps<TData> = {
  value: unknown; row: TData; columnId: string; disabled?: boolean; errorId?: string;
  onChange: (value: unknown) => void; onCommit: (value: unknown) => void; onCancel: () => void;
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `value` | false |  |  |
| `row` | false |  |  |
| `columnId` | false |  |  |
| `disabled` | true |  |  |
| `errorId` | true |  |  |
| `onChange` | false |  |  |
| `onCommit` | false |  |  |
| `onCancel` | false |  |  |

## DataTableColumn

```ts
export type DataTableColumn<TData> = ColumnDef<TData>
```

## DataTableDensity

```ts
export type DataTableDensity = "compact" | "default" | "comfortable"
```

## DataTableErrorContext

```ts
export type DataTableErrorContext = {
  type: "load" | "refresh"
  message: string
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `type` | false |  |  |
| `message` | false |  |  |

## DataTableModedTheme

```ts
export type DataTableModedTheme = {
  light?: DataTableTokens
  dark?: DataTableTokens
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `light` | true |  |  |
| `dark` | true |  |  |

## DataTableRowActionsProps

```ts
export type DataTableRowActionsProps<TData> = {
  row: TData
  actions?: ("view" | "edit" | "duplicate" | "delete")[]
  customActions?: CustomRowAction<TData>[]
  onAction?: (action: RowActionId, row: TData) => void
  isEditing?: boolean
  isSaving?: boolean
  saveError?: string
  savingLabel?: string
  onSaveEdit?: () => void
  onCancelEdit?: () => void
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `row` | false |  |  |
| `actions` | true |  |  |
| `customActions` | true |  |  |
| `onAction` | true |  |  |
| `isEditing` | true |  |  |
| `isSaving` | true |  |  |
| `saveError` | true |  |  |
| `savingLabel` | true |  |  |
| `onSaveEdit` | true |  |  |
| `onCancelEdit` | true |  |  |

## DataTableSavedViewLabels

```ts
export type DataTableSavedViewLabels = Partial<Record<"choose" | "name" | "save" | "restore" | "rename" | "delete" | "reset" | "clear", string>>
```

## DataTableTheme

```ts
export type DataTableTheme = DataTableTokens | DataTableModedTheme
```

## DataTableThemeName

```ts
export type DataTableThemeName = keyof typeof themePresets
```

## DataTableTokens

```ts
export type DataTableTokens = {
  background?: string
  foreground?: string
  card?: string
  cardForeground?: string
  popover?: string
  popoverForeground?: string
  primary?: string
  primaryForeground?: string
  secondary?: string
  secondaryForeground?: string
  muted?: string
  mutedForeground?: string
  accent?: string
  accentForeground?: string
  destructive?: string
  destructiveForeground?: string
  border?: string
  input?: string
  ring?: string

  /** Border radius (e.g. "0.5rem"). */
  radius?: string
  /** Font family for the table body. */
  fontFamily?: string
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `background` | true |  |  |
| `foreground` | true |  |  |
| `card` | true |  |  |
| `cardForeground` | true |  |  |
| `popover` | true |  |  |
| `popoverForeground` | true |  |  |
| `primary` | true |  |  |
| `primaryForeground` | true |  |  |
| `secondary` | true |  |  |
| `secondaryForeground` | true |  |  |
| `muted` | true |  |  |
| `mutedForeground` | true |  |  |
| `accent` | true |  |  |
| `accentForeground` | true |  |  |
| `destructive` | true |  |  |
| `destructiveForeground` | true |  |  |
| `border` | true |  |  |
| `input` | true |  |  |
| `ring` | true |  |  |
| `radius` | true |  | Border radius (e.g. "0.5rem"). |
| `fontFamily` | true |  | Font family for the table body. |

## dateFilterFn

```ts
dateFilterFn: FilterFn<unknown>
```

## DateOp

```ts
export type DateOp =
  | "equals"
  | "notEqual"
  | "before"
  | "after"
  | "inRange"
  | "blank"
  | "notBlank"
```

## exportToCsv

```ts
exportToCsv<TData>(table: Table<TData>, fileName = "export"): void
```

## exportToExcel

```ts
exportToExcel<TData>(table: Table<TData>, fileName = "export"): void
```

## exportToXlsx

```ts
exportToXlsx<T>(table: Table<T>, fileName = "export", options: { sheetName?: string; additionalSheets?: XlsxSheet[]; formats?: Record<string, string> } = {}): Promise<void>
```

## FilterType

```ts
export type FilterType =
  | "text"
  | "number"
  | "select"
  | "multi-select"
  | "boolean"
  | "date"
```

## GridFilter

```ts
export type GridFilter = { operator: "and" | "or"; children: GridFilter[] } | {
  column: string; operator: "eq" | "ne" | "contains" | "gt" | "gte" | "lt" | "lte" | "in" | "empty"; value?: unknown
}
```

## GridPatch

```ts
export type GridPatch = { rowId: string; columnId: string; value: unknown }
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `rowId` | false |  |  |
| `columnId` | false |  |  |
| `value` | false |  |  |

## gridRangePatches

```ts
gridRangePatches<T extends { id: string | number }>(rows: T[], columns: string[], start: { row: number; column: number }, values: unknown[][]): GridPatch[]
```

## GridSelection

```ts
export type GridSelection = { mode: "ids"; ids: string[] } | { mode: "query"; queryKey: string; excludedIds: string[] }
```

## GridSummaryOperation

```ts
export type GridSummaryOperation = "sum" | "mean" | "min" | "max" | "count"
```

## GridTransaction

```ts
export type GridTransaction<T> = { before: T[]; after: T[]; patches: GridPatch[]; reason: "edit" | "bulk" | "paste" | "fill" | "undo" | "redo" }
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `before` | false |  |  |
| `after` | false |  |  |
| `patches` | false |  |  |
| `reason` | false |  |  |

## GridUpdate

```ts
export type GridUpdate<T> = { type: "upsert"; row: T } | { type: "delete"; id: string | number }
```

## isFilterActive

```ts
isFilterActive(filterType: string | undefined, value: unknown): boolean
```

## isGridRowSelected

```ts
isGridRowSelected(selection: GridSelection, id: string, queryKey: string): boolean
```

## ISOLATE_DARK_TOKENS

```ts
ISOLATE_DARK_TOKENS: DataTableTokens
```

## ISOLATE_LIGHT_TOKENS

```ts
ISOLATE_LIGHT_TOKENS: DataTableTokens
```

## matchesGridFilter

```ts
matchesGridFilter(row: object, filter: GridFilter, depth = 0): boolean
```

## numberFilterFn

```ts
numberFilterFn: FilterFn<unknown>
```

## NumberOp

```ts
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
```

## parseGridClipboard

```ts
parseGridClipboard(text: string): string[][]
```

## parseGridFilter

```ts
parseGridFilter(input: unknown, depth = 0): GridFilter
```

## PortalContainerContext

```ts
PortalContainerContext: Context<HTMLElement>
```

## replayGridTransaction

```ts
replayGridTransaction<T extends { id: string | number }>(rows: T[], transaction: GridTransaction<T>, direction: "undo" | "redo"): T[]
```

## RowAction

```ts
export type RowAction<TData> =
  | "view"
  | "edit"
  | "duplicate"
  | "delete"
  | { id: string; label: string; icon?: React.ReactNode; danger?: boolean; show?: (row: TData) => boolean }
```

## RowActionId

```ts
export type RowActionId = "view" | "edit" | "duplicate" | "delete" | string
```

## sanitizeSpreadsheetValue

```ts
sanitizeSpreadsheetValue(value: unknown): string
```

## SelectOption

```ts
export type SelectOption = { value: string; label: string }
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `value` | false |  |  |
| `label` | false |  |  |

## SetFilter

```ts
export type SetFilter = { selected: string[] }
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `selected` | false |  |  |

## setFilterFn

```ts
setFilterFn: FilterFn<unknown>
```

## splitTheme

```ts
splitTheme(theme?: DataTableTheme): {
  light: DataTableTokens | undefined
  dark: DataTableTokens | undefined
}
```

## summarizeGridValues

```ts
summarizeGridValues(values: unknown[], operation: GridSummaryOperation): number | null
```

## textFilterFn

```ts
textFilterFn: FilterFn<unknown>
```

## TextOp

```ts
export type TextOp =
  | "contains"
  | "notContains"
  | "equals"
  | "notEqual"
  | "startsWith"
  | "endsWith"
  | "blank"
  | "notBlank"
```

## themePresets

```ts
themePresets: { neutral: DataTableModedTheme; graphite: { light: { background: string; card: string; border: string; radius: string; fontFamily: string; foreground?: string; cardForeground?: string; ... 13 more ...; ring?: string; }; dark: { ...; }; }; ... 7 more ...; slate: DataTableModedTheme; }
```

## themeToStyle

```ts
themeToStyle(theme?: DataTableTheme): CSSProperties
```

## toggleGridRow

```ts
toggleGridRow(selection: GridSelection, id: string, selected: boolean, queryKey: string): GridSelection
```

## tokensToCssBlock

```ts
tokensToCssBlock(tokens?: DataTableTokens): string
```

## tokensToStyle

```ts
tokensToStyle(tokens?: DataTableTokens): CSSProperties
```

## useGridQuerySelection

```ts
useGridQuerySelection(options: { rowIds: readonly string[]; queryKey: string; totalRecords: number }): { selection: GridSelection; rowSelection: { [k: string]: boolean; }; selectedCount: number; selectQuery: () => void; clearSelection: () => void; onRowSelectionChange: (next: Record<string, boolean>) => void; }
```

## useGridTransactions

```ts
useGridTransactions<T extends { id: string | number }>(options: {
  rows: T[];
  onChange: (rows: T[]) => void;
  persist?: (transaction: GridTransaction<T>) => Promise<unknown>;
  editable: (row: T, columnId: string) => boolean;
  validate?: (value: unknown, row: T, columnId: string) => string | undefined | Promise<string | undefined>;
  historyLimit?: number;
}): { commit: (patches: GridPatch[], reason?: "edit" | "bulk" | "paste" | "fill" | "undo" | "redo") => Promise<void>; undo: () => Promise<void>; redo: () => Promise<void>; pending: boolean; error: string; canUndo: boolean; canRedo: boolean; clearHistory: () => void; }
```

## usePortalContainer

```ts
usePortalContainer(): HTMLElement | null
```

## ViewSheetDensity

```ts
export type ViewSheetDensity = "compact" | "relaxed" | "comfy"
```

## XlsxSheet

```ts
export type XlsxSheet = {
  name: string
  headers: string[]
  rows: (string | number | boolean | Date | null | undefined)[][]
  /** Excel number formats, by zero-based column index. */
  formats?: Record<number, string>
}
```

| Property | Optional | Default | Behavior |
| --- | --- | --- | --- |
| `name` | false |  |  |
| `headers` | false |  |  |
| `rows` | false |  |  |
| `formats` | true |  | Excel number formats, by zero-based column index. |
