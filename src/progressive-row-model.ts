import { useEffect, useRef, useState } from "react"
import { createRow, getCoreRowModel, type RowModel, type Table } from "@tanstack/react-table"

const EMPTY = { rows: [], flatRows: [], rowsById: {} }
/** Build large flat client row models in bounded tasks instead of blocking one render. */
export function useProgressiveRowModel<T extends { id: string | number }>(data: T[], enabled: boolean) {
  const current = useRef({ data, enabled }); current.current = { data, enabled }
  const tableRef = useRef<Table<T> | null>(null)
  const prepared = useRef<{ data: T[]; model: RowModel<T> } | null>(null)
  const [progress, setProgress] = useState(0)
  const [, redraw] = useState(0)
  const factory = useRef<(table: Table<T>) => () => RowModel<T>>(undefined)
  if (!factory.current) factory.current = table => {
    tableRef.current = table
    const standard = getCoreRowModel<T>()(table)
    return () => current.current.enabled
      ? prepared.current?.data === current.current.data ? prepared.current.model : EMPTY as RowModel<T>
      : standard()
  }
  useEffect(() => {
    if (!enabled) { prepared.current = null; return }
    const table = tableRef.current
    if (!table) return
    let canceled = false, index = 0, timer: ReturnType<typeof setTimeout>, lastProgress = 0
    const previous = prepared.current?.model
    const model: RowModel<T> = { rows: [], flatRows: [], rowsById: Object.create(null) }
    setProgress(0)
    function step() {
      if (canceled) return
      const deadline = performance.now() + 6
      // Limit both time and records per task; yield to input, painting and cancellation.
      let visited = 0, created = 0
      while (index < data.length && visited++ < 2048 && created < 256 && performance.now() < deadline) {
        const existing = previous?.rowsById[String(data[index].id)]
        const row = existing?.original === data[index] && existing.index === index
          ? existing : (created++, createRow(table!, String(data[index].id), data[index], index, 0))
        model.rows.push(row); model.rowsById[row.id] = row
        index++
      }
      if (index === data.length) {
        model.flatRows = model.rows
        prepared.current = { data, model }
        setProgress(index); redraw(value => value + 1)
      } else {
        if (performance.now() - lastProgress > 100) { setProgress(index); lastProgress = performance.now() }
        timer = setTimeout(step, 0)
      }
    }
    timer = setTimeout(step, 0)
    return () => { canceled = true; clearTimeout(timer) }
  }, [data, enabled])
  return { getCoreRowModel: factory.current, preparing: enabled && prepared.current?.data !== data, progress }
}
