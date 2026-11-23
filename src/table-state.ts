import { useCallback, useRef, useState } from "react"
import type {
  ColumnFiltersState, ColumnOrderState, ColumnPinningState, ColumnSizingState,
  ExpandedState, PaginationState, RowSelectionState, SortingState, Updater, VisibilityState,
} from "@tanstack/react-table"

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
/** Create independent defaults for a controlled table. */
export function createDataTableState(initial: Partial<DataTableState> = {}): DataTableState {
  return {
    grouping: [], sorting: [], columnFilters: [], globalFilter: "", columnVisibility: {},
    columnPinning: { left: [], right: [] }, columnSizing: {}, columnOrder: [],
    rowSelection: {}, expanded: {}, pagination: { pageIndex: 0, pageSize: 10 }, ...initial,
  }
}
export function useDataTableState({ initial, controlled, onChange, globalFilter, onGlobalFilterChange }: {
  initial: Partial<DataTableState>
  controlled?: Partial<DataTableState>
  onChange?: (next: DataTableState) => void
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
}) {
  const [internal, setInternal] = useState(() => createDataTableState(initial))
  const resolved = { ...internal, ...controlled,
    globalFilter: controlled?.globalFilter ?? globalFilter ?? internal.globalFilter }
  const current = useRef(resolved)
  current.current = resolved
  const callbacks = useRef({ onChange, onGlobalFilterChange })
  callbacks.current = { onChange, onGlobalFilterChange }
  const update = useCallback((updater: Updater<DataTableState>) => {
    const previous = current.current
    const next = typeof updater === "function" ? updater(previous) : updater
    if (Object.keys(next).every(key => Object.is(next[key as keyof DataTableState], previous[key as keyof DataTableState]))) return
    // Advance the ref immediately so batched changes compose against the newest snapshot.
    current.current = next
    setInternal(next)
    callbacks.current.onChange?.(next)
    if (next.globalFilter !== previous.globalFilter) callbacks.current.onGlobalFilterChange?.(next.globalFilter)
  }, [])
  const set = useCallback(<K extends keyof DataTableState>(key: K, updater: Updater<DataTableState[K]>) => {
    update(previous => {
      const value = typeof updater === "function"
        ? (updater as (value: DataTableState[K]) => DataTableState[K])(previous[key]) : updater
      return Object.is(value, previous[key]) ? previous : { ...previous, [key]: value }
    })
  }, [update])
  return { state: resolved, set, update }
}
