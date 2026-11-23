import { useEffect, useState } from "react"
import type { DataTableState } from "./table-state"

export type DataTableViewState = Pick<DataTableState, "grouping" | "sorting" | "columnFilters" | "globalFilter" | "columnVisibility" | "columnPinning" | "columnSizing" | "columnOrder">
export type DataTableSavedView = { id: string; name: string; state: DataTableViewState }
export type DataTableSavedViewLabels = Partial<Record<"choose" | "name" | "save" | "restore" | "rename" | "delete" | "reset" | "clear", string>>
export type DataTableSavedViewsConfig = {
  initialViews?: DataTableSavedView[]
  views?: DataTableSavedView[]
  onViewsChange?: (views: DataTableSavedView[]) => void
  /** Opt-in browser persistence. Use a distinct key per dataset/schema. */
  storageKey?: string
  labels?: DataTableSavedViewLabels
}
function snapshot(state: DataTableState | DataTableViewState): DataTableViewState {
  const { grouping = [], sorting, columnFilters, globalFilter, columnVisibility, columnPinning, columnSizing, columnOrder } = state
  return JSON.parse(JSON.stringify({ grouping, sorting, columnFilters, globalFilter, columnVisibility, columnPinning, columnSizing, columnOrder }))
}
function parseViews(raw: string): DataTableSavedView[] {
  if (raw.length > 1000000) throw new Error("Saved views exceed the storage limit.")
  const value = JSON.parse(raw)
  if (value.version !== 1 || !Array.isArray(value.views) || value.views.length > 50) throw new Error("Saved views have an unsupported format.")
  const object = (v: unknown) => !!v && typeof v === "object" && !Array.isArray(v)
  for (const view of value.views) {
    const s = view?.state
    if (typeof view?.id !== "string" || typeof view?.name !== "string" || !view.name.trim() || view.name.length > 80 || !object(s)
      || (s.grouping !== undefined && (!Array.isArray(s.grouping) || !s.grouping.every((id: unknown) => typeof id === "string")))
      || !Array.isArray(s.sorting) || !s.sorting.every((v: any) => typeof v.id === "string" && typeof v.desc === "boolean")
      || !Array.isArray(s.columnFilters) || !s.columnFilters.every((v: any) => typeof v.id === "string")
      || typeof s.globalFilter !== "string" || !object(s.columnVisibility) || !Object.values(s.columnVisibility).every(v => typeof v === "boolean")
      || !object(s.columnSizing) || !Object.values(s.columnSizing).every(v => typeof v === "number" && Number.isFinite(v) && v >= 0)
      || !object(s.columnPinning) || ![s.columnPinning.left ?? [], s.columnPinning.right ?? [], s.columnOrder].every(v => Array.isArray(v) && v.every(id => typeof id === "string"))) {
      throw new Error("Stored saved views are invalid. Clear them and save a new view.")
    }
  }
  if (new Set(value.views.map((v: DataTableSavedView) => v.id)).size !== value.views.length) throw new Error("Stored saved views contain duplicate IDs.")
  return value.views.map((v: DataTableSavedView) => ({ id: v.id, name: v.name, state: snapshot(v.state) }))
}
export function SavedViewsControl({ config, state, baseline, onApply, disabled }: {
  config: DataTableSavedViewsConfig; state: DataTableState; baseline: DataTableViewState
  onApply: (state: DataTableViewState) => void; disabled?: boolean
}) {
  const [local, setLocal] = useState(config.initialViews ?? [])
  const [selected, setSelected] = useState("")
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const views = config.views ?? local
  const active = views.find(v => v.id === selected)
  const labels = { choose: "Choose saved view", name: "View name", save: "Save view", restore: "Restore", rename: "Rename", delete: "Delete view", reset: "Reset view", clear: "Clear saved views", ...config.labels }
  useEffect(() => {
    setSelected(""); setError("")
    if (!config.storageKey || config.views) return
    try {
      const raw = localStorage.getItem(config.storageKey)
      setLocal(raw ? parseViews(raw) : config.initialViews ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : "Cannot load saved views.") }
  }, [config.storageKey, !!config.views])
  function commit(next: DataTableSavedView[]) {
    setLocal(next); config.onViewsChange?.(next); setError("")
    if (config.storageKey) {
      try {
        if (!next.length) localStorage.removeItem(config.storageKey)
        else {
          const raw = JSON.stringify({ version: 1, views: next })
          parseViews(raw)
          localStorage.setItem(config.storageKey, raw)
        }
      } catch (e) { setError(`Views changed in memory, but could not be persisted: ${e instanceof Error ? e.message : "storage unavailable"}`) }
    }
  }
  function save() {
    if (!name.trim()) { setError("Enter a view name."); return }
    if (views.length >= 50) { setError("You can save up to 50 views."); return }
    let savedState: DataTableViewState
    try { savedState = snapshot(state) }
    catch { setError("This view contains values that cannot be serialized. Use JSON-compatible filter values."); return }
    const view = { id: crypto.randomUUID(), name: name.trim(), state: savedState }
    commit([...views, view]); setSelected(view.id); setMessage(`Saved ${view.name}.`)
  }
  return <div className="flex flex-wrap items-center gap-2 text-sm [&_button]:rounded-md [&_button]:border [&_button]:px-2 [&_button]:py-1 [&_button:disabled]:opacity-50" aria-label="Saved views">
    <select className="h-8 rounded-md border bg-background px-2" aria-label={labels.choose} value={active ? selected : ""} disabled={disabled} onChange={e => { setSelected(e.target.value); setName(views.find(v => v.id === e.target.value)?.name ?? "") }}>
      <option value="">{labels.choose}</option>{views.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
    </select>
    <input className="h-8 w-36 rounded-md border bg-background px-2" aria-label={labels.name} placeholder={labels.name} maxLength={80} value={name} disabled={disabled} onChange={e => setName(e.target.value)} />
    <button type="button" disabled={disabled} onClick={save}>{labels.save}</button>
    <button type="button" disabled={disabled || !active} onClick={() => { onApply(snapshot(active!.state)); setMessage(`Restored ${active!.name}.`) }}>{labels.restore}</button>
    <button type="button" disabled={disabled || !active || !name.trim()} onClick={() => { commit(views.map(v => v.id === selected ? { ...v, name: name.trim() } : v)); setMessage("View renamed.") }}>{labels.rename}</button>
    <button type="button" disabled={disabled || !active} onClick={() => { commit(views.filter(v => v.id !== selected)); setSelected(""); setMessage("View deleted.") }}>{labels.delete}</button>
    <button type="button" disabled={disabled} onClick={() => { onApply(snapshot(baseline)); setMessage("View reset to initial configuration.") }}>{labels.reset}</button>
    <button type="button" disabled={disabled} onClick={() => { commit([]); setSelected(""); setMessage("Saved views cleared.") }}>{labels.clear}</button>
    {error ? <span role="alert">{error}</span> : <span role="status" className="sr-only">{message}</span>}
  </div>
}
