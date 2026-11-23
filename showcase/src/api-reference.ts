// Generated from source declarations by scripts/generate-api-docs.mjs.
export const apiReference = [
  {
    "name": "DataTableProps",
    "file": "src/data-table.tsx",
    "definition": "export type DataTableProps<TData extends { id: string | number }> = {\r\n  format?: { locale?: string; currency?: string; timeZone?: string }\r\n  conditionalFormatting?: { filter: GridFilter; columnId?: string; style: React.CSSProperties }[]\r\n  /** Nested cross-column filter. Server adapters receive this unchanged. */\r\n  filterExpression?: GridFilter\r\n  direction?: \"ltr\" | \"rtl\"\r\n  /** Server totals must be supplied explicitly; loaded pages cannot calculate query-wide totals. */\r\n  summary?: { scope: \"page\" | \"filtered\" | \"server\"; columns: Record<string, GridSummaryOperation>; values?: Record<string, number | null>; label?: string }\r\n  onExportXlsx?: (table: TanstackTable<TData>, fileName: string) => Promise<unknown>\r\n  enableKeyboardNavigation?: boolean\r\n  virtualizeRows?: boolean\r\n  /** Extra rows mounted above/below the visible range. Default 8. */\r\n  virtualOverscan?: number\r\n  /** Minimum row height and initial estimate in pixels; taller content is measured. */\r\n  virtualRowHeight?: number\r\n  initialGrouping?: string[]\r\n  /** Group server-provided trees without grouping the loaded page. */\r\n  manualGrouping?: boolean\r\n  /** Commit a manual reorder of flat client rows in the current page. */\r\n  onRowsReorder?: (rows: TData[]) => void\r\n  data?: TData[]\r\n  columns: ColumnDef<TData>[]\r\n\r\n  /** Optional internal fetcher. Omit this when using controlled `data`. */\r\n  dataSource?: DataTableDataSource<TData>\r\n  /** Supplied slices are controlled; omitted slices remain internal. */\r\n  state?: Partial<DataTableState>\r\n  initialState?: Partial<DataTableState>\r\n  onStateChange?: (next: DataTableState) => void\r\n  /** Named filter/layout profiles; browser persistence is opt-in. */\r\n  savedViews?: DataTableSavedViewsConfig\r\n\r\n  isLoading?: boolean\r\n  isFetching?: boolean\r\n  onRefresh?: () => void\r\n\r\n  totalRecords?: number\r\n  exportFileName?: string\r\n\r\n  /** Hide the row-selection checkbox column. */\r\n  enableSelection?: boolean\r\n  /** Render an expandable detail panel under the row. */\r\n  renderSubRow?: (row: TData) => React.ReactNode\r\n  /** Use TanStack's built-in nested rows via this accessor. */\r\n  getSubRows?: (row: TData) => TData[] | undefined\r\n\r\n  rowActions?: (\"view\" | \"edit\" | \"duplicate\" | \"delete\")[]\r\n  customRowActions?: CustomRowAction<TData>[]\r\n  onRowAction?: (action: RowActionId, row: TData) => void\r\n  /**\r\n   * Handler for the built-in \"View\" action. If omitted, the grid still opens\r\n   * the View sheet (unless `viewSheet={false}`). Use this to also log,\r\n   * navigate, or fetch detail data when a user opens View.\r\n   */\r\n  onView?: (row: TData) => void\r\n  /**\r\n   * Handler for the built-in \"Delete\" action. Fires *after* the user confirms\r\n   * in the delete modal (or immediately if `confirmDelete={false}`).\r\n   * If omitted, the grid only emits via `onRowAction(\"delete\", row)`.\r\n   */\r\n  onDelete?: (row: TData) => void\r\n  /**\r\n   * Configure the built-in View sheet — side, density, custom renderers.\r\n   * Pass `false` to disable; clicking \"View\" will then only fire\r\n   * `onView` / `onRowAction` without opening a sheet.\r\n   */\r\n  viewSheet?: ViewSheetConfig<TData> | false\r\n  /**\r\n   * Configure the delete confirmation modal. Pass `false` to disable it and\r\n   * fire delete handlers immediately. Pass an object to customize title,\r\n   * description, and button labels. Defaults to enabled with built-in copy.\r\n   */\r\n  confirmDelete?: ConfirmDeleteConfig<TData> | boolean\r\n\r\n  /** Commit a cell. Return the persistence promise to retain its draft on failure. */\r\n  onCellEdit?: (row: TData, columnId: string, value: unknown) => void | Promise<unknown>\r\n  /** Commit a row. Return the persistence promise to retain its draft on failure. */\r\n  onRowSave?: (row: TData, draft: Partial<TData>) => void | Promise<unknown>\r\n  /** Build a fresh empty row when \"Add row\" is clicked. */\r\n  onAddRow?: () => Partial<TData>\r\n  /** Bulk delete selected rows. */\r\n  onBulkDelete?: (rows: TData[]) => void\r\n\r\n  initialPageSize?: number\r\n  pageSizeOptions?: number[]\r\n\r\n  initialColumnPinning?: ColumnPinningState\r\n  initialColumnVisibility?: VisibilityState\r\n  /** Initial sort order. */\r\n  initialSorting?: SortingState\r\n  /** Observe selected row objects (loaded rows only in server mode). */\r\n  onSelectionChange?: (rows: TData[]) => void\r\n  /** Accessible table name. */\r\n  ariaLabel?: string\r\n  /** Alternating row backgrounds. */\r\n  striped?: boolean\r\n  /** Keep headers visible inside a vertically constrained table. */\r\n  stickyHeader?: boolean\r\n  /** Scroll viewport height, e.g. \"480px\". */\r\n  maxHeight?: React.CSSProperties[\"maxHeight\"]\r\n\r\n  /** Optional controlled global filter (for cross-tab persistence). */\r\n  globalFilter?: string\r\n  onGlobalFilterChange?: (value: string) => void\r\n\r\n  className?: string\r\n  toolbarSlot?: React.ReactNode\r\n\r\n  /** Toggle individual table features. */\r\n  features?: DataTableFeatures\r\n  /** Override every user-facing string. */\r\n  labels?: DataTableLabels\r\n  /** Row + cell padding density. Defaults to \"default\". */\r\n  density?: DataTableDensity\r\n  /**\r\n   * CSS-variable overrides (shadcn-compatible) scoped to this instance.\r\n   *\r\n   * Two accepted shapes:\r\n   *\r\n   *   theme={{ primary: \"...\", accent: \"...\" }}              // flat tokens\r\n   *   theme={{ light: { ... }, dark: { ... } }}              // moded — auto-flips\r\n   *\r\n   * Moded themes apply `light` always and swap to `dark` inside\r\n   * `@media (prefers-color-scheme: dark)` *and* inside any `.dark` ancestor.\r\n   *\r\n   * Use `themePresets.violet` (or any preset) for a ready-made moded theme.\r\n   */\r\n  theme?: DataTableTheme\r\n  /**\r\n   * When `true`, the grid does NOT inherit CSS variables from the app's\r\n   * `:root` (shadcn, custom theme, etc.). Instead it renders with the\r\n   * package's bundled defaults (or whatever you pass via `theme`).\r\n   *\r\n   * Useful when embedding the grid inside a heavily-themed shell where you\r\n   * want the table to keep its own look regardless of surrounding context.\r\n   *\r\n   * Defaults to `false` (inherit app theme).\r\n   */\r\n  isolate?: boolean\r\n}",
    "props": [
      {
        "name": "format",
        "optional": true,
        "type": "{ locale?: string; currency?: string; timeZone?: string }",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "conditionalFormatting",
        "optional": true,
        "type": "{ filter: GridFilter; columnId?: string; style: React.CSSProperties }[]",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "filterExpression",
        "optional": true,
        "type": "GridFilter",
        "description": "Nested cross-column filter. Server adapters receive this unchanged.",
        "default": "not supplied"
      },
      {
        "name": "direction",
        "optional": true,
        "type": "\"ltr\" | \"rtl\"",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "summary",
        "optional": true,
        "type": "{ scope: \"page\" | \"filtered\" | \"server\"; columns: Record<string, GridSummaryOperation>; values?: Record<string, number | null>; label?: string }",
        "description": "Server totals must be supplied explicitly; loaded pages cannot calculate query-wide totals.",
        "default": "not supplied"
      },
      {
        "name": "onExportXlsx",
        "optional": true,
        "type": "(table: TanstackTable<TData>, fileName: string) => Promise<unknown>",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "enableKeyboardNavigation",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": "false"
      },
      {
        "name": "virtualizeRows",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": "false"
      },
      {
        "name": "virtualOverscan",
        "optional": true,
        "type": "number",
        "description": "Extra rows mounted above/below the visible range. Default 8.",
        "default": "8"
      },
      {
        "name": "virtualRowHeight",
        "optional": true,
        "type": "number",
        "description": "Minimum row height and initial estimate in pixels; taller content is measured.",
        "default": "density estimate (36 / 40 / 52 px)"
      },
      {
        "name": "initialGrouping",
        "optional": true,
        "type": "string[]",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "manualGrouping",
        "optional": true,
        "type": "boolean",
        "description": "Group server-provided trees without grouping the loaded page.",
        "default": "not supplied"
      },
      {
        "name": "onRowsReorder",
        "optional": true,
        "type": "(rows: TData[]) => void",
        "description": "Commit a manual reorder of flat client rows in the current page.",
        "default": "not supplied"
      },
      {
        "name": "data",
        "optional": true,
        "type": "TData[]",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "columns",
        "optional": false,
        "type": "ColumnDef<TData>[]",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "dataSource",
        "optional": true,
        "type": "DataTableDataSource<TData>",
        "description": "Optional internal fetcher. Omit this when using controlled `data`.",
        "default": "disabled"
      },
      {
        "name": "state",
        "optional": true,
        "type": "Partial<DataTableState>",
        "description": "Supplied slices are controlled; omitted slices remain internal.",
        "default": "internal state"
      },
      {
        "name": "initialState",
        "optional": true,
        "type": "Partial<DataTableState>",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "onStateChange",
        "optional": true,
        "type": "(next: DataTableState) => void",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "savedViews",
        "optional": true,
        "type": "DataTableSavedViewsConfig",
        "description": "Named filter/layout profiles; browser persistence is opt-in.",
        "default": "disabled"
      },
      {
        "name": "isLoading",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "isFetching",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "onRefresh",
        "optional": true,
        "type": "() => void",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "totalRecords",
        "optional": true,
        "type": "number",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "exportFileName",
        "optional": true,
        "type": "string",
        "description": "",
        "default": "\"export\""
      },
      {
        "name": "enableSelection",
        "optional": true,
        "type": "boolean",
        "description": "Hide the row-selection checkbox column.",
        "default": "true"
      },
      {
        "name": "renderSubRow",
        "optional": true,
        "type": "(row: TData) => React.ReactNode",
        "description": "Render an expandable detail panel under the row.",
        "default": "not supplied"
      },
      {
        "name": "getSubRows",
        "optional": true,
        "type": "(row: TData) => TData[] | undefined",
        "description": "Use TanStack's built-in nested rows via this accessor.",
        "default": "not supplied"
      },
      {
        "name": "rowActions",
        "optional": true,
        "type": "(\"view\" | \"edit\" | \"duplicate\" | \"delete\")[]",
        "description": "",
        "default": "[\"view\", \"edit\", \"duplicate\", \"delete\"]"
      },
      {
        "name": "customRowActions",
        "optional": true,
        "type": "CustomRowAction<TData>[]",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "onRowAction",
        "optional": true,
        "type": "(action: RowActionId, row: TData) => void",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "onView",
        "optional": true,
        "type": "(row: TData) => void",
        "description": "Handler for the built-in \"View\" action. If omitted, the grid still opens\r\nthe View sheet (unless `viewSheet={false}`). Use this to also log,\r\nnavigate, or fetch detail data when a user opens View.",
        "default": "not supplied"
      },
      {
        "name": "onDelete",
        "optional": true,
        "type": "(row: TData) => void",
        "description": "Handler for the built-in \"Delete\" action. Fires *after* the user confirms\r\nin the delete modal (or immediately if `confirmDelete={false}`).\r\nIf omitted, the grid only emits via `onRowAction(\"delete\", row)`.",
        "default": "not supplied"
      },
      {
        "name": "viewSheet",
        "optional": true,
        "type": "ViewSheetConfig<TData> | false",
        "description": "Configure the built-in View sheet — side, density, custom renderers.\r\nPass `false` to disable; clicking \"View\" will then only fire\r\n`onView` / `onRowAction` without opening a sheet.",
        "default": "built-in panel"
      },
      {
        "name": "confirmDelete",
        "optional": true,
        "type": "ConfirmDeleteConfig<TData> | boolean",
        "description": "Configure the delete confirmation modal. Pass `false` to disable it and\r\nfire delete handlers immediately. Pass an object to customize title,\r\ndescription, and button labels. Defaults to enabled with built-in copy.",
        "default": "true"
      },
      {
        "name": "onCellEdit",
        "optional": true,
        "type": "(row: TData, columnId: string, value: unknown) => void | Promise<unknown>",
        "description": "Commit a cell. Return the persistence promise to retain its draft on failure.",
        "default": "not supplied"
      },
      {
        "name": "onRowSave",
        "optional": true,
        "type": "(row: TData, draft: Partial<TData>) => void | Promise<unknown>",
        "description": "Commit a row. Return the persistence promise to retain its draft on failure.",
        "default": "not supplied"
      },
      {
        "name": "onAddRow",
        "optional": true,
        "type": "() => Partial<TData>",
        "description": "Build a fresh empty row when \"Add row\" is clicked.",
        "default": "not supplied"
      },
      {
        "name": "onBulkDelete",
        "optional": true,
        "type": "(rows: TData[]) => void",
        "description": "Bulk delete selected rows.",
        "default": "not supplied"
      },
      {
        "name": "initialPageSize",
        "optional": true,
        "type": "number",
        "description": "",
        "default": "10"
      },
      {
        "name": "pageSizeOptions",
        "optional": true,
        "type": "number[]",
        "description": "",
        "default": "[10, 25, 50, 100]"
      },
      {
        "name": "initialColumnPinning",
        "optional": true,
        "type": "ColumnPinningState",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "initialColumnVisibility",
        "optional": true,
        "type": "VisibilityState",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "initialSorting",
        "optional": true,
        "type": "SortingState",
        "description": "Initial sort order.",
        "default": "not supplied"
      },
      {
        "name": "onSelectionChange",
        "optional": true,
        "type": "(rows: TData[]) => void",
        "description": "Observe selected row objects (loaded rows only in server mode).",
        "default": "not supplied"
      },
      {
        "name": "ariaLabel",
        "optional": true,
        "type": "string",
        "description": "Accessible table name.",
        "default": "\"Data table\""
      },
      {
        "name": "striped",
        "optional": true,
        "type": "boolean",
        "description": "Alternating row backgrounds.",
        "default": "false"
      },
      {
        "name": "stickyHeader",
        "optional": true,
        "type": "boolean",
        "description": "Keep headers visible inside a vertically constrained table.",
        "default": "false"
      },
      {
        "name": "maxHeight",
        "optional": true,
        "type": "React.CSSProperties[\"maxHeight\"]",
        "description": "Scroll viewport height, e.g. \"480px\".",
        "default": "480px when virtualized; otherwise unconstrained"
      },
      {
        "name": "globalFilter",
        "optional": true,
        "type": "string",
        "description": "Optional controlled global filter (for cross-tab persistence).",
        "default": "not supplied"
      },
      {
        "name": "onGlobalFilterChange",
        "optional": true,
        "type": "(value: string) => void",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "className",
        "optional": true,
        "type": "string",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "toolbarSlot",
        "optional": true,
        "type": "React.ReactNode",
        "description": "",
        "default": "not supplied"
      },
      {
        "name": "features",
        "optional": true,
        "type": "DataTableFeatures",
        "description": "Toggle individual table features.",
        "default": "see DataTableFeatures"
      },
      {
        "name": "labels",
        "optional": true,
        "type": "DataTableLabels",
        "description": "Override every user-facing string.",
        "default": "not supplied"
      },
      {
        "name": "density",
        "optional": true,
        "type": "DataTableDensity",
        "description": "Row + cell padding density. Defaults to \"default\".",
        "default": "\"default\""
      },
      {
        "name": "theme",
        "optional": true,
        "type": "DataTableTheme",
        "description": "CSS-variable overrides (shadcn-compatible) scoped to this instance.\r\n\r\nTwo accepted shapes:\r\n\r\n  theme={{ primary: \"...\", accent: \"...\" }}              // flat tokens\r\n  theme={{ light: { ... }, dark: { ... } }}              // moded — auto-flips\r\n\r\nModed themes apply `light` always and swap to `dark` inside\r\n`@media (prefers-color-scheme: dark)` *and* inside any `.dark` ancestor.\r\n\r\nUse `themePresets.violet` (or any preset) for a ready-made moded theme.",
        "default": "not supplied"
      },
      {
        "name": "isolate",
        "optional": true,
        "type": "boolean",
        "description": "When `true`, the grid does NOT inherit CSS variables from the app's\r\n`:root` (shadcn, custom theme, etc.). Instead it renders with the\r\npackage's bundled defaults (or whatever you pass via `theme`).\r\n\r\nUseful when embedding the grid inside a heavily-themed shell where you\r\nwant the table to keep its own look regardless of surrounding context.\r\n\r\nDefaults to `false` (inherit app theme).",
        "default": "false"
      }
    ]
  },
  {
    "name": "DataTableFeatures",
    "file": "src/data-table.tsx",
    "definition": "export type DataTableFeatures = {\r\n  /** Toolbar global search input (default: true). */\r\n  grouping?: boolean\r\n  search?: boolean\r\n  /** Toolbar refresh button (default: true when onRefresh is provided). */\r\n  refresh?: boolean\r\n  /** Column visibility menu (default: true). */\r\n  columnVisibility?: boolean\r\n  /** CSV / Excel export menu (default: true). */\r\n  export?: boolean\r\n  /** \"Add row\" toolbar button (default: true when onAddRow is provided). */\r\n  addRow?: boolean\r\n  /** Bottom pagination controls (default: true). */\r\n  pagination?: boolean\r\n  /** Sort headers (default: true). */\r\n  sorting?: boolean\r\n  /** Per-column filtering (default: true). */\r\n  filtering?: boolean\r\n  /** Column resizing handles (default: true). */\r\n  resizing?: boolean\r\n  /** Drag-to-reorder columns (default: true). */\r\n  reordering?: boolean\r\n  /** Pin / unpin column controls (default: true). */\r\n  pinning?: boolean\r\n}",
    "props": [
      {
        "name": "grouping",
        "optional": true,
        "type": "boolean",
        "description": "Toolbar global search input (default: true).",
        "default": ""
      },
      {
        "name": "search",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": ""
      },
      {
        "name": "refresh",
        "optional": true,
        "type": "boolean",
        "description": "Toolbar refresh button (default: true when onRefresh is provided).",
        "default": ""
      },
      {
        "name": "columnVisibility",
        "optional": true,
        "type": "boolean",
        "description": "Column visibility menu (default: true).",
        "default": ""
      },
      {
        "name": "export",
        "optional": true,
        "type": "boolean",
        "description": "CSV / Excel export menu (default: true).",
        "default": ""
      },
      {
        "name": "addRow",
        "optional": true,
        "type": "boolean",
        "description": "\"Add row\" toolbar button (default: true when onAddRow is provided).",
        "default": ""
      },
      {
        "name": "pagination",
        "optional": true,
        "type": "boolean",
        "description": "Bottom pagination controls (default: true).",
        "default": ""
      },
      {
        "name": "sorting",
        "optional": true,
        "type": "boolean",
        "description": "Sort headers (default: true).",
        "default": ""
      },
      {
        "name": "filtering",
        "optional": true,
        "type": "boolean",
        "description": "Per-column filtering (default: true).",
        "default": ""
      },
      {
        "name": "resizing",
        "optional": true,
        "type": "boolean",
        "description": "Column resizing handles (default: true).",
        "default": ""
      },
      {
        "name": "reordering",
        "optional": true,
        "type": "boolean",
        "description": "Drag-to-reorder columns (default: true).",
        "default": ""
      },
      {
        "name": "pinning",
        "optional": true,
        "type": "boolean",
        "description": "Pin / unpin column controls (default: true).",
        "default": ""
      }
    ]
  },
  {
    "name": "ColumnMeta",
    "file": "src/types.ts",
    "definition": "interface ColumnMeta<TData extends RowData, TValue> {\r\n    label?: string\r\n    editor?: CellEditorType\r\n    renderEditor?: (props: CustomCellEditorProps<TData>) => ReactNode\r\n    formatValue?: (value: unknown, row: TData) => ReactNode\r\n    format?: { locale?: string; currency?: string; timeZone?: string }\r\n    cellStyle?: (value: unknown, row: TData) => CSSProperties | undefined\r\n    filterType?: FilterType\r\n    selectOptions?: SelectOption[]\r\n    align?: \"left\" | \"right\" | \"center\"\r\n    cellClassName?: string\r\n    headerClassName?: string\r\n    exportable?: boolean\r\n    /** Return an error message to reject a value. Row saves receive the merged draft. */\r\n    validate?: (value: unknown, row: TData) => string | undefined | Promise<string | undefined>\r\n    isEditable?: boolean | ((row: TData) => boolean)\r\n    badgeMap?: Partial<Record<string, \"default\" | \"secondary\" | \"destructive\" | \"success\" | \"warning\" | \"outline\">>\r\n  }",
    "props": [
      {
        "name": "label",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "editor",
        "optional": true,
        "type": "CellEditorType",
        "description": "",
        "default": ""
      },
      {
        "name": "renderEditor",
        "optional": true,
        "type": "(props: CustomCellEditorProps<TData>) => ReactNode",
        "description": "",
        "default": ""
      },
      {
        "name": "formatValue",
        "optional": true,
        "type": "(value: unknown, row: TData) => ReactNode",
        "description": "",
        "default": ""
      },
      {
        "name": "format",
        "optional": true,
        "type": "{ locale?: string; currency?: string; timeZone?: string }",
        "description": "",
        "default": ""
      },
      {
        "name": "cellStyle",
        "optional": true,
        "type": "(value: unknown, row: TData) => CSSProperties | undefined",
        "description": "",
        "default": ""
      },
      {
        "name": "filterType",
        "optional": true,
        "type": "FilterType",
        "description": "",
        "default": ""
      },
      {
        "name": "selectOptions",
        "optional": true,
        "type": "SelectOption[]",
        "description": "",
        "default": ""
      },
      {
        "name": "align",
        "optional": true,
        "type": "\"left\" | \"right\" | \"center\"",
        "description": "",
        "default": ""
      },
      {
        "name": "cellClassName",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "headerClassName",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "exportable",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": ""
      },
      {
        "name": "validate",
        "optional": true,
        "type": "(value: unknown, row: TData) => string | undefined | Promise<string | undefined>",
        "description": "Return an error message to reject a value. Row saves receive the merged draft.",
        "default": ""
      },
      {
        "name": "isEditable",
        "optional": true,
        "type": "boolean | ((row: TData) => boolean)",
        "description": "",
        "default": ""
      },
      {
        "name": "badgeMap",
        "optional": true,
        "type": "Partial<Record<string, \"default\" | \"secondary\" | \"destructive\" | \"success\" | \"warning\" | \"outline\">>",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableState",
    "file": "src/table-state.ts",
    "definition": "export type DataTableState = {\r\n  grouping?: string[]\r\n  sorting: SortingState\r\n  columnFilters: ColumnFiltersState\r\n  globalFilter: string\r\n  columnVisibility: VisibilityState\r\n  columnPinning: ColumnPinningState\r\n  columnSizing: ColumnSizingState\r\n  columnOrder: ColumnOrderState\r\n  rowSelection: RowSelectionState\r\n  expanded: ExpandedState\r\n  pagination: PaginationState\r\n}",
    "props": [
      {
        "name": "grouping",
        "optional": true,
        "type": "string[]",
        "description": "",
        "default": ""
      },
      {
        "name": "sorting",
        "optional": false,
        "type": "SortingState",
        "description": "",
        "default": ""
      },
      {
        "name": "columnFilters",
        "optional": false,
        "type": "ColumnFiltersState",
        "description": "",
        "default": ""
      },
      {
        "name": "globalFilter",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "columnVisibility",
        "optional": false,
        "type": "VisibilityState",
        "description": "",
        "default": ""
      },
      {
        "name": "columnPinning",
        "optional": false,
        "type": "ColumnPinningState",
        "description": "",
        "default": ""
      },
      {
        "name": "columnSizing",
        "optional": false,
        "type": "ColumnSizingState",
        "description": "",
        "default": ""
      },
      {
        "name": "columnOrder",
        "optional": false,
        "type": "ColumnOrderState",
        "description": "",
        "default": ""
      },
      {
        "name": "rowSelection",
        "optional": false,
        "type": "RowSelectionState",
        "description": "",
        "default": ""
      },
      {
        "name": "expanded",
        "optional": false,
        "type": "ExpandedState",
        "description": "",
        "default": ""
      },
      {
        "name": "pagination",
        "optional": false,
        "type": "PaginationState",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableDataSource",
    "file": "src/data-table.tsx",
    "definition": "export type DataTableDataSource<TData> = {\r\n  /**\r\n   * Fetch rows internally. In \"client\" mode, return the full data set and the\r\n   * table applies client-side sort/filter/pagination. In \"server\" mode, return\r\n   * the current page and optionally `totalRecords`.\r\n   */\r\n  fetchRows: (\r\n    params: DataTableFetchParams\r\n  ) => Promise<DataTableDataSourceResult<TData>>\r\n  /** \"client\" by default. Use \"server\" for API-side pagination/filter/sort. */\r\n  mode?: \"client\" | \"server\"\r\n  /** Set false to pause fetching. */\r\n  enabled?: boolean\r\n  /** Optional rows to show before the first fetch resolves. */\r\n  initialData?: TData[]\r\n  /** Refetch when these external values change. Memoize this array. */\r\n  deps?: readonly unknown[]\r\n  /** Called for load/refresh errors so apps can show a toast. */\r\n  onError?: (error: unknown, context: DataTableErrorContext) => void\r\n}",
    "props": [
      {
        "name": "fetchRows",
        "optional": false,
        "type": "(\r\n    params: DataTableFetchParams\r\n  ) => Promise<DataTableDataSourceResult<TData>>",
        "description": "Fetch rows internally. In \"client\" mode, return the full data set and the\r\ntable applies client-side sort/filter/pagination. In \"server\" mode, return\r\nthe current page and optionally `totalRecords`.",
        "default": ""
      },
      {
        "name": "mode",
        "optional": true,
        "type": "\"client\" | \"server\"",
        "description": "\"client\" by default. Use \"server\" for API-side pagination/filter/sort.",
        "default": ""
      },
      {
        "name": "enabled",
        "optional": true,
        "type": "boolean",
        "description": "Set false to pause fetching.",
        "default": ""
      },
      {
        "name": "initialData",
        "optional": true,
        "type": "TData[]",
        "description": "Optional rows to show before the first fetch resolves.",
        "default": ""
      },
      {
        "name": "deps",
        "optional": true,
        "type": "readonly unknown[]",
        "description": "Refetch when these external values change. Memoize this array.",
        "default": ""
      },
      {
        "name": "onError",
        "optional": true,
        "type": "(error: unknown, context: DataTableErrorContext) => void",
        "description": "Called for load/refresh errors so apps can show a toast.",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableFetchParams",
    "file": "src/data-table.tsx",
    "definition": "export type DataTableFetchParams = {\r\n  grouping?: string[]\r\n  filterExpression?: GridFilter\r\n  signal?: AbortSignal\r\n  pageIndex: number\r\n  pageSize: number\r\n  sorting: SortingState\r\n  columnFilters: ColumnFiltersState\r\n  globalFilter: string\r\n}",
    "props": [
      {
        "name": "grouping",
        "optional": true,
        "type": "string[]",
        "description": "",
        "default": ""
      },
      {
        "name": "filterExpression",
        "optional": true,
        "type": "GridFilter",
        "description": "",
        "default": ""
      },
      {
        "name": "signal",
        "optional": true,
        "type": "AbortSignal",
        "description": "",
        "default": ""
      },
      {
        "name": "pageIndex",
        "optional": false,
        "type": "number",
        "description": "",
        "default": ""
      },
      {
        "name": "pageSize",
        "optional": false,
        "type": "number",
        "description": "",
        "default": ""
      },
      {
        "name": "sorting",
        "optional": false,
        "type": "SortingState",
        "description": "",
        "default": ""
      },
      {
        "name": "columnFilters",
        "optional": false,
        "type": "ColumnFiltersState",
        "description": "",
        "default": ""
      },
      {
        "name": "globalFilter",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableDataSourceResult",
    "file": "src/data-table.tsx",
    "definition": "export type DataTableDataSourceResult<TData> =\r\n  | TData[]\r\n  | {\r\n      rows: TData[]\r\n      totalRecords?: number\r\n    }",
    "props": []
  },
  {
    "name": "DataTableSavedViewsConfig",
    "file": "src/saved-views.tsx",
    "definition": "export type DataTableSavedViewsConfig = {\r\n  initialViews?: DataTableSavedView[]\r\n  views?: DataTableSavedView[]\r\n  onViewsChange?: (views: DataTableSavedView[]) => void\r\n  /** Opt-in browser persistence. Use a distinct key per dataset/schema. */\r\n  storageKey?: string\r\n  labels?: DataTableSavedViewLabels\r\n}",
    "props": [
      {
        "name": "initialViews",
        "optional": true,
        "type": "DataTableSavedView[]",
        "description": "",
        "default": ""
      },
      {
        "name": "views",
        "optional": true,
        "type": "DataTableSavedView[]",
        "description": "",
        "default": ""
      },
      {
        "name": "onViewsChange",
        "optional": true,
        "type": "(views: DataTableSavedView[]) => void",
        "description": "",
        "default": ""
      },
      {
        "name": "storageKey",
        "optional": true,
        "type": "string",
        "description": "Opt-in browser persistence. Use a distinct key per dataset/schema.",
        "default": ""
      },
      {
        "name": "labels",
        "optional": true,
        "type": "DataTableSavedViewLabels",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableSavedView",
    "file": "src/saved-views.tsx",
    "definition": "export type DataTableSavedView = { id: string; name: string; state: DataTableViewState }",
    "props": [
      {
        "name": "id",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "name",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "state",
        "optional": false,
        "type": "DataTableViewState",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableViewState",
    "file": "src/saved-views.tsx",
    "definition": "export type DataTableViewState = Pick<DataTableState, \"grouping\" | \"sorting\" | \"columnFilters\" | \"globalFilter\" | \"columnVisibility\" | \"columnPinning\" | \"columnSizing\" | \"columnOrder\">",
    "props": []
  },
  {
    "name": "ViewSheetConfig",
    "file": "src/data-table-view-sheet.tsx",
    "definition": "export type ViewSheetConfig<TData> = {\r\n  /** Show actions only when the corresponding table callback is available. */\r\n  actions?: { edit?: boolean; delete?: boolean }\r\n  width?: React.CSSProperties[\"width\"]\r\n  /** Side of the screen to slide in from. Defaults to \"right\". */\r\n  side?: SheetSide\r\n  /** Initial layout density. Defaults to \"compact\" (more fields per row). */\r\n  defaultDensity?: ViewSheetDensity\r\n  /** Hide the density tabs entirely if you want a fixed layout. */\r\n  hideDensityTabs?: boolean\r\n  /** Override how a field's value is rendered. */\r\n  renderField?: (args: {\r\n    column: Column<TData, unknown>\r\n    value: unknown\r\n    row: TData\r\n  }) => React.ReactNode\r\n  /** Custom header for the sheet. */\r\n  renderHeader?: (row: TData) => React.ReactNode\r\n  /** Filter / reorder which columns appear. Defaults to all visible columns. */\r\n  fields?: string[]\r\n  /** Override label / placeholder strings. */\r\n  labels?: ViewSheetLabels\r\n}",
    "props": [
      {
        "name": "actions",
        "optional": true,
        "type": "{ edit?: boolean; delete?: boolean }",
        "description": "Show actions only when the corresponding table callback is available.",
        "default": ""
      },
      {
        "name": "width",
        "optional": true,
        "type": "React.CSSProperties[\"width\"]",
        "description": "",
        "default": ""
      },
      {
        "name": "side",
        "optional": true,
        "type": "SheetSide",
        "description": "Side of the screen to slide in from. Defaults to \"right\".",
        "default": ""
      },
      {
        "name": "defaultDensity",
        "optional": true,
        "type": "ViewSheetDensity",
        "description": "Initial layout density. Defaults to \"compact\" (more fields per row).",
        "default": ""
      },
      {
        "name": "hideDensityTabs",
        "optional": true,
        "type": "boolean",
        "description": "Hide the density tabs entirely if you want a fixed layout.",
        "default": ""
      },
      {
        "name": "renderField",
        "optional": true,
        "type": "(args: {\r\n    column: Column<TData, unknown>\r\n    value: unknown\r\n    row: TData\r\n  }) => React.ReactNode",
        "description": "Override how a field's value is rendered.",
        "default": ""
      },
      {
        "name": "renderHeader",
        "optional": true,
        "type": "(row: TData) => React.ReactNode",
        "description": "Custom header for the sheet.",
        "default": ""
      },
      {
        "name": "fields",
        "optional": true,
        "type": "string[]",
        "description": "Filter / reorder which columns appear. Defaults to all visible columns.",
        "default": ""
      },
      {
        "name": "labels",
        "optional": true,
        "type": "ViewSheetLabels",
        "description": "Override label / placeholder strings.",
        "default": ""
      }
    ]
  },
  {
    "name": "ViewSheetLabels",
    "file": "src/data-table-view-sheet.tsx",
    "definition": "export type ViewSheetLabels = {\r\n  title?: (row: any) => React.ReactNode\r\n  description?: (row: any) => React.ReactNode\r\n  edit?: string\r\n  delete?: string\r\n  close?: string\r\n  emptyValue?: string\r\n  density?: {\r\n    compact?: string\r\n    relaxed?: string\r\n    comfy?: string\r\n  }\r\n}",
    "props": [
      {
        "name": "title",
        "optional": true,
        "type": "(row: any) => React.ReactNode",
        "description": "",
        "default": ""
      },
      {
        "name": "description",
        "optional": true,
        "type": "(row: any) => React.ReactNode",
        "description": "",
        "default": ""
      },
      {
        "name": "edit",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "delete",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "close",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "emptyValue",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "density",
        "optional": true,
        "type": "{\r\n    compact?: string\r\n    relaxed?: string\r\n    comfy?: string\r\n  }",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "ConfirmDeleteConfig",
    "file": "src/data-table-confirm-delete.tsx",
    "definition": "export type ConfirmDeleteConfig<TData> = {\n  /** Modal title. Receives the same context the resolver receives. */\n  title?: (ctx: ConfirmDeleteContext<TData>) => React.ReactNode\n  /** Modal description / body. */\n  description?: (ctx: ConfirmDeleteContext<TData>) => React.ReactNode\n  /** Confirm button label. Defaults to \"Delete\". */\n  confirmLabel?: string\n  /** Cancel button label. Defaults to \"Cancel\". */\n  cancelLabel?: string\n}",
    "props": [
      {
        "name": "title",
        "optional": true,
        "type": "(ctx: ConfirmDeleteContext<TData>) => React.ReactNode",
        "description": "Modal title. Receives the same context the resolver receives.",
        "default": ""
      },
      {
        "name": "description",
        "optional": true,
        "type": "(ctx: ConfirmDeleteContext<TData>) => React.ReactNode",
        "description": "Modal description / body.",
        "default": ""
      },
      {
        "name": "confirmLabel",
        "optional": true,
        "type": "string",
        "description": "Confirm button label. Defaults to \"Delete\".",
        "default": ""
      },
      {
        "name": "cancelLabel",
        "optional": true,
        "type": "string",
        "description": "Cancel button label. Defaults to \"Cancel\".",
        "default": ""
      }
    ]
  },
  {
    "name": "CustomRowAction",
    "file": "src/data-table-row-actions.tsx",
    "definition": "export type CustomRowAction<TData> = {\r\n  id: string\r\n  label: string\r\n  icon?: React.ReactNode\r\n  danger?: boolean\r\n  show?: (row: TData) => boolean\r\n}",
    "props": [
      {
        "name": "id",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "label",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "icon",
        "optional": true,
        "type": "React.ReactNode",
        "description": "",
        "default": ""
      },
      {
        "name": "danger",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": ""
      },
      {
        "name": "show",
        "optional": true,
        "type": "(row: TData) => boolean",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableLabels",
    "file": "src/data-table.tsx",
    "definition": "export type DataTableLabels = {\r\n  search?: string\r\n  addRow?: string\r\n  delete?: string\r\n  clear?: string\r\n  selected?: string\r\n  refresh?: string\r\n  columns?: string\r\n  export?: string\r\n  csv?: string\r\n  excel?: string\r\n  total?: string\r\n  noData?: string\r\n  noResults?: string\r\n  loadError?: string\r\n  retry?: string\r\n  saving?: string\r\n  saveError?: string\r\n  validationError?: string\r\n  refreshing?: string\r\n  rowsPerPage?: string\r\n  page?: string\r\n  of?: string\r\n}",
    "props": [
      {
        "name": "search",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "addRow",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "delete",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "clear",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "selected",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "refresh",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "columns",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "export",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "csv",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "excel",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "total",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "noData",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "noResults",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "loadError",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "retry",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "saving",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "saveError",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "validationError",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "refreshing",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "rowsPerPage",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "page",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "of",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "AdvFilter",
    "file": "src/filters.tsx",
    "definition": "export type AdvFilter<Op extends string, V> = {\n  c1: Condition<Op, V>\n  combine?: Combine\n  c2?: Condition<Op, V>\n}",
    "props": [
      {
        "name": "c1",
        "optional": false,
        "type": "Condition<Op, V>",
        "description": "",
        "default": ""
      },
      {
        "name": "combine",
        "optional": true,
        "type": "Combine",
        "description": "",
        "default": ""
      },
      {
        "name": "c2",
        "optional": true,
        "type": "Condition<Op, V>",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "applyGridUpdates",
    "file": "src/grid-operations.ts",
    "definition": "applyGridUpdates<T extends { id: string | number }>(rows: T[], updates: GridUpdate<T>[], dirtyRowIds: readonly string[] = []): { rows: T[]; conflicts: GridUpdate<T>[]; }",
    "props": []
  },
  {
    "name": "booleanFilterFn",
    "file": "src/filters.tsx",
    "definition": "booleanFilterFn: FilterFn<unknown>",
    "props": []
  },
  {
    "name": "buildPreset",
    "file": "src/theme.ts",
    "definition": "buildPreset(hue: number, chroma = 0.03): DataTableModedTheme",
    "props": []
  },
  {
    "name": "CellEditorType",
    "file": "src/types.ts",
    "definition": "export type CellEditorType =\r\n  | \"text\"\r\n  | \"number\"\r\n  | \"currency\"\r\n  | \"date\"\r\n  | \"select\"\r\n  | \"switch\"\r\n  | \"checkbox\"",
    "props": []
  },
  {
    "name": "Combine",
    "file": "src/filters.tsx",
    "definition": "export type Combine = \"AND\" | \"OR\"",
    "props": []
  },
  {
    "name": "Condition",
    "file": "src/filters.tsx",
    "definition": "export type Condition<Op extends string, V> = {\n  op: Op\n  v?: V\n  v2?: V\n}",
    "props": [
      {
        "name": "op",
        "optional": false,
        "type": "Op",
        "description": "",
        "default": ""
      },
      {
        "name": "v",
        "optional": true,
        "type": "V",
        "description": "",
        "default": ""
      },
      {
        "name": "v2",
        "optional": true,
        "type": "V",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "ConfirmDeleteContext",
    "file": "src/data-table-confirm-delete.tsx",
    "definition": "export type ConfirmDeleteContext<TData> = {\n  /** The rows being deleted. Single-row delete passes one row; bulk passes many. */\n  rows: TData[]\n  /** \"single\" when triggered from the row actions menu; \"bulk\" from the toolbar. */\n  source: \"single\" | \"bulk\"\n}",
    "props": [
      {
        "name": "rows",
        "optional": false,
        "type": "TData[]",
        "description": "The rows being deleted. Single-row delete passes one row; bulk passes many.",
        "default": ""
      },
      {
        "name": "source",
        "optional": false,
        "type": "\"single\" | \"bulk\"",
        "description": "\"single\" when triggered from the row actions menu; \"bulk\" from the toolbar.",
        "default": ""
      }
    ]
  },
  {
    "name": "createDataTableState",
    "file": "src/table-state.ts",
    "definition": "createDataTableState(initial: Partial<DataTableState> = {}): DataTableState",
    "props": []
  },
  {
    "name": "createGridTransaction",
    "file": "src/grid-operations.ts",
    "definition": "createGridTransaction<T extends { id: string | number }>(rows: T[], patches: GridPatch[], options: {\r\n  reason?: GridTransaction<T>[\"reason\"];\r\n  editable: (row: T, columnId: string) => boolean;\r\n  validate?: (value: unknown, row: T, columnId: string) => string | undefined | Promise<string | undefined>;\r\n}): Promise<GridTransaction<T>>",
    "props": []
  },
  {
    "name": "createXlsxWorkbook",
    "file": "src/xlsx.ts",
    "definition": "createXlsxWorkbook(sheets: XlsxSheet[]): Promise<Uint8Array>",
    "props": []
  },
  {
    "name": "CustomCellEditorProps",
    "file": "src/types.ts",
    "definition": "export type CustomCellEditorProps<TData> = {\r\n  value: unknown; row: TData; columnId: string; disabled?: boolean; errorId?: string;\r\n  onChange: (value: unknown) => void; onCommit: (value: unknown) => void; onCancel: () => void;\r\n}",
    "props": [
      {
        "name": "value",
        "optional": false,
        "type": "unknown",
        "description": "",
        "default": ""
      },
      {
        "name": "row",
        "optional": false,
        "type": "TData",
        "description": "",
        "default": ""
      },
      {
        "name": "columnId",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "disabled",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": ""
      },
      {
        "name": "errorId",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "onChange",
        "optional": false,
        "type": "(value: unknown) => void",
        "description": "",
        "default": ""
      },
      {
        "name": "onCommit",
        "optional": false,
        "type": "(value: unknown) => void",
        "description": "",
        "default": ""
      },
      {
        "name": "onCancel",
        "optional": false,
        "type": "() => void",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableColumn",
    "file": "src/types.ts",
    "definition": "export type DataTableColumn<TData> = ColumnDef<TData>",
    "props": []
  },
  {
    "name": "DataTableDensity",
    "file": "src/data-table.tsx",
    "definition": "export type DataTableDensity = \"compact\" | \"default\" | \"comfortable\"",
    "props": []
  },
  {
    "name": "DataTableErrorContext",
    "file": "src/data-table.tsx",
    "definition": "export type DataTableErrorContext = {\r\n  type: \"load\" | \"refresh\"\r\n  message: string\r\n}",
    "props": [
      {
        "name": "type",
        "optional": false,
        "type": "\"load\" | \"refresh\"",
        "description": "",
        "default": ""
      },
      {
        "name": "message",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableModedTheme",
    "file": "src/theme.ts",
    "definition": "export type DataTableModedTheme = {\n  light?: DataTableTokens\n  dark?: DataTableTokens\n}",
    "props": [
      {
        "name": "light",
        "optional": true,
        "type": "DataTableTokens",
        "description": "",
        "default": ""
      },
      {
        "name": "dark",
        "optional": true,
        "type": "DataTableTokens",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableRowActionsProps",
    "file": "src/data-table-row-actions.tsx",
    "definition": "export type DataTableRowActionsProps<TData> = {\r\n  row: TData\r\n  actions?: (\"view\" | \"edit\" | \"duplicate\" | \"delete\")[]\r\n  customActions?: CustomRowAction<TData>[]\r\n  onAction?: (action: RowActionId, row: TData) => void\r\n  isEditing?: boolean\r\n  isSaving?: boolean\r\n  saveError?: string\r\n  savingLabel?: string\r\n  onSaveEdit?: () => void\r\n  onCancelEdit?: () => void\r\n}",
    "props": [
      {
        "name": "row",
        "optional": false,
        "type": "TData",
        "description": "",
        "default": ""
      },
      {
        "name": "actions",
        "optional": true,
        "type": "(\"view\" | \"edit\" | \"duplicate\" | \"delete\")[]",
        "description": "",
        "default": ""
      },
      {
        "name": "customActions",
        "optional": true,
        "type": "CustomRowAction<TData>[]",
        "description": "",
        "default": ""
      },
      {
        "name": "onAction",
        "optional": true,
        "type": "(action: RowActionId, row: TData) => void",
        "description": "",
        "default": ""
      },
      {
        "name": "isEditing",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": ""
      },
      {
        "name": "isSaving",
        "optional": true,
        "type": "boolean",
        "description": "",
        "default": ""
      },
      {
        "name": "saveError",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "savingLabel",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "onSaveEdit",
        "optional": true,
        "type": "() => void",
        "description": "",
        "default": ""
      },
      {
        "name": "onCancelEdit",
        "optional": true,
        "type": "() => void",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "DataTableSavedViewLabels",
    "file": "src/saved-views.tsx",
    "definition": "export type DataTableSavedViewLabels = Partial<Record<\"choose\" | \"name\" | \"save\" | \"restore\" | \"rename\" | \"delete\" | \"reset\" | \"clear\", string>>",
    "props": []
  },
  {
    "name": "DataTableTheme",
    "file": "src/theme.ts",
    "definition": "export type DataTableTheme = DataTableTokens | DataTableModedTheme",
    "props": []
  },
  {
    "name": "DataTableThemeName",
    "file": "src/theme.ts",
    "definition": "export type DataTableThemeName = keyof typeof themePresets",
    "props": []
  },
  {
    "name": "DataTableTokens",
    "file": "src/theme.ts",
    "definition": "export type DataTableTokens = {\n  background?: string\n  foreground?: string\n  card?: string\n  cardForeground?: string\n  popover?: string\n  popoverForeground?: string\n  primary?: string\n  primaryForeground?: string\n  secondary?: string\n  secondaryForeground?: string\n  muted?: string\n  mutedForeground?: string\n  accent?: string\n  accentForeground?: string\n  destructive?: string\n  destructiveForeground?: string\n  border?: string\n  input?: string\n  ring?: string\n\n  /** Border radius (e.g. \"0.5rem\"). */\n  radius?: string\n  /** Font family for the table body. */\n  fontFamily?: string\n}",
    "props": [
      {
        "name": "background",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "foreground",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "card",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "cardForeground",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "popover",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "popoverForeground",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "primary",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "primaryForeground",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "secondary",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "secondaryForeground",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "muted",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "mutedForeground",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "accent",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "accentForeground",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "destructive",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "destructiveForeground",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "border",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "input",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "ring",
        "optional": true,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "radius",
        "optional": true,
        "type": "string",
        "description": "Border radius (e.g. \"0.5rem\").",
        "default": ""
      },
      {
        "name": "fontFamily",
        "optional": true,
        "type": "string",
        "description": "Font family for the table body.",
        "default": ""
      }
    ]
  },
  {
    "name": "dateFilterFn",
    "file": "src/filters.tsx",
    "definition": "dateFilterFn: FilterFn<unknown>",
    "props": []
  },
  {
    "name": "DateOp",
    "file": "src/filters.tsx",
    "definition": "export type DateOp =\n  | \"equals\"\n  | \"notEqual\"\n  | \"before\"\n  | \"after\"\n  | \"inRange\"\n  | \"blank\"\n  | \"notBlank\"",
    "props": []
  },
  {
    "name": "exportToCsv",
    "file": "src/export.ts",
    "definition": "exportToCsv<TData>(table: Table<TData>, fileName = \"export\"): void",
    "props": []
  },
  {
    "name": "exportToExcel",
    "file": "src/export.ts",
    "definition": "exportToExcel<TData>(table: Table<TData>, fileName = \"export\"): void",
    "props": []
  },
  {
    "name": "exportToXlsx",
    "file": "src/xlsx.ts",
    "definition": "exportToXlsx<T>(table: Table<T>, fileName = \"export\", options: { sheetName?: string; additionalSheets?: XlsxSheet[]; formats?: Record<string, string> } = {}): Promise<void>",
    "props": []
  },
  {
    "name": "FilterType",
    "file": "src/types.ts",
    "definition": "export type FilterType =\r\n  | \"text\"\r\n  | \"number\"\r\n  | \"select\"\r\n  | \"multi-select\"\r\n  | \"boolean\"\r\n  | \"date\"",
    "props": []
  },
  {
    "name": "GridFilter",
    "file": "src/grid-operations.ts",
    "definition": "export type GridFilter = { operator: \"and\" | \"or\"; children: GridFilter[] } | {\r\n  column: string; operator: \"eq\" | \"ne\" | \"contains\" | \"gt\" | \"gte\" | \"lt\" | \"lte\" | \"in\" | \"empty\"; value?: unknown\r\n}",
    "props": []
  },
  {
    "name": "GridPatch",
    "file": "src/grid-operations.ts",
    "definition": "export type GridPatch = { rowId: string; columnId: string; value: unknown }",
    "props": [
      {
        "name": "rowId",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "columnId",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "value",
        "optional": false,
        "type": "unknown",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "gridRangePatches",
    "file": "src/grid-operations.ts",
    "definition": "gridRangePatches<T extends { id: string | number }>(rows: T[], columns: string[], start: { row: number; column: number }, values: unknown[][]): GridPatch[]",
    "props": []
  },
  {
    "name": "GridSelection",
    "file": "src/grid-operations.ts",
    "definition": "export type GridSelection = { mode: \"ids\"; ids: string[] } | { mode: \"query\"; queryKey: string; excludedIds: string[] }",
    "props": []
  },
  {
    "name": "GridSummaryOperation",
    "file": "src/grid-operations.ts",
    "definition": "export type GridSummaryOperation = \"sum\" | \"mean\" | \"min\" | \"max\" | \"count\"",
    "props": []
  },
  {
    "name": "GridTransaction",
    "file": "src/grid-operations.ts",
    "definition": "export type GridTransaction<T> = { before: T[]; after: T[]; patches: GridPatch[]; reason: \"edit\" | \"bulk\" | \"paste\" | \"fill\" | \"undo\" | \"redo\" }",
    "props": [
      {
        "name": "before",
        "optional": false,
        "type": "T[]",
        "description": "",
        "default": ""
      },
      {
        "name": "after",
        "optional": false,
        "type": "T[]",
        "description": "",
        "default": ""
      },
      {
        "name": "patches",
        "optional": false,
        "type": "GridPatch[]",
        "description": "",
        "default": ""
      },
      {
        "name": "reason",
        "optional": false,
        "type": "\"edit\" | \"bulk\" | \"paste\" | \"fill\" | \"undo\" | \"redo\"",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "GridUpdate",
    "file": "src/grid-operations.ts",
    "definition": "export type GridUpdate<T> = { type: \"upsert\"; row: T } | { type: \"delete\"; id: string | number }",
    "props": []
  },
  {
    "name": "isFilterActive",
    "file": "src/filters.tsx",
    "definition": "isFilterActive(filterType: string | undefined, value: unknown): boolean",
    "props": []
  },
  {
    "name": "isGridRowSelected",
    "file": "src/grid-operations.ts",
    "definition": "isGridRowSelected(selection: GridSelection, id: string, queryKey: string): boolean",
    "props": []
  },
  {
    "name": "ISOLATE_DARK_TOKENS",
    "file": "src/theme.ts",
    "definition": "ISOLATE_DARK_TOKENS: DataTableTokens",
    "props": []
  },
  {
    "name": "ISOLATE_LIGHT_TOKENS",
    "file": "src/theme.ts",
    "definition": "ISOLATE_LIGHT_TOKENS: DataTableTokens",
    "props": []
  },
  {
    "name": "matchesGridFilter",
    "file": "src/grid-operations.ts",
    "definition": "matchesGridFilter(row: object, filter: GridFilter, depth = 0): boolean",
    "props": []
  },
  {
    "name": "numberFilterFn",
    "file": "src/filters.tsx",
    "definition": "numberFilterFn: FilterFn<unknown>",
    "props": []
  },
  {
    "name": "NumberOp",
    "file": "src/filters.tsx",
    "definition": "export type NumberOp =\n  | \"equals\"\n  | \"notEqual\"\n  | \"lessThan\"\n  | \"lessThanOrEqual\"\n  | \"greaterThan\"\n  | \"greaterThanOrEqual\"\n  | \"inRange\"\n  | \"blank\"\n  | \"notBlank\"",
    "props": []
  },
  {
    "name": "parseGridClipboard",
    "file": "src/grid-operations.ts",
    "definition": "parseGridClipboard(text: string): string[][]",
    "props": []
  },
  {
    "name": "parseGridFilter",
    "file": "src/grid-operations.ts",
    "definition": "parseGridFilter(input: unknown, depth = 0): GridFilter",
    "props": []
  },
  {
    "name": "PortalContainerContext",
    "file": "src/portal-container.tsx",
    "definition": "PortalContainerContext: Context<HTMLElement>",
    "props": []
  },
  {
    "name": "replayGridTransaction",
    "file": "src/grid-operations.ts",
    "definition": "replayGridTransaction<T extends { id: string | number }>(rows: T[], transaction: GridTransaction<T>, direction: \"undo\" | \"redo\"): T[]",
    "props": []
  },
  {
    "name": "RowAction",
    "file": "src/types.ts",
    "definition": "export type RowAction<TData> =\r\n  | \"view\"\r\n  | \"edit\"\r\n  | \"duplicate\"\r\n  | \"delete\"\r\n  | { id: string; label: string; icon?: React.ReactNode; danger?: boolean; show?: (row: TData) => boolean }",
    "props": []
  },
  {
    "name": "RowActionId",
    "file": "src/data-table-row-actions.tsx",
    "definition": "export type RowActionId = \"view\" | \"edit\" | \"duplicate\" | \"delete\" | string",
    "props": []
  },
  {
    "name": "sanitizeSpreadsheetValue",
    "file": "src/export.ts",
    "definition": "sanitizeSpreadsheetValue(value: unknown): string",
    "props": []
  },
  {
    "name": "SelectOption",
    "file": "src/types.ts",
    "definition": "export type SelectOption = { value: string; label: string }",
    "props": [
      {
        "name": "value",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "label",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "SetFilter",
    "file": "src/filters.tsx",
    "definition": "export type SetFilter = { selected: string[] }",
    "props": [
      {
        "name": "selected",
        "optional": false,
        "type": "string[]",
        "description": "",
        "default": ""
      }
    ]
  },
  {
    "name": "setFilterFn",
    "file": "src/filters.tsx",
    "definition": "setFilterFn: FilterFn<unknown>",
    "props": []
  },
  {
    "name": "splitTheme",
    "file": "src/theme.ts",
    "definition": "splitTheme(theme?: DataTableTheme): {\n  light: DataTableTokens | undefined\n  dark: DataTableTokens | undefined\n}",
    "props": []
  },
  {
    "name": "summarizeGridValues",
    "file": "src/grid-operations.ts",
    "definition": "summarizeGridValues(values: unknown[], operation: GridSummaryOperation): number | null",
    "props": []
  },
  {
    "name": "textFilterFn",
    "file": "src/filters.tsx",
    "definition": "textFilterFn: FilterFn<unknown>",
    "props": []
  },
  {
    "name": "TextOp",
    "file": "src/filters.tsx",
    "definition": "export type TextOp =\n  | \"contains\"\n  | \"notContains\"\n  | \"equals\"\n  | \"notEqual\"\n  | \"startsWith\"\n  | \"endsWith\"\n  | \"blank\"\n  | \"notBlank\"",
    "props": []
  },
  {
    "name": "themePresets",
    "file": "src/theme.ts",
    "definition": "themePresets: { neutral: DataTableModedTheme; graphite: { light: { background: string; card: string; border: string; radius: string; fontFamily: string; foreground?: string; cardForeground?: string; ... 13 more ...; ring?: string; }; dark: { ...; }; }; ... 7 more ...; slate: DataTableModedTheme; }",
    "props": []
  },
  {
    "name": "themeToStyle",
    "file": "src/theme.ts",
    "definition": "themeToStyle(theme?: DataTableTheme): CSSProperties",
    "props": []
  },
  {
    "name": "toggleGridRow",
    "file": "src/grid-operations.ts",
    "definition": "toggleGridRow(selection: GridSelection, id: string, selected: boolean, queryKey: string): GridSelection",
    "props": []
  },
  {
    "name": "tokensToCssBlock",
    "file": "src/theme.ts",
    "definition": "tokensToCssBlock(tokens?: DataTableTokens): string",
    "props": []
  },
  {
    "name": "tokensToStyle",
    "file": "src/theme.ts",
    "definition": "tokensToStyle(tokens?: DataTableTokens): CSSProperties",
    "props": []
  },
  {
    "name": "useGridQuerySelection",
    "file": "src/use-grid-query-selection.ts",
    "definition": "useGridQuerySelection(options: { rowIds: readonly string[]; queryKey: string; totalRecords: number }): { selection: GridSelection; rowSelection: { [k: string]: boolean; }; selectedCount: number; selectQuery: () => void; clearSelection: () => void; onRowSelectionChange: (next: Record<string, boolean>) => void; }",
    "props": []
  },
  {
    "name": "useGridTransactions",
    "file": "src/use-grid-transactions.ts",
    "definition": "useGridTransactions<T extends { id: string | number }>(options: {\n  rows: T[];\n  onChange: (rows: T[]) => void;\n  persist?: (transaction: GridTransaction<T>) => Promise<unknown>;\n  editable: (row: T, columnId: string) => boolean;\n  validate?: (value: unknown, row: T, columnId: string) => string | undefined | Promise<string | undefined>;\n  historyLimit?: number;\n}): { commit: (patches: GridPatch[], reason?: \"edit\" | \"bulk\" | \"paste\" | \"fill\" | \"undo\" | \"redo\") => Promise<void>; undo: () => Promise<void>; redo: () => Promise<void>; pending: boolean; error: string; canUndo: boolean; canRedo: boolean; clearHistory: () => void; }",
    "props": []
  },
  {
    "name": "usePortalContainer",
    "file": "src/portal-container.tsx",
    "definition": "usePortalContainer(): HTMLElement | null",
    "props": []
  },
  {
    "name": "ViewSheetDensity",
    "file": "src/data-table-view-sheet.tsx",
    "definition": "export type ViewSheetDensity = \"compact\" | \"relaxed\" | \"comfy\"",
    "props": []
  },
  {
    "name": "XlsxSheet",
    "file": "src/xlsx.ts",
    "definition": "export type XlsxSheet = {\r\n  name: string\r\n  headers: string[]\r\n  rows: (string | number | boolean | Date | null | undefined)[][]\r\n  /** Excel number formats, by zero-based column index. */\r\n  formats?: Record<number, string>\r\n}",
    "props": [
      {
        "name": "name",
        "optional": false,
        "type": "string",
        "description": "",
        "default": ""
      },
      {
        "name": "headers",
        "optional": false,
        "type": "string[]",
        "description": "",
        "default": ""
      },
      {
        "name": "rows",
        "optional": false,
        "type": "(string | number | boolean | Date | null | undefined)[][]",
        "description": "",
        "default": ""
      },
      {
        "name": "formats",
        "optional": true,
        "type": "Record<number, string>",
        "description": "Excel number formats, by zero-based column index.",
        "default": ""
      }
    ]
  }
] as const
