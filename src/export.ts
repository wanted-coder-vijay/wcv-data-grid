import type { Table } from "@tanstack/react-table"

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ""
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function getExportRows<TData>(table: Table<TData>) {
  const visible = table.getVisibleLeafColumns().filter((c) => {
    if (c.id === "__select" || c.id === "__expand" || c.id === "__actions")
      return false
    return c.columnDef.meta?.exportable !== false
  })
  const headers = visible.map(
    (c) => c.columnDef.meta?.label ?? (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id)
  )

  const selected = table.getSelectedRowModel().rows
  const rows = selected.length > 0 ? selected : table.getFilteredRowModel().rows

  const data = rows.map((row) =>
    visible.map((col) => {
      const value = row.getValue(col.id)
      if (value instanceof Date) return value.toISOString().slice(0, 10)
      if (typeof value === "object" && value !== null) return JSON.stringify(value)
      return value
    })
  )

  return { headers, data }
}

function triggerDownload(content: string, mime: string, filename: string) {
  const bom = "﻿"
  const blob = new Blob([bom + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function exportToCsv<TData>(table: Table<TData>, fileName = "export") {
  const { headers, data } = getExportRows(table)
  const lines = [headers.map(escapeCsv).join(","), ...data.map((r) => r.map(escapeCsv).join(","))]
  triggerDownload(lines.join("\r\n"), "text/csv;charset=utf-8;", `${fileName}.csv`)
}

export function exportToExcel<TData>(table: Table<TData>, fileName = "export") {
  const { headers, data } = getExportRows(table)
  const headerHtml = headers
    .map((h) => `<th style="background:#f4f4f5;text-align:left;padding:6px 10px;border:1px solid #d4d4d8">${escapeHtml(h)}</th>`)
    .join("")
  const bodyHtml = data
    .map(
      (row) =>
        `<tr>${row
          .map((c) => `<td style="padding:6px 10px;border:1px solid #d4d4d8">${escapeHtml(c)}</td>`)
          .join("")}</tr>`
    )
    .join("")
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"/><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>${`<thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody>`}</table></body></html>`
  triggerDownload(html, "application/vnd.ms-excel;charset=utf-8;", `${fileName}.xls`)
}
