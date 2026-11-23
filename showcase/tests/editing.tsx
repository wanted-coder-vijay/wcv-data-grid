import React, { useState } from "react"
import { createRoot } from "react-dom/client"
import { DataTable, type DataTableColumn } from "../../src"
import "../src/styles.css"
type Item = { id: string; name: string; quantity: number }
const columns: DataTableColumn<Item>[] = [
  { accessorKey: "name", header: "Name", meta: { editor: "text",
    validate: async (value) => String(value).trim() ? undefined : "Name is required." } },
  { accessorKey: "quantity", header: "Quantity", meta: { editor: "number",
    validate: (value) => Number(value) >= 0 ? undefined : "Quantity must be positive." } },
]
function Fixture() {
  const [data, setData] = useState<Item[]>([{ id: "1", name: "Original", quantity: 3 }])
  const [fail, setFail] = useState(false)
  const [sync, setSync] = useState(false)
  const [calls, setCalls] = useState(0)
  const save = async (row: Item, draft: Partial<Item>) => {
    setCalls(n => n + 1)
    await new Promise(resolve => setTimeout(resolve, 500))
    if (fail) throw new Error("Simulated network failure")
    setData(rows => rows.map(item => item.id === row.id ? { ...item, ...draft } : item))
  }
  const syncSave = (row: Item, draft: Partial<Item>) => {
    setCalls(n => n + 1)
    if (fail) throw new Error("Synchronous save failure")
    setData(rows => rows.map(item => item.id === row.id ? { ...item, ...draft } : item))
  }
  return <main style={{ padding: 24 }}>
    <h1>Async editing regression fixture</h1>
    <label><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)} />Fail saves</label>
    <label><input type="checkbox" checked={sync} onChange={e => setSync(e.target.checked)} />Synchronous saves</label>
    <output data-testid="calls">{calls}</output>
    <DataTable data={data} columns={columns} rowActions={["edit"]}
      features={{ pagination: false }} enableSelection={false}
      onRowSave={sync ? syncSave : save} onCellEdit={(row, key, value) => save(row, { [key]: value })} />
  </main>
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><Fixture /></React.StrictMode>)
