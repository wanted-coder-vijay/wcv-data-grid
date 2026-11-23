# Grid operations and API integrations

React Grid and React Studio are independent packages. Install `@dynostack/react-grid` for tables and `@dynostack/react-studio` for the eight builders. Neither package imports the other. Studio has React and React DOM peers and standalone CSS; Grid retains its TanStack/Radix dependencies and optional ExcelJS adapter.

## Grouping, aggregation and summaries

```tsx
<DataTable
  data={rows}
  columns={[
    { accessorKey: 'department' },
    { accessorKey: 'budget', aggregationFn: 'sum', meta: {
      editor: 'currency', format: { locale: 'en-IN', currency: 'INR' },
    } },
  ]}
  features={{ grouping: true }}
  initialGrouping={['department']}
  summary={{ scope: 'filtered', columns: { budget: 'sum' } }}
/>
```

Grouping is opt-in. Multiple group columns are ordered; the toolbar toggles them and expands/collapses groups. `state.grouping`, `initialState.grouping`, saved views, native TanStack `aggregationFn` and `aggregatedCell` are supported. Group rows cannot be edited or sent to row actions. Exports contain original records. Pagination counts displayed rows/groups. `summary.scope` is `page`, `filtered`, or `server`; server-wide totals require `summary.values`, because a page cannot calculate a complete query total. A collapsed group contributes its descendant records to its page summary.

Server data sources use manual grouping. Implement grouping in your adapter and return trees using `getSubRows`; grouping IDs and `filterExpression` are included in fetch parameters. Server tree presentation uses expansion; it does not manufacture TanStack aggregation metadata or query-wide totals from loaded rows.

## Atomic edits and history

```tsx
const edits = useGridTransactions({
  rows,
  onChange: setRows,
  editable: (row, columnId) => columnId === 'budget' && !row.locked,
  validate: (value, mergedRow, columnId) =>
    columnId === 'budget' && Number(value) < 0 ? 'Budget must be positive' : undefined,
  persist: async change => {
    const response = await fetch('/api/grid/transactions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: change.reason, patches: change.patches }),
    })
    if (!response.ok) throw new Error('Transaction rejected')
  },
})
<DataTable data={rows} columns={columns}
  onCellEdit={(row, columnId, value) => edits.commit([
    { rowId: String(row.id), columnId, value },
  ])}
  onRowSave={(row, draft) => edits.commit(Object.entries(draft).map(([columnId, value]) =>
    ({ rowId: String(row.id), columnId, value })))}
  toolbarSlot={<><button disabled={edits.pending || !edits.canUndo} onClick={() => edits.undo().catch(showError)}>Undo</button>
    <button disabled={edits.pending || !edits.canRedo} onClick={() => edits.redo().catch(showError)}>Redo</button></>}
/>
```

`createGridTransaction` validates a whole batch before changing any record. Bulk/paste/fill reuse `edits.commit(patches, reason)`. Errors reject the promise and preserve the current data. IDs, unknown fields and prototype keys cannot be edited. The caller supplies the authoritative editable/validation rules; these do not authorize writes on a server. The persistence endpoint must accept or reject the complete batch atomically. Independently saving each row does not provide that guarantee. Per-row partial-success reconciliation is deliberately not built into this atomic contract.

History defaults to 100 transactions (configurable, maximum 1000). Undo/redo persists through the same adapter and checks for concurrent changes in affected cells. Unrelated updates and new rows are preserved. If persistence succeeds but a conflicting live update prevents local application, reload authoritative server state. Use `clearHistory()` after loading another data set. Empty/new rows must be inserted separately before applying transactions. Immutable rows are required; mutating an object in place breaks snapshots.

## Spreadsheet operations

`parseGridClipboard(text)` parses quoted TSV, including embedded tabs/newlines. `gridRangePatches(rows, columnIds, {row, column}, values)` produces a bounded rectangle of patches. Convert text to your column's data types, then commit with reason `paste`. Fill-down generates patches copying the first selected row's value and commits with reason `fill`. These helpers do not evaluate spreadsheet formulas. They are headless contracts; the API lab offers explicit paste coordinates and fill controls. Mouse-drag selection, automatic system clipboard shortcuts and Excel formula evaluation are not provided.

