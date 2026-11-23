import type { ColumnDef, RowData } from "@tanstack/react-table"
import type { ReactNode, CSSProperties } from "react"
export type CustomCellEditorProps<TData> = {
  value: unknown; row: TData; columnId: string; disabled?: boolean; errorId?: string;
  onChange: (value: unknown) => void; onCommit: (value: unknown) => void; onCancel: () => void;
}

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
}

export type RowAction<TData> =
  | "view"
  | "edit"
  | "duplicate"
  | "delete"
  | { id: string; label: string; icon?: React.ReactNode; danger?: boolean; show?: (row: TData) => boolean }

export type DataTableColumn<TData> = ColumnDef<TData>
