import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import { DataTable, createDataTableState, type DataTableColumn } from "../../src"
import "../src/styles.css"
const rows = Array.from({ length: 30 }, (_, i) => ({ id: String(i), name: `Item ${i}`, quantity: i }))
const columns: DataTableColumn<typeof rows[number]>[] = [
  { accessorKey: "name", header: "Name" }, { accessorKey: "quantity", header: "Quantity" },
]
function Fixture() {
  const [state, setState] = useState(() => createDataTableState({ pagination: { pageIndex: 2, pageSize: 5 } }))
  const [mode, setMode] = useState("full")
  return <main>
    <label>Control mode<select aria-label="Control mode" value={mode} onChange={e => setMode(e.target.value)}><option>full</option><option>partial</option><option>readonly</option></select></label>
    <button onClick={() => setState(previous => ({ ...previous, globalFilter: "Item 2", sorting: [{ id: "quantity", desc: true }], columnVisibility: { quantity: false }, columnOrder: ["quantity", "name"], columnSizing: { name: 300 }, columnPinning: { left: ["name"] }, rowSelection: { "2": true }, expanded: { "2": true }, pagination: { pageIndex: 0, pageSize: 5 } }))}>External configuration</button>
    <button onClick={() => setState(previous => ({ ...previous, globalFilter: "", pagination: { pageIndex: 2, pageSize: 5 } }))}>External page three</button>
    <pre data-testid="state">{JSON.stringify(state)}</pre>
    <DataTable data={rows} columns={columns} rowActions={[]} initialPageSize={5}
      state={mode === "partial" ? { sorting: state.sorting } : state}
      onStateChange={mode === "readonly" ? undefined : setState}
      savedViews={{ storageKey: "dynostack-state-test-v1" }} />
  </main>
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><Fixture /></React.StrictMode>)
