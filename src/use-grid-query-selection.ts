import { useState } from "react"
import { isGridRowSelected, toggleGridRow, type GridSelection } from "./grid-operations"

/** Query-wide selection is a descriptor, never a fabricated list of unloaded rows. */
export function useGridQuerySelection(options: { rowIds: readonly string[]; queryKey: string; totalRecords: number }) {
  const [stored, setStored] = useState<GridSelection>({ mode: "ids", ids: [] })
  const [key, setKey] = useState(options.queryKey)
  // Invalidate both explicit and query selection when the membership query changes.
  if (key !== options.queryKey) { setKey(options.queryKey); setStored({ mode: "ids", ids: [] }) }
  const selection: GridSelection = key === options.queryKey ? stored : { mode: "ids", ids: [] }
  const rowSelection = Object.fromEntries(options.rowIds.filter(id => isGridRowSelected(selection, id, options.queryKey)).map(id => [id, true]))
  return {
    selection, rowSelection,
    selectedCount: selection.mode === "ids" ? selection.ids.length : Math.max(0, options.totalRecords - selection.excludedIds.length),
    selectQuery: () => setStored({ mode: "query", queryKey: options.queryKey, excludedIds: [] }),
    clearSelection: () => setStored({ mode: "ids", ids: [] }),
    /** Pass the next table state rowSelection here from DataTable.onStateChange. */
    onRowSelectionChange: (next: Record<string, boolean>) => setStored(previous => {
      let result = previous
      for (const id of options.rowIds) {
        const selected = !!next[id]
        if (selected !== isGridRowSelected(result, id, options.queryKey)) result = toggleGridRow(result, id, selected, options.queryKey)
      }
      return result
    }),
  }
}
