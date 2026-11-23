import "./types"
import type { Table } from "@tanstack/react-table"
import ExcelJS from "exceljs"

export type XlsxSheet = {
  name: string
  headers: string[]
  rows: (string | number | boolean | Date | null | undefined)[][]
  /** Excel number formats, by zero-based column index. */
  formats?: Record<number, string>
}
/** Native workbook bytes. Strings are literal cells, never formulas. */
export async function createXlsxWorkbook(sheets: XlsxSheet[]): Promise<Uint8Array> {
  if (!sheets.length) throw new Error("Provide at least one worksheet.")
  const workbook = new ExcelJS.Workbook()
  for (const sheet of sheets) {
    if (!sheet.name || sheet.name.length > 31 || /[\\/*?:\[\]]/.test(sheet.name)) throw new Error("Invalid worksheet name.")
    const ws = workbook.addWorksheet(sheet.name)
    ws.addRow(sheet.headers)
    ws.getRow(1).font = { bold: true }
    ws.views = [{ state: "frozen", ySplit: 1 }]
    for (const row of sheet.rows) ws.addRow(row.map(value => value ?? null))
    sheet.headers.forEach((header, index) => {
      const column = ws.getColumn(index + 1)
      column.width = Math.min(45, Math.max(14, header.length + 3))
      if (sheet.formats?.[index]) column.numFmt = sheet.formats[index]
    })
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer())
}
export async function exportToXlsx<T>(table: Table<T>, fileName = "export", options: { sheetName?: string; additionalSheets?: XlsxSheet[]; formats?: Record<string, string> } = {}) {
  const columns = table.getVisibleLeafColumns().filter(c => !["__select", "__expand", "__actions"].includes(c.id) && c.columnDef.meta?.exportable !== false)
  const selected = table.getSelectedRowModel().flatRows.filter(row => !row.getIsGrouped())
  const rows = selected.length ? selected : table.getFilteredRowModel().flatRows.filter(row => !row.getIsGrouped())
  const bytes = await createXlsxWorkbook([{
    name: options.sheetName ?? "Data",
    headers: columns.map(c => c.columnDef.meta?.label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id)),
    rows: rows.map(row => columns.map(c => {
      const value = row.getValue(c.id)
      if (value == null || typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value instanceof Date) return value
      return JSON.stringify(value)
    })),
    formats: Object.fromEntries(columns.flatMap((c, i) => options.formats?.[c.id] ? [[i, options.formats[c.id]]] : [])),
  }, ...options.additionalSheets ?? []])
  const blob = new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url; link.download = `${fileName}.xlsx`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
