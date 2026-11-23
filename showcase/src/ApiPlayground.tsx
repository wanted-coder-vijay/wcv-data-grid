import { Component, useEffect, useRef, useState, type ReactNode } from "react"
import { DataTable, useGridTransactions, gridRangePatches, parseGridClipboard, summarizeGridValues, parseGridFilter, type GridFilter, type GridTransaction } from "@dynostack/react-grid"
import type { ColumnDef } from "@tanstack/react-table"
import { runApiCode, exampleApiCode } from "./api-sandbox"
import "./api-playground.css"
type RecordRow = { id: string | number; [key: string]: unknown }
class PreviewBoundary extends Component<{ children: ReactNode }, { error?: string }> {
  state: { error?: string } = {}
  static getDerivedStateFromError(error: Error) { return { error: error.message } }
  render() { return this.state.error ? <div className="api-feedback" role="alert">Invalid grid configuration: {this.state.error}. Edit the configuration and run the adapter again.</div> : this.props.children }
}
const columnExample = JSON.stringify([
  { accessorKey: "id", header: "ID", size: 70, enableGrouping: false, aggregationFn: "count" },
  { accessorKey: "title", header: "Task", size: 420, meta: { editor: "text", filterType: "text" } },
  { accessorKey: "team", header: "Team", size: 140, meta: { editor: "text", filterType: "text" } },
  { accessorKey: "completed", header: "Complete", size: 110, meta: { editor: "checkbox", filterType: "boolean" } },
], null, 2)
const configExample = JSON.stringify({ initialPageSize: 10, features: { grouping: true }, enableKeyboardNavigation: true, striped: true, stickyHeader: true, maxHeight: "480px" }, null, 2)
function validateRows(input: unknown): RecordRow[] {
  if (!Array.isArray(input) || input.length > 50_000 || JSON.stringify(input).length > 10_000_000) throw new Error("Return an array of up to 50,000 rows (10 MB maximum)")
  const ids = new Set<string>()
  for (const row of input) {
    if (!row || typeof row !== "object" || Array.isArray(row) || !(typeof row.id === "string" || typeof row.id === "number") || (typeof row.id === "number" && !Number.isFinite(row.id))) throw new Error("Every row needs a finite number or string id")
    if (ids.has(String(row.id))) throw new Error("Row IDs must be unique")
    ids.add(String(row.id))
  }
  return input
}
export default function ApiPlayground() {
  const [code, setCode] = useState(exampleApiCode), [columnCode, setColumnCode] = useState(columnExample), [configCode, setConfigCode] = useState(configExample)
  const [rows, setRows] = useState<RecordRow[]>([]), [columns, setColumns] = useState<ColumnDef<RecordRow>[]>(JSON.parse(columnExample)), [config, setConfig] = useState(JSON.parse(configExample))
  const [tab, setTab] = useState("api"), [busy, setBusy] = useState(false), [status, setStatus] = useState("Run the example to fetch 200 tasks."), [selected, setSelected] = useState<RecordRow[]>([])
  const [bulkColumn, setBulkColumn] = useState("completed"), [bulkValue, setBulkValue] = useState("true"), [paste, setPaste] = useState(""), [startRow, setStartRow] = useState(0), [startColumn, setStartColumn] = useState(1)
  const [filterText, setFilterText] = useState(""), [filter, setFilter] = useState<GridFilter>(), [generation, setGeneration] = useState(0)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const columnIds = columns.map(c => String((c as { accessorKey?: string }).accessorKey ?? c.id)).filter(id => id !== "undefined")
  const transactions = useGridTransactions({ rows, onChange: setRows, editable: (_row, id) => {
    const c = columns.find(c => (c as { accessorKey?: string }).accessorKey === id)
    return !!c?.meta?.editor && c.meta.isEditable !== false
  }, persist: async (change: GridTransaction<RecordRow>) => {
    controller.current = new AbortController()
    const dirtyIds = new Set(change.patches.map(p => p.rowId))
    const result = await runApiCode(code, "save", {}, { reason: change.reason, patches: change.patches, rows: change.after.filter(row => dirtyIds.has(String(row.id))) }, controller.current.signal)
    if (!result || typeof result !== "object" || (result as { accepted?: boolean }).accepted !== true) throw new Error("save(change) must return { accepted: true } after persistence succeeds")
  } })
  const locked = busy || transactions.pending
  function report(action: () => Promise<void>) { action().then(() => setStatus("Changes accepted. JSONPlaceholder writes are simulated.")).catch(error => setStatus(String(error.message))) }
  function coerce(value: string, columnId: string): unknown {
    const editor = columns.find(c => (c as { accessorKey?: string }).accessorKey === columnId)?.meta?.editor
    if (editor === "number" || editor === "currency") { const n = Number(value); if (!value.trim() || !Number.isFinite(n)) throw new Error(`Invalid number for ${columnId}`); return n }
    if (editor === "checkbox" || editor === "switch") { if (!/^(true|false)$/i.test(value)) throw new Error(`Use true or false for ${columnId}`); return value.toLowerCase() === "true" }
    return value
  }
  async function run() {
    if (locked) return
    setBusy(true); setStatus("Running API adapter…"); controller.current = new AbortController()
    try {
      const parsedColumns = JSON.parse(columnCode), parsedConfig = JSON.parse(configCode)
      if (!Array.isArray(parsedColumns) || !parsedColumns.length || parsedColumns.length > 100 || parsedColumns.some(c => !c || typeof c.accessorKey !== "string" || ["__proto__", "constructor", "prototype"].includes(c.accessorKey))) throw new Error("Columns must be an array of 1–100 accessorKey definitions")
      if (!parsedConfig || typeof parsedConfig !== "object" || Array.isArray(parsedConfig)) throw new Error("Grid props must be an object")
      const allowed = ["features", "initialPageSize", "pageSizeOptions", "enableKeyboardNavigation", "virtualizeRows", "virtualOverscan", "striped", "stickyHeader", "maxHeight", "density", "direction", "initialGrouping", "theme", "isolate"]
      const safeConfig = Object.fromEntries(Object.entries(parsedConfig).filter(([key]) => allowed.includes(key)))
      if (safeConfig.initialPageSize != null && (!Number.isInteger(safeConfig.initialPageSize) || Number(safeConfig.initialPageSize) < 1 || Number(safeConfig.initialPageSize) > 1000)) throw new Error("initialPageSize must be 1–1000")
      const result = await runApiCode(code, "load", { pageIndex: 0, pageSize: Number(safeConfig.initialPageSize ?? 10), sorting: [], columnFilters: [], globalFilter: "" }, null, controller.current.signal)
      setRows(validateRows(result)); setColumns(parsedColumns); setConfig(safeConfig); transactions.clearHistory(); setSelected([]); setFilter(undefined); setGeneration(v => v + 1)
      setStatus(`Loaded ${(result as unknown[]).length.toLocaleString()} records. Edit any cell or group by team.`)
    } catch (error) { setStatus(error instanceof Error ? error.message : "Execution failed") }
    finally { setBusy(false) }
  }
  function download() {
    const text = `// npm install @dynostack/react-grid\nimport { DataTable, useGridTransactions } from '@dynostack/react-grid';\nimport '@dynostack/react-grid/styles.css';\n\n${code}\n\nexport const columns = ${columnCode};\nexport const gridProps = ${configCode};\n// Load rows with await load(params).\n// Bind useGridTransactions({rows, onChange:setRows, persist:save, editable}).\n// <DataTable {...gridProps} data={rows} columns={columns} onCellEdit={(row,id,value)=>transactions.commit([{rowId:String(row.id),columnId:id,value}])} />\n`
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" })); const a = document.createElement("a"); a.href = url; a.download = "dynostack-api-integration.jsx"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <main className="api-lab"><header className="api-lab-heading"><div><span className="api-eyebrow">REACT GRID / CODE PLAYGROUND</span><h1>Your data. Your adapter.</h1><p>Edit requests, map responses and define how changes are saved. Bring any API that supports browser CORS.</p></div><a href="/playground">Visual playground ↗</a></header>
    <div className="api-lab-layout"><section className="api-editor"><div className="api-tabs">{["api", "columns", "props", "filters"].map(name => <button aria-pressed={tab === name} key={name} onClick={() => setTab(name)}>{name === "api" ? "API code" : name === "props" ? "Grid props" : name}</button>)}</div>
      <label className="api-code-label">{tab === "api" ? "JavaScript API adapter" : tab === "columns" ? "Column definitions JSON" : tab === "props" ? "Grid configuration JSON" : "Nested filter JSON"}<textarea spellCheck={false} disabled={locked} value={tab === "api" ? code : tab === "columns" ? columnCode : tab === "props" ? configCode : filterText} onChange={event => (tab === "api" ? setCode : tab === "columns" ? setColumnCode : tab === "props" ? setConfigCode : setFilterText)(event.target.value)} /></label>
      <div className="api-actions"><button className="api-run" disabled={locked} onClick={run}>▶ Run adapter</button><button disabled={!locked} onClick={() => controller.current?.abort()}>Cancel</button><button disabled={locked} onClick={download}>Export code</button></div>
      {tab === "filters" && <div className="api-actions"><button disabled={locked} onClick={() => { try { const f = filterText.trim() ? parseGridFilter(JSON.parse(filterText)) : undefined; setFilter(f); setStatus("Nested filter applied") } catch (error) { setStatus(String(error)) } }}>Apply filter</button><button onClick={() => { setFilterText(JSON.stringify({ operator: "and", children: [{ column: "completed", operator: "eq", value: false }, { column: "team", operator: "contains", value: "1" }] }, null, 2)) }}>Example AND filter</button></div>}
      <p className="api-note">Code runs in a disposable sandbox worker without access to this app’s DOM or storage. Requests obey CORS. Keep secrets on your backend. Execution stops after 20 seconds.</p><p className="api-note">The example uses <a href="https://jsonplaceholder.typicode.com/guide/" target="_blank" rel="noreferrer">JSONPlaceholder</a>. Writes are simulated and reset when reloaded. Your production save adapter must accept the entire transaction or reject it.</p>
    </section><section className="api-preview"><div className="api-preview-header"><span>LIVE PREVIEW</span><span>{rows.length} records · {selected.length} selected</span></div><div className="api-feedback" role="status">{transactions.error ?? status}</div>
      <div className="api-actions"><button disabled={locked || !transactions.canUndo} onClick={() => report(transactions.undo)}>Undo</button><button disabled={locked || !transactions.canRedo} onClick={() => report(transactions.redo)}>Redo</button><span>{summarizeGridValues(rows.map(row => row.id), "count")} loaded records</span></div>
      <PreviewBoundary key={generation}><DataTable {...config} data={rows} columns={columns} rowActions={[]} onSelectionChange={setSelected} filterExpression={filter} isLoading={busy} onRefresh={run} ariaLabel="API playground grid" onCellEdit={(row, columnId, value) => transactions.commit([{ rowId: String(row.id), columnId, value }])} summary={{ scope: "filtered", label: "Filtered records", columns: { id: "count" } }} /></PreviewBoundary>
      <details className="api-tools"><summary>Bulk edit & spreadsheet tools</summary><div className="api-actions"><label>Column<select value={bulkColumn} onChange={e => setBulkColumn(e.target.value)}>{columnIds.filter(id => id !== "id").map(id => <option key={id}>{id}</option>)}</select></label><label>Value<input value={bulkValue} onChange={e => setBulkValue(e.target.value)} /></label><button disabled={locked || !selected.length} onClick={() => report(async () => { await transactions.commit(selected.map(row => ({ rowId: String(row.id), columnId: bulkColumn, value: coerce(bulkValue, bulkColumn) })), "bulk") })}>Apply to {selected.length} selected</button></div>
        <p>Paste uses source row order and configured column order (zero based), independent of sorting, grouping and page. It validates the whole rectangle before saving.</p><div className="api-actions"><label>Start row<input type="number" min={0} value={startRow} onChange={e => setStartRow(Number(e.target.value))} /></label><label>Start column<input type="number" min={0} value={startColumn} onChange={e => setStartColumn(Number(e.target.value))} /></label></div><label>Tab-separated cells<textarea value={paste} onChange={e => setPaste(e.target.value)} /></label><div className="api-actions"><button disabled={locked || !rows.length || !paste} onClick={() => report(async () => { const values = parseGridClipboard(paste).map(cells => cells.map((value, c) => coerce(value, columnIds[startColumn + c]))); await transactions.commit(gridRangePatches(rows, columnIds, { row: startRow, column: startColumn }, values), "paste") })}>Paste rectangle</button><button disabled={locked || selected.length < 2} onClick={() => report(async () => { await transactions.commit(selected.slice(1).map(row => ({ rowId: String(row.id), columnId: bulkColumn, value: selected[0][bulkColumn] })), "fill") })}>Fill from first selected</button></div>
      </details>
    </section></div>
  </main>
}
