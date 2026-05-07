import type { ColumnDef, RowData } from "@tanstack/react-table"

export type CellEditorType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "switch"
  | "checkbox"

export type FilterType =
  | "text"
  | "number"
  | "select"
  | "multi-select"
  | "boolean"
  | "date"

export type SelectOption = { value: string; label: string }

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
    editor?: CellEditorType
    filterType?: FilterType
    selectOptions?: SelectOption[]
    align?: "left" | "right" | "center"
    cellClassName?: string
    headerClassName?: string
    exportable?: boolean
    isEditable?: boolean | ((row: TData) => boolean)
    badgeMap?: Partial<Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline">>
  }
}

export type RowAction<TData> =
  | "view"
  | "edit"
  | "duplicate"
  | "delete"
  | { id: string; label: string; icon?: React.ReactNode; danger?: boolean; show?: (row: TData) => boolean }

export type DataTableColumn<TData> = ColumnDef<TData>
