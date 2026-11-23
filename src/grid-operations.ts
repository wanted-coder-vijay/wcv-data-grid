/** Portable grid operations. No network or DOM access; persistence belongs to the caller. */
export type GridFilter = { operator: "and" | "or"; children: GridFilter[] } | {
  column: string; operator: "eq" | "ne" | "contains" | "gt" | "gte" | "lt" | "lte" | "in" | "empty"; value?: unknown
}
const unsafe = new Set(["__proto__", "prototype", "constructor", "id"])
/** Validate imported expressions completely, including branches that would short-circuit. */
export function parseGridFilter(input: unknown, depth = 0): GridFilter {
  if (depth > 16 || !input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid filter expression or excessive nesting")
  const value = input as Record<string, unknown>
  if (value.operator === "and" || value.operator === "or") {
    if (!Array.isArray(value.children) || value.children.length > 100) throw new Error("Invalid filter group")
    return { operator: value.operator, children: value.children.map(child => parseGridFilter(child, depth + 1)) }
  }
  if (typeof value.column !== "string" || !value.column || ["__proto__", "constructor", "prototype"].includes(value.column) || !["eq", "ne", "contains", "gt", "gte", "lt", "lte", "in", "empty"].includes(String(value.operator))) throw new Error("Invalid filter column or operator")
  if (value.operator === "in" && (!Array.isArray(value.value) || value.value.length > 1000)) throw new Error("IN requires an array of up to 1000 values")
  return { column: value.column, operator: value.operator as Exclude<GridFilter, { children: GridFilter[] }>["operator"], value: value.value }
}
export function matchesGridFilter(row: object, filter: GridFilter, depth = 0): boolean {
  if (depth > 16) throw new Error("Filter nesting exceeds 16 levels")
  if ("children" in filter) {
    if (filter.operator !== "and" && filter.operator !== "or") throw new Error("Invalid filter group operator")
    if (!Array.isArray(filter.children) || filter.children.length > 100) throw new Error("Invalid filter group")
    return filter.operator === "and" ? filter.children.every(f => matchesGridFilter(row, f, depth + 1)) : filter.children.some(f => matchesGridFilter(row, f, depth + 1))
  }
  const value = Object.prototype.hasOwnProperty.call(row, filter.column) ? (row as Record<string, unknown>)[filter.column] : undefined
  switch (filter.operator) {
    case "eq": return Object.is(value, filter.value)
    case "ne": return !Object.is(value, filter.value)
    case "contains": return String(value ?? "").toLocaleLowerCase().includes(String(filter.value ?? "").toLocaleLowerCase())
    case "in": return Array.isArray(filter.value) && filter.value.some(v => Object.is(v, value))
    case "empty": return value == null || value === ""
    case "gt": return typeof value === "number" && typeof filter.value === "number" && value > filter.value
    case "gte": return typeof value === "number" && typeof filter.value === "number" && value >= filter.value
    case "lt": return typeof value === "number" && typeof filter.value === "number" && value < filter.value
    case "lte": return typeof value === "number" && typeof filter.value === "number" && value <= filter.value
    default: throw new Error("Unsupported filter operator")
  }
}
export type GridPatch = { rowId: string; columnId: string; value: unknown }
export type GridTransaction<T> = { before: T[]; after: T[]; patches: GridPatch[]; reason: "edit" | "bulk" | "paste" | "fill" | "undo" | "redo" }
export type GridSelection = { mode: "ids"; ids: string[] } | { mode: "query"; queryKey: string; excludedIds: string[] }
export function isGridRowSelected(selection: GridSelection, id: string, queryKey: string): boolean {
  return selection.mode === "ids" ? selection.ids.includes(id) : selection.queryKey === queryKey && !selection.excludedIds.includes(id)
}
export function toggleGridRow(selection: GridSelection, id: string, selected: boolean, queryKey: string): GridSelection {
  if (selection.mode === "query" && selection.queryKey === queryKey) return { ...selection, excludedIds: selected ? selection.excludedIds.filter(v => v !== id) : [...new Set([...selection.excludedIds, id])] }
  const ids = selection.mode === "ids" ? selection.ids : []
  return { mode: "ids", ids: selected ? [...new Set([...ids, id])] : ids.filter(v => v !== id) }
}
/** Validate everything before changing any row. ID fields and prototype keys cannot be changed. */
export async function createGridTransaction<T extends { id: string | number }>(rows: T[], patches: GridPatch[], options: {
  reason?: GridTransaction<T>["reason"];
  editable: (row: T, columnId: string) => boolean;
  validate?: (value: unknown, row: T, columnId: string) => string | undefined | Promise<string | undefined>;
}): Promise<GridTransaction<T>> {
  const index = new Map(rows.map(row => [String(row.id), row]))
  if (index.size !== rows.length) throw new Error("Row IDs must be unique")
  const updated = new Map<string, T>()
  for (const patch of patches) {
    const row = index.get(patch.rowId)
    if (!row || unsafe.has(patch.columnId) || !Object.prototype.hasOwnProperty.call(row, patch.columnId) || !options.editable(row, patch.columnId)) throw new Error(`Cell ${patch.rowId}/${patch.columnId} is not editable`)
    updated.set(patch.rowId, { ...(updated.get(patch.rowId) ?? row), [patch.columnId]: patch.value })
  }
  for (const patch of patches) {
    const error = await options.validate?.(patch.value, updated.get(patch.rowId)!, patch.columnId)
    if (error) throw new Error(`${patch.rowId}/${patch.columnId}: ${error}`)
  }
  return { before: rows, after: rows.map(row => updated.get(String(row.id)) ?? row), patches: patches.map(p => ({ ...p })), reason: options.reason ?? "edit" }
}
/** Undo/redo refuses to overwrite concurrent changes and preserves unrelated fields and new rows. */
export function replayGridTransaction<T extends { id: string | number }>(rows: T[], transaction: GridTransaction<T>, direction: "undo" | "redo"): T[] {
  const expected = new Map((direction === "undo" ? transaction.after : transaction.before).map(row => [String(row.id), row]))
  const target = new Map((direction === "undo" ? transaction.before : transaction.after).map(row => [String(row.id), row]))
  const byId = new Map(rows.map(row => [String(row.id), row]))
  const changes = new Map<string, T>()
  for (const patch of transaction.patches) {
    const row = byId.get(patch.rowId), old = expected.get(patch.rowId), next = target.get(patch.rowId)
    if (!row || !old || !next || !Object.is((row as Record<string, unknown>)[patch.columnId], (old as Record<string, unknown>)[patch.columnId])) throw new Error(`Concurrent change in ${patch.rowId}/${patch.columnId}; history was not applied`)
    changes.set(patch.rowId, { ...(changes.get(patch.rowId) ?? row), [patch.columnId]: (next as Record<string, unknown>)[patch.columnId] })
  }
  return rows.map(row => changes.get(String(row.id)) ?? row)
}
export type GridUpdate<T> = { type: "upsert"; row: T } | { type: "delete"; id: string | number }
export function applyGridUpdates<T extends { id: string | number }>(rows: T[], updates: GridUpdate<T>[], dirtyRowIds: readonly string[] = []) {
  const map = new Map(rows.map(row => [String(row.id), row])), dirty = new Set(dirtyRowIds), conflicts: GridUpdate<T>[] = []
  for (const update of updates) {
    const id = String(update.type === "upsert" ? update.row.id : update.id)
    if (dirty.has(id)) { conflicts.push(update); continue }
    if (update.type === "delete") map.delete(id); else map.set(id, update.row)
  }
  return { rows: [...map.values()], conflicts }
}
export type GridSummaryOperation = "sum" | "mean" | "min" | "max" | "count"
export function summarizeGridValues(values: unknown[], operation: GridSummaryOperation): number | null {
  if (operation === "count") return values.length
  const numbers = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
  if (!numbers.length) return operation === "sum" ? 0 : null
  if (operation === "sum" || operation === "mean") return numbers.reduce((a, b) => a + b, 0) / (operation === "mean" ? numbers.length : 1)
  return numbers.reduce((a, b) => operation === "min" ? Math.min(a, b) : Math.max(a, b))
}
/** Quoted TSV parser supporting embedded tabs/newlines and escaped double quotes. */
export function parseGridClipboard(text: string): string[][] {
  if (text.length > 1_000_000) throw new Error("Paste exceeds 1 MB")
  const rows: string[][] = [], cells: string[] = []; let value = "", quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++ } else if (quoted || !value) quoted = !quoted; else value += c }
    else if (!quoted && (c === "\t" || c === "\n" || c === "\r")) {
      cells.push(value); value = ""
      if (c !== "\t") { rows.push(cells.splice(0)); if (c === "\r" && text[i + 1] === "\n") i++ }
    } else value += c
  }
  if (quoted) throw new Error("Unclosed quoted cell")
  if (value || cells.length || !rows.length) { cells.push(value); rows.push(cells) }
  return rows
}
export function gridRangePatches<T extends { id: string | number }>(rows: T[], columns: string[], start: { row: number; column: number }, values: unknown[][]): GridPatch[] {
  if (!Number.isInteger(start.row) || !Number.isInteger(start.column) || start.row < 0 || start.column < 0 || start.row + values.length > rows.length || values.some(v => start.column + v.length > columns.length)) throw new Error("Paste extends beyond the available rows or columns")
  return values.flatMap((cells, r) => cells.map((value, c) => ({ rowId: String(rows[start.row + r].id), columnId: columns[start.column + c], value })))
}
