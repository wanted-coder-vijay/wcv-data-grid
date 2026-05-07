<div align="center">

# @dynostack/react-grid

**Enterprise-grade React data grid. Drop-in.**

Built on [TanStack Table v8](https://tanstack.com/table) · [Radix UI](https://www.radix-ui.com/) · [Tailwind CSS](https://tailwindcss.com/) · ships shadcn/ui look-and-feel out of the box.

[![npm version](https://img.shields.io/npm/v/@dynostack/react-grid.svg?style=flat-square)](https://www.npmjs.com/package/@dynostack/react-grid)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@dynostack/react-grid?style=flat-square)](https://bundlephobia.com/package/@dynostack/react-grid)
[![license](https://img.shields.io/npm/l/@dynostack/react-grid.svg?style=flat-square)](./LICENSE)
[![types](https://img.shields.io/npm/types/@dynostack/react-grid?style=flat-square)](./dist/index.d.ts)

</div>

---

A single `<DataTable />` component that gives you ag-grid–level functionality with a fraction of the API surface and a shadcn/ui aesthetic. Every behavior is opt-in via props — drop it in and it works; configure it and it scales.

## Highlights

- **Filters that actually filter** — text, number, date with operators (`contains`, `not contains`, `equals`, `before`, `after`, `in range`, `blank`, `not blank`, …), AND/OR combine of two conditions, and a set filter with search + select-all
- **Inline editing** — double-click cell to edit, or enter row-edit mode with `Save` / `Cancel`
- **Add row** — local optimistic insert, edit, then commit on save
- **Per-column sort, hide, pin, resize, drag-reorder** — pinned columns are fully opaque while you scroll horizontally
- **Selection + bulk actions** — pinned `__select` column with select-all, clear, bulk delete
- **Expandable rows** — provide a `renderSubRow` panel or use TanStack's nested `getSubRows`
- **CSV / Excel export** — selection-aware (export selected vs. all)
- **Theming** — built on shadcn/ui CSS variables; per-instance overrides with a `theme` prop and ready-made presets
- **Density** — `compact` · `default` · `comfortable`
- **i18n / labels** — every visible string is overridable
- **Feature flags** — turn off any toolbar control or table capability with a single boolean
- **Tiny API, full TypeScript** — one component, fully typed generics, no provider context to wire up

---

## Table of contents

- [Install](#install)
- [Tailwind setup](#tailwind-setup)
- [Theme tokens](#theme-tokens)
- [Quick start](#quick-start)
- [Theming](#theming)
- [Density](#density)
- [Feature flags](#feature-flags)
- [Labels (i18n)](#labels-i18n)
- [Column meta](#column-meta)
- [Editing](#editing)
- [Filters](#filters)
- [Selection & bulk actions](#selection--bulk-actions)
- [Expandable rows](#expandable-rows)
- [Export](#export)
- [Custom row actions](#custom-row-actions)
- [Server-side data](#server-side-data)
- [API reference](#api-reference)
- [Compatibility](#compatibility)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Install

```sh
npm i @dynostack/react-grid
# or
pnpm add @dynostack/react-grid
# or
yarn add @dynostack/react-grid
```

**Peer deps:** `react >= 18`, `react-dom >= 18`. All other deps (`@tanstack/react-table`, `radix-ui`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`) are bundled.

## Tailwind setup

The component ships Tailwind class names verbatim. Tell your Tailwind config to scan the package files:

```js
// tailwind.config.{js,ts}
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@dynostack/react-grid/dist/**/*.{js,mjs,cjs}",
  ],
}
```

> Tailwind v4? Add the same path to your `@source` directive instead.

## Theme tokens

If your app already has [shadcn/ui](https://ui.shadcn.com/docs/theming) tokens defined on `:root`, you're done — the table inherits them automatically.

If not, import the default-tokens stylesheet once:

```ts
import "@dynostack/react-grid/styles.css"
```

Either way you can still override any token per-instance via the [`theme`](#theming) prop.

---

## Quick start

```tsx
import { DataTable } from "@dynostack/react-grid"
import "@dynostack/react-grid/styles.css" // optional — only if you don't have shadcn tokens

type User = {
  id: number
  name: string
  email: string
  role: "admin" | "viewer"
  joinedAt: string
}

const columns = [
  { accessorKey: "id", header: "ID", size: 70 },
  {
    accessorKey: "name",
    header: "Name",
    meta: { label: "Name", editor: "text", filterType: "text" },
  },
  {
    accessorKey: "email",
    header: "Email",
    meta: { label: "Email", editor: "text", filterType: "text" },
  },
  {
    accessorKey: "role",
    header: "Role",
    meta: {
      label: "Role",
      editor: "select",
      filterType: "multi-select",
      selectOptions: [
        { value: "admin", label: "Admin" },
        { value: "viewer", label: "Viewer" },
      ],
    },
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
    meta: { label: "Joined", editor: "date", filterType: "date" },
  },
]

export function Users({ data }: { data: User[] }) {
  return (
    <DataTable<User>
      data={data}
      columns={columns}
      onCellEdit={(row, columnId, value) => save({ ...row, [columnId]: value })}
      onRowSave={(row, draft) => save({ ...row, ...draft })}
      onAddRow={() => ({ name: "", email: "", role: "viewer", joinedAt: today() })}
      onBulkDelete={(rows) => removeMany(rows.map((r) => r.id))}
      initialColumnPinning={{ left: ["__select", "id", "name"], right: ["__actions"] }}
    />
  )
}
```

That's it. You now have sort + filter + edit + add + delete + export + pin + resize + reorder + select.

---

## Theming

All shadcn tokens are supported plus `radius` and `fontFamily`. Anything you omit falls through to the consumer's `:root`.

### Use a preset

```tsx
import { DataTable, themePresets } from "@dynostack/react-grid"

<DataTable data={data} columns={columns} theme={themePresets.violet} />
```

Available presets: `light` · `dark` · `emerald` · `violet` · `amber`.

### Custom tokens

```tsx
<DataTable
  data={data}
  columns={columns}
  theme={{
    primary: "oklch(0.6 0.2 200)",
    primaryForeground: "oklch(1 0 0)",
    accent: "oklch(0.94 0.05 200)",
    radius: "0.25rem",
    fontFamily: "Inter, system-ui, sans-serif",
  }}
/>
```

CSS variables are emitted on the table root, so multiple instances on the same page can wear different themes.

### Compose with a preset

```tsx
<DataTable
  theme={{ ...themePresets.dark, primary: "oklch(0.7 0.18 250)" }}
/>
```

---

## Density

```tsx
<DataTable density="compact"     /* tighter rows */ />
<DataTable density="default"     /* shadcn defaults */ />
<DataTable density="comfortable" /* extra padding */ />
```

---

## Feature flags

Every toolbar control and table capability is a switch. Defaults are sensible — only set what you want to disable.

```tsx
<DataTable
  features={{
    search: true,            // global search input
    refresh: true,           // refresh button (when onRefresh is provided)
    columnVisibility: true,  // columns popover
    export: true,            // CSV / Excel menu
    addRow: true,            // "Add row" button (when onAddRow is provided)
    pagination: true,        // bottom pagination bar
    sorting: true,           // sort headers
    filtering: true,         // per-column filter popovers
    resizing: true,          // resize handles
    reordering: true,        // drag-to-reorder columns
    pinning: true,           // pin / unpin column controls
  }}
/>
```

---

## Labels (i18n)

Every user-facing string is overridable.

```tsx
<DataTable
  labels={{
    search: "Rechercher...",
    addRow: "Ajouter",
    delete: "Supprimer",
    clear: "Effacer",
    selected: "sélectionné(s)",
    refresh: "Actualiser",
    columns: "Colonnes",
    export: "Exporter",
    csv: "CSV",
    excel: "Excel",
    total: "Total",
    noData: "Aucune donnée.",
    noResults: "Aucun résultat.",
    refreshing: "Actualisation",
    rowsPerPage: "Lignes par page",
    page: "Page",
    of: "sur",
  }}
/>
```

---

## Column meta

Each column can declare:

```ts
type ColumnMeta = {
  label?: string                       // header label & filter title
  editor?:
    | "text" | "number" | "currency" | "date"
    | "select" | "switch" | "checkbox"
  filterType?:
    | "text" | "number" | "date"
    | "select" | "multi-select" | "boolean"
  selectOptions?: { value: string; label: string }[]
  align?: "left" | "right" | "center"
  cellClassName?: string
  headerClassName?: string
  exportable?: boolean
  isEditable?: boolean | ((row) => boolean)
  badgeMap?: Partial<
    Record<string,
      "default" | "secondary" | "destructive" |
      "success" | "warning" | "outline"
    >
  >
}
```

The default `filterFn` for a column is wired automatically from `meta.filterType`. You can still set a custom `filterFn` on the column to override it.

---

## Editing

Two modes, both prop-driven, both work simultaneously:

### Single cell — double-click

```tsx
<DataTable
  onCellEdit={(row, columnId, value) =>
    saveMutation.mutate({ ...row, [columnId]: value })
  }
/>
```

### Whole row — Edit action → Save / Cancel

```tsx
<DataTable
  onRowSave={(row, draft) =>
    saveMutation.mutate({ ...row, ...draft })
  }
/>
```

`isEditable` on `meta` can disable editing for individual rows or columns:

```tsx
{
  accessorKey: "email",
  meta: {
    editor: "text",
    isEditable: (row) => row.role !== "billing",
  },
}
```

---

## Filters

The package exports the filter primitives so you can build custom panels too:

```ts
import {
  textFilterFn,
  numberFilterFn,
  dateFilterFn,
  setFilterFn,
  booleanFilterFn,
  type AdvFilter,
  type SetFilter,
  type TextOp,
  type NumberOp,
  type DateOp,
} from "@dynostack/react-grid"
```

| `filterType`   | Operators                                                                                                                  | Value shape                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `text`         | `contains`, `notContains`, `equals`, `notEqual`, `startsWith`, `endsWith`, `blank`, `notBlank`                             | `AdvFilter<TextOp, string>`                          |
| `number`       | `equals`, `notEqual`, `lessThan`, `lessThanOrEqual`, `greaterThan`, `greaterThanOrEqual`, `inRange`, `blank`, `notBlank`   | `AdvFilter<NumberOp, number>`                        |
| `date`         | `equals`, `notEqual`, `before`, `after`, `inRange`, `blank`, `notBlank`                                                   | `AdvFilter<DateOp, string>`                          |
| `select`       | set filter                                                                                                                 | `SetFilter` (`{ selected: string[] }`)               |
| `multi-select` | set filter                                                                                                                 | `SetFilter` (`{ selected: string[] }`)               |
| `boolean`      | `All` / `True` / `False`                                                                                                   | `boolean \| undefined`                               |

Text/number/date panels also expose **AND/OR combine** of a second condition, ag-grid style.

The set filter automatically derives unique values from the visible rows when `selectOptions` is not declared — search box, "Select all (filtered)" with indeterminate state, individual checkboxes.

---

## Selection & bulk actions

Selection is on by default (`enableSelection: true`). When any row is selected the toolbar swaps in:

- A `<count> selected` badge
- `Delete` button → wires to `onBulkDelete?(rows)`
- `Clear` button → resets selection

```tsx
<DataTable
  onBulkDelete={(rows) => removeMany(rows.map((r) => r.id))}
/>
```

---

## Expandable rows

### Sub-row panel (custom JSX)

```tsx
<DataTable
  renderSubRow={(row) => <UserAuditPanel user={row} />}
/>
```

### Nested rows (TanStack `getSubRows`)

```tsx
<DataTable
  getSubRows={(row) => row.children}
/>
```

When either is set, an `__expand` chevron column is added and pinned right next to `__select`.

---

## Export

```tsx
<DataTable exportFileName="users" />
```

Toolbar `Export` menu offers **CSV** and **Excel**. If any rows are selected, the menu becomes "Export N selected"; otherwise it exports all visible (filtered) rows.

Mark a column non-exportable via `meta.exportable: false`.

---

## Custom row actions

```tsx
<DataTable
  rowActions={["view", "edit", "duplicate", "delete"]}
  customRowActions={[
    {
      id: "suspend",
      label: "Suspend",
      icon: <BanIcon />,
      danger: true,
      show: (r) => r.status !== "suspended",
    },
    { id: "archive", label: "Archive", icon: <ArchiveIcon /> },
  ]}
  onRowAction={(action, row) => {
    if (action === "delete") deleteMutation.mutate([row.id])
    if (action === "suspend") saveMutation.mutate({ ...row, status: "suspended" })
    // ...
  }}
/>
```

---

## Server-side data

Provide a controlled global filter and refetch on change:

```tsx
const [q, setQ] = useState("")
const usersQuery = useQuery({
  queryKey: ["users", q],
  queryFn: () => fetchUsers({ q }),
})

<DataTable
  data={usersQuery.data ?? []}
  isLoading={usersQuery.isLoading}
  isFetching={usersQuery.isFetching}
  onRefresh={() => usersQuery.refetch()}
  globalFilter={q}
  onGlobalFilterChange={setQ}
  totalRecords={usersQuery.data?.length ?? 0}
/>
```

Pair with TanStack Query's pagination/cursor utilities for cursor-based grids.

---

## API reference

| Prop                      | Type                                                       | Default                | Description                                            |
| ------------------------- | ---------------------------------------------------------- | ---------------------- | ------------------------------------------------------ |
| `data`                    | `TData[]`                                                  | —                      | Row data.                                              |
| `columns`                 | `ColumnDef<TData>[]`                                       | —                      | TanStack column definitions.                           |
| `isLoading`               | `boolean`                                                  | `false`                | Initial skeleton state.                                |
| `isFetching`              | `boolean`                                                  | `false`                | Background-refresh indicator.                          |
| `onRefresh`               | `() => void`                                               | —                      | Refresh button handler.                                |
| `totalRecords`            | `number`                                                   | `data.length`          | Total count badge in toolbar.                          |
| `exportFileName`          | `string`                                                   | `"export"`             | Base filename for CSV / Excel export.                  |
| `enableSelection`         | `boolean`                                                  | `true`                 | Show the `__select` column.                            |
| `renderSubRow`            | `(row: TData) => ReactNode`                                | —                      | Custom expandable panel.                               |
| `getSubRows`              | `(row: TData) => TData[] \| undefined`                     | —                      | Nested rows accessor.                                  |
| `rowActions`              | `("view" \| "edit" \| "duplicate" \| "delete")[]`          | all four               | Built-in row actions.                                  |
| `customRowActions`        | `CustomRowAction<TData>[]`                                 | `[]`                   | Extra row actions.                                     |
| `onRowAction`             | `(action, row) => void`                                    | —                      | Row action handler.                                    |
| `onCellEdit`              | `(row, columnId, value) => void`                           | —                      | Single-cell save handler.                              |
| `onRowSave`               | `(row, draft) => void`                                     | —                      | Row-edit save handler.                                 |
| `onAddRow`                | `() => Partial<TData>`                                     | —                      | Returns the empty draft for "Add row".                 |
| `onBulkDelete`            | `(rows: TData[]) => void`                                  | —                      | Bulk delete handler.                                   |
| `initialPageSize`         | `number`                                                   | `10`                   | Initial pagination size.                               |
| `pageSizeOptions`         | `number[]`                                                 | shadcn defaults        | Page-size dropdown options.                            |
| `initialColumnPinning`    | `ColumnPinningState`                                       | `{ left: [], right: [] }` | Initial pinned columns.                            |
| `initialColumnVisibility` | `VisibilityState`                                          | `{}`                   | Initial hidden columns.                                |
| `globalFilter`            | `string`                                                   | uncontrolled           | Controlled global filter value.                        |
| `onGlobalFilterChange`    | `(value: string) => void`                                  | —                      | Controlled global filter setter.                       |
| `className`               | `string`                                                   | —                      | Extra classes on the table root.                       |
| `toolbarSlot`             | `ReactNode`                                                | —                      | Custom JSX prepended into the toolbar.                 |
| `features`                | `DataTableFeatures`                                        | all on                 | Feature flags.                                         |
| `labels`                  | `DataTableLabels`                                          | English defaults       | i18n labels.                                           |
| `density`                 | `"compact" \| "default" \| "comfortable"`                  | `"default"`            | Row density.                                           |
| `theme`                   | `DataTableTheme`                                           | inherits `:root`       | Per-instance CSS-variable overrides.                   |

`TData` must extend `{ id: string \| number }`.

---

## Compatibility

| Stack             | Tested on                  |
| ----------------- | -------------------------- |
| React             | 18.x · 19.x                |
| TanStack Table    | 8.21+                      |
| Tailwind CSS      | 3.x · 4.x                  |
| Bundler           | Vite · Next.js · Webpack 5 |

ESM and CJS bundles ship side-by-side. Tree-shakeable. Marked `"use client"` for Next.js App Router compatibility.

---

## Roadmap

- [ ] Server-side pagination/sorting helpers (controlled-state recipes)
- [ ] Column groups (header rowSpan/colSpan)
- [ ] Pivot mode
- [ ] Aggregation row (sum, avg, min, max, count)
- [ ] Saved view profiles (filter + visibility + pinning snapshots)
- [ ] Virtualized rows (TanStack Virtual integration)
- [ ] Storybook + visual regression tests
- [ ] CodeSandbox / StackBlitz starter

Have a use case that isn't covered? [Open an issue](https://github.com/wanted-coder-vijay/wcv-data-grid/issues/new) — happy to consider it.

---

## Contributing

```sh
git clone https://github.com/wanted-coder-vijay/wcv-data-grid.git
cd wcv-data-grid
npm install
npm run dev       # tsup --watch
npm run typecheck # tsc --noEmit
npm run build     # produce dist/
```

PRs welcome. Please keep the prop API additive — feature toggles over breaking changes.

---

## License

[Apache-2.0](./LICENSE) · Copyright © 2026 vijay kumar anchupogu (wanted-coder-vijay)

See [NOTICE](./NOTICE) for attribution requirements.

> **Package history.** This package was briefly published as
> `@dynostack/gridstack@0.1.0` under the MIT license before being
> renamed to `@dynostack/react-grid` and relicensed under Apache-2.0.
> The old name is deprecated; new code should depend on
> `@dynostack/react-grid` only.
