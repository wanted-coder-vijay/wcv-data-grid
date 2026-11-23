import { useRef, useState } from "react"
import { createGridTransaction, replayGridTransaction, type GridPatch, type GridTransaction } from "./grid-operations"

/** Controlled, atomic edits. Resolve persist only after the server accepts the entire batch. */
export function useGridTransactions<T extends { id: string | number }>(options: {
  rows: T[];
  onChange: (rows: T[]) => void;
  persist?: (transaction: GridTransaction<T>) => Promise<unknown>;
  editable: (row: T, columnId: string) => boolean;
  validate?: (value: unknown, row: T, columnId: string) => string | undefined | Promise<string | undefined>;
  historyLimit?: number;
}) {
  const current = useRef(options); current.current = options
  const locked = useRef(false), history = useRef<GridTransaction<T>[]>([]), future = useRef<GridTransaction<T>[]>([])
  const [pending, setPending] = useState(false), [error, setError] = useState<string>(), [, rerender] = useState(0)
  async function run(action: () => Promise<void>) {
    if (locked.current) throw new Error("An edit is already pending")
    locked.current = true; setPending(true); setError(undefined)
    try { await action(); rerender(v => v + 1) }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save changes"); throw error }
    finally { locked.current = false; setPending(false) }
  }
  async function commit(patches: GridPatch[], reason: GridTransaction<T>["reason"] = "edit") {
    await run(async () => {
      if (!patches.length) return
      const snapshot = current.current.rows
      const transaction = await createGridTransaction(snapshot, patches, { ...current.current, reason })
      // Async validation and persistence must not overwrite a newer controlled snapshot.
      if (current.current.rows !== snapshot) throw new Error("Rows changed during validation; retry the edit")
      await current.current.persist?.(transaction)
      const next = replayGridTransaction(current.current.rows, transaction, "redo")
      current.current.onChange(next)
      history.current.push(transaction)
      history.current = history.current.slice(-Math.max(1, Math.min(1000, current.current.historyLimit ?? 100)))
      future.current = []
    })
  }
  async function travel(direction: "undo" | "redo") {
    await run(async () => {
      const source = direction === "undo" ? history.current : future.current
      const transaction = source[source.length - 1]
      if (!transaction) return
      const snapshot = current.current.rows
      const next = replayGridTransaction(snapshot, transaction, direction)
      const target = new Map(next.map(row => [String(row.id), row]))
      const patches = transaction.patches.map(patch => ({ ...patch, value: (target.get(patch.rowId) as Record<string, unknown>)[patch.columnId] }))
      const change = await createGridTransaction(snapshot, patches, { ...current.current, reason: direction })
      if (current.current.rows !== snapshot) throw new Error("Rows changed during validation; retry history")
      await current.current.persist?.(change)
      current.current.onChange(replayGridTransaction(current.current.rows, change, "redo"))
      source.pop(); (direction === "undo" ? future.current : history.current).push(transaction)
    })
  }
  return { commit, undo: () => travel("undo"), redo: () => travel("redo"), pending, error,
    canUndo: history.current.length > 0, canRedo: future.current.length > 0,
    clearHistory: () => { if (locked.current) return; history.current = []; future.current = []; setError(undefined); rerender(v => v + 1) } }
}
