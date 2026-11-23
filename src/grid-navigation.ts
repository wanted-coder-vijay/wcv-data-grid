import { useEffect, useRef, useState } from "react"
import type { Row } from "@tanstack/react-table"
export function useGridNavigation<T>({ enabled, root, rows, saving, editing, startEdit, scrollToRow }: {
  enabled: boolean; root: HTMLElement | null; rows: Row<T>[]; saving: boolean; editing: boolean
  startEdit: (rowId: string, columnId: string) => void; scrollToRow: (index: number) => void
}) {
  const [active, setActive] = useState<{ row: string; column: string } | null>(null)
  const pending = useRef<{ row: string; column: string } | null>(null)
  useEffect(() => {
    if (!root) return
    const cancel = (event: Event) => {
      const cell = (event.target as HTMLElement)?.closest<HTMLElement>("[data-nav-cell]")
      if (cell) pending.current = { row: cell.dataset.navRow!, column: cell.dataset.navColumn! }
    }
    root.addEventListener("dynostack-editor-cancel", cancel)
    return () => root.removeEventListener("dynostack-editor-cancel", cancel)
  }, [root])
  const cells = rows[0]?.getVisibleCells() ?? []
  const valid = active && rows.some(r => r.id === active.row) && cells.some(c => c.column.id === active.column)
  const current = valid ? active : rows[0] && cells[0] ? { row: rows[0].id, column: cells[0].column.id } : null
  function focus(target: { row: string; column: string }) {
    setActive(target)
    scrollToRow(rows.findIndex(r => r.id === target.row))
    let tries = 0
    const attempt = () => {
      const cell = Array.from(root?.querySelectorAll<HTMLElement>("[data-nav-cell]") ?? []).find(c => c.dataset.navRow === target.row && c.dataset.navColumn === target.column)
      if (cell) { cell.focus(); cell.scrollIntoView({ block: "nearest", inline: "nearest" }); }
      else if (++tries < 20) requestAnimationFrame(attempt)
    }
    requestAnimationFrame(attempt)
  }
  useEffect(() => {
    if (!editing && !saving && pending.current) { const target = pending.current; pending.current = null; focus(target) }
  }, [editing, saving])
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!enabled) return
    const target = event.target as HTMLElement
    const cell = target.closest<HTMLElement>("[data-nav-cell]")
    if (!cell || saving) return
    if (event.key === "Escape") pending.current = target.hasAttribute("data-cell-editor") ? { row: cell.dataset.navRow!, column: cell.dataset.navColumn! } : null
    const rowIndex = rows.findIndex(r => r.id === cell.dataset.navRow)
    const columns = rows[rowIndex]?.getVisibleCells() ?? []
    const columnIndex = columns.findIndex(c => c.column.id === cell.dataset.navColumn)
    if (rowIndex < 0 || columnIndex < 0) return
    const inputTab = event.key === "Tab" && target.hasAttribute("data-cell-editor") && !root?.querySelector('[data-row-editing="true"]')
    if (target !== cell && !inputTab) return
    if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault()
      const selected = columns[columnIndex]
      const meta = selected.column.columnDef.meta
      const editable = typeof meta?.isEditable === "function" ? meta.isEditable(rows[rowIndex].original) : meta?.isEditable !== false
      if ((meta?.editor || meta?.renderEditor) && editable && !rows[rowIndex].getIsGrouped()) startEdit(rows[rowIndex].id, selected.column.id)
      else cell.querySelector<HTMLElement>("button,input,select,a")?.focus()
      return
    }
    let nextRow = rowIndex, nextColumn = columnIndex
    if (event.key === "ArrowDown") nextRow++
    else if (event.key === "ArrowUp") nextRow--
    else if (event.key === "ArrowRight") nextColumn++
    else if (event.key === "ArrowLeft") nextColumn--
    else if (event.key === "Home") nextColumn = 0
    else if (event.key === "End") nextColumn = columns.length - 1
    else if (event.key === "Tab") {
      nextColumn += event.shiftKey ? -1 : 1
      if (nextColumn < 0) { nextRow--; nextColumn = columns.length - 1 }
      else if (nextColumn >= columns.length) { nextRow++; nextColumn = 0 }
      if (nextRow < 0 || nextRow >= rows.length) return
    } else return
    event.preventDefault()
    nextRow = Math.max(0, Math.min(rows.length - 1, nextRow))
    nextColumn = Math.max(0, Math.min(columns.length - 1, nextColumn))
    const next = { row: rows[nextRow].id, column: columns[nextColumn].column.id }
    if (inputTab) {
      pending.current = next
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    } else focus(next)
  }
  return { current, setActive, onKeyDown }
}