## Query selection across server pages

```tsx
const queryKey = JSON.stringify({ filters, search, tenantId }) // membership, not page number
const selected = useGridQuerySelection({ rowIds: rows.map(r => String(r.id)), queryKey, totalRecords })
<DataTable data={rows} columns={columns}
  state={{ rowSelection: selected.rowSelection }}
  onStateChange={next => selected.onRowSelectionChange(next.rowSelection)}
  toolbarSlot={<button onClick={selected.selectQuery}>Select all matching records</button>}
/>
// Pass selected.selection to your bulk endpoint:
// {mode:'query', queryKey, excludedIds:[...]} or {mode:'ids', ids:[...]}
```

The hook projects selection into loaded rows and retains exclusions across pages. Changing `queryKey` invalidates selection. Include every criterion affecting membership, including tenant and permissions. Your backend must validate/resolve the query key, enforce authorization and perform bulk operations; never trust an arbitrary client key as a database predicate. `onSelectionChange` and exports still contain loaded records only. Query totals must be authoritative and count excluded IDs belonging to that query.

## Filters, formatting and live updates

`parseGridFilter` validates a nested JSON expression; `matchesGridFilter` evaluates it. Groups use `{operator:'and'|'or', children:[...]}`. Conditions use `{column, operator, value}`; operators are `eq`, `ne`, `contains`, `gt`, `gte`, `lt`, `lte`, `in`, `empty`. Equality is typed, numeric comparisons require numbers, nesting is limited to 16 levels. `filterExpression` applies before column filters in client mode and is forwarded unchanged in server mode. Translate it using parameterized backend queries, never string concatenation.

Set `format={{locale:'en-IN', currency:'INR', timeZone:'Asia/Kolkata'}}` globally or override it per column with `meta.format`. Built-in currency, numeric and date editors use these values. Use valid Intl locale/currency/time-zone values. `direction='rtl'` controls layout direction; pinning remains physical left/right. `meta.formatValue(value,row)` provides custom display and `meta.cellStyle(value,row)` provides conditional cell styles. Declarative `conditionalFormatting={[{filter, columnId, style}]}` applies matching row rules to cells; later matching rules win. Group rows are excluded.

`meta.renderEditor({value,row,columnId,disabled,errorId,onChange,onCommit,onCancel})` supports consumer React editors and the existing validation/persistence path. Honor disabled/error accessibility props and explicitly commit or cancel. Use `meta.isEditable` for read-only cells. Custom components own their internal keyboard behavior.

`applyGridUpdates(rows, updates, dirtyRowIds)` supports upsert/delete events and returns `{rows, conflicts}`. Dirty records are not overwritten; resolve conflicts through your application. Transport, subscriptions, version tokens and ordering are application responsibilities. Fetch adapters now receive an optional `signal`; pass it to fetch to abort superseded requests. Synchronous adapter throws are caught by the grid's existing error UI.

## Editable API lab

Open `/api-playground` in the showcase. Edit `load(params)`, `save(change)`, column JSON and grid props. The lab operates on a fully loaded client array, supports public/custom API URLs, and exports an integration source file. The main `DataTable.dataSource` API additionally supports server pagination/sorting/filtering.

Each code run executes in a disposable worker inside an opaque-origin sandbox frame. It cannot access the application's DOM or storage. Runs time out after 20 seconds and can be cancelled. Browser CORS rules apply, including origin `null` for the sandbox. Production secrets belong on your backend. Network requests can create effects on APIs your code calls; the sandbox does not undo those effects. Returned data is limited to 50,000 uniquely identified records and 10 MB. The JSONPlaceholder example simulates writes and is not durable.

This release does not claim complete enterprise parity: cross-browser visual baselines, drag-selected spreadsheet ranges, a visual nested-filter tree editor, and per-row partial-success bulk reconciliation remain documented limitations.
