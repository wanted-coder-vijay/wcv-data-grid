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
- **Built-in row Details panel** — `View` opens a scoped sheet with compact, relaxed, and comfy field layouts
- **Scoped delete confirmation** — row and bulk delete confirmations stay inside the table instead of covering the entire app
- **Theming that just works** — shadcn-compatible CSS variables, automatic OS dark-mode follow, cascade-layered defaults that never overwrite your app theme, full-repaint moded presets (`violet`, `emerald`, `amber`, `rose`, `sky`, `slate`, …), `buildPreset(hue)` for custom hues, and `isolate` to opt out of inheriting the app theme
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
- [Data fetching](#data-fetching)
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
- [View sheet](#view-sheet)
- [Delete confirmation](#delete-confirmation)
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

The component ships Tailwind class names verbatim, so your Tailwind build needs to know two things:

1. **Where to scan** for the class strings inside the bundle.
2. **Which semantic color tokens** (`bg-popover`, `bg-card`, `text-foreground`, …) exist.

The package's `styles.css` registers the tokens for you via Tailwind v4's `@theme inline`. You only need to wire scanning.

### Tailwind v4 — zero config

```css
/* your global stylesheet (e.g. src/index.css) */
@import "tailwindcss";
@source "../node_modules/@dynostack/react-grid/dist";
@import "@dynostack/react-grid/styles.css";
@import "@dynostack/react-grid/page.css";   /* optional: extend tokens to <body> */
```

That's the whole setup. No `tailwind.config.js`, no `@theme` block to copy-paste, no shadcn install required. Overlay surfaces (popovers, dropdowns, sheets, the row-actions menu) all render correctly out of the box.

### Tailwind v3

v3 doesn't read CSS `@theme` directives, so the semantic-color mapping has to live in your `tailwind.config.js`. The shadcn install guide for v3 covers the exact `theme.extend.colors` block you need — copy that, plus add the package's `dist` to your `content` array:

```js
// tailwind.config.{js,ts}
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@dynostack/react-grid/dist/**/*.{js,mjs,cjs}",
  ],
  theme: {
    extend: {
      colors: {
        // copy the shadcn v3 color mapping here
        // (background, foreground, card, popover, primary, secondary,
        //  muted, accent, destructive, border, input, ring)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // … etc
      },
    },
  },
}
```

Then import `styles.css` as usual:

```ts
import "@dynostack/react-grid/styles.css"
```

> Starting a new project? **Use Tailwind v4.** The v4 path above is meaningfully simpler — the package handles token registration for you.

## Theme tokens

The grid is built on **shadcn/ui CSS variables**. It auto-adjusts to whatever theme your app already has:

| Your app has… | What you do | What you get |
|---|---|---|
| Nothing (bare React) | `import "@dynostack/react-grid/styles.css"` | Clean light theme, auto-switches to dark on OS preference. |
| shadcn/ui (default theme) | Nothing | Grid inherits your `:root` tokens automatically. |
| shadcn/ui with a custom theme (Stone / Zinc / your own hue) | Nothing | Grid picks up your custom tokens automatically. |
| Custom theme using shadcn token names | Nothing | Same as above. |
| Custom theme with non-shadcn names | Pass [`theme` prop](#theming) | Per-instance override mapped to shadcn vars. |
| Want one grid to ignore the app theme | Pass `isolate` | Grid uses bundled defaults regardless of `:root`. |

**Why this just works.** The bundled `styles.css`:

1. **Registers Tailwind v4 utility tokens** via a top-level `@theme inline` block — so `bg-popover`, `text-foreground`, `border-border`, etc. resolve to your tokens without any consumer-side `@theme` block.
2. **Declares variable values inside the `dynostack-grid-defaults` cascade layer** — any unlayered consumer rule (which is where shadcn and most app CSS lives) automatically wins, regardless of import order. You can't accidentally overwrite your app's theme by importing the grid's stylesheet.

### Minimal install (Tailwind v4)

```css
/* your global stylesheet */
@import "tailwindcss";
@source "../node_modules/@dynostack/react-grid/dist";
@import "@dynostack/react-grid/styles.css";
```

See the [Tailwind setup](#tailwind-setup) section for v3.

### Optional: extend the theme to the page

By default the grid only styles itself, not the surrounding page. If you want `<body>` to use the same background/foreground as the grid:

```ts
import "@dynostack/react-grid/styles.css"
import "@dynostack/react-grid/page.css"   // optional
```

### Dark mode

| Mode | How to enable | Behavior |
|---|---|---|
| Follow OS | Default — no action required | Light by day, dark by night via `prefers-color-scheme`. |
| Force light | Add `class="light"` to `<html>` | Stays light regardless of OS. |
| Force dark | Add `class="dark"` to `<html>` | Stays dark regardless of OS. |
| Per-instance | `<DataTable theme={themePresets.violet}>` | Grid auto-flips light/dark inside the moded preset. |

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

## Data fetching

`DataTable` supports two data ownership models.

### 1. Controlled data from your page

Use this when your app already owns fetching with TanStack Query, SWR, Redux,
loader functions, or custom hooks. The table receives rows and loading flags as
props, and your app owns error/toast behavior.

```tsx
const usersQuery = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
})

<DataTable<User>
  data={usersQuery.data ?? []}
  columns={columns}
  isLoading={usersQuery.isLoading}
  isFetching={usersQuery.isFetching}
  onRefresh={() => usersQuery.refetch()}
  totalRecords={usersQuery.data?.length ?? 0}
/>
```

For blocking load errors, render your own page-level error state or pass an empty
array. For background errors, show a toast from your query/mutation callbacks.

### 2. Internal fetching with `dataSource`

Use this when you want the table to own fetch/loading/error/refresh state.
`fetchRows` receives the current table state and can return either an array or
`{ rows, totalRecords }`.

```tsx
<DataTable<User>
  columns={columns}
  dataSource={{
    fetchRows: async ({ pageIndex, pageSize, sorting, columnFilters, globalFilter }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pageIndex,
          pageSize,
          sorting,
          columnFilters,
          q: globalFilter,
        }),
      })

      if (!res.ok) throw new Error("Failed to load users")
      return res.json() as Promise<{ rows: User[]; totalRecords: number }>
    },
    mode: "server",
    onError: (error, context) => {
      toast.error(context.message)
      console.error(error)
    },
  }}
/>
```

Internal mode behavior:

- Initial load shows the table skeleton.
- Initial load failure shows an inline `Could not load rows` state with `Retry`.
- Refresh failure keeps the last successful rows visible and calls `onError`.
- `mode: "client"` expects the full row array and lets the table sort/filter/page in memory.
- `mode: "server"` expects the current page and uses `totalRecords` for pagination.

Keep using `onCellEdit`, `onRowSave`, `onAddRow`, and `onBulkDelete` for mutations.
The table does not assume your write API; this lets you choose optimistic updates,
rollback, toast notifications, and validation.

---

## Theming

The `theme` prop accepts **two shapes**. Pick whichever fits your use case.

### Shape 1 — Flat tokens

```tsx
<DataTable
  theme={{
    primary: "oklch(0.6 0.2 200)",
    primaryForeground: "oklch(1 0 0)",
    accent: "oklch(0.94 0.05 200)",
    radius: "0.25rem",
    fontFamily: "Inter, system-ui, sans-serif",
  }}
/>
```

All shadcn tokens are supported plus `radius` and `fontFamily`. Anything you omit falls through to whatever your app's `:root` provides.

### Shape 2 — Moded `{ light, dark }`

A moded theme repaints the whole table **and** auto-flips on dark mode (OS preference *or* a `.dark` ancestor):

```tsx
<DataTable
  theme={{
    light: { background: "oklch(0.99 0.005 285)", primary: "oklch(0.55 0.22 285)", /* … */ },
    dark:  { background: "oklch(0.16 0.012 285)", primary: "oklch(0.7  0.18 285)", /* … */ },
  }}
/>
```

The grid emits a tiny scoped `<style>` block that targets only this instance — multiple grids on the same page can wear different moded themes without interfering.

### Use a preset

Presets ship in **moded shape** — passing one repaints the entire table and follows dark mode automatically:

```tsx
import { DataTable, themePresets } from "@dynostack/react-grid"

<DataTable theme={themePresets.violet} />
```

Available presets:

| Preset | Hue |
|---|---|
| `neutral` | Grayscale (default appearance) |
| `light` | Force light, no dark variant |
| `dark` | Force dark, no light variant |
| `violet` | 285° |
| `emerald` | 162° |
| `amber` | 65° |
| `rose` | 15° |
| `sky` | 235° |
| `slate` | 240° (low chroma) |

### Build a custom preset from a single hue

```tsx
import { DataTable, buildPreset } from "@dynostack/react-grid"

const teal = buildPreset(180)        // hue only
const subtleTeal = buildPreset(180, 0.015)  // hue + custom chroma

<DataTable theme={teal} />
```

`buildPreset(hue, chroma?)` returns a full `{ light, dark }` token set tinted around the given OKLCH hue.

### Compose with a preset

```tsx
<DataTable
  theme={{
    ...themePresets.violet,
    light: { ...themePresets.violet.light, primary: "oklch(0.7 0.18 250)" },
  }}
/>
```

### Isolate a grid from the app theme

When embedding inside a heavily-themed shell where you want the table to keep its own look:

```tsx
<DataTable isolate /* uses bundled neutral tokens, ignores app :root */ />
<DataTable isolate theme={themePresets.violet} /* isolated AND violet */ />
```

### Multiple grids, different themes

CSS variables are emitted on each table root, so this works:

```tsx
<DataTable theme={themePresets.violet} />
<DataTable theme={themePresets.emerald} />
<DataTable theme={{ primary: "oklch(0.6 0.2 200)" }} />
```

### Precedence summary

```
┌──────────────────────────────────────────────────────────┐
│ Inline style on the grid root  (per-instance `theme`)    │  ← highest
├──────────────────────────────────────────────────────────┤
│ Consumer's :root rules         (shadcn, custom app CSS)  │
├──────────────────────────────────────────────────────────┤
│ @layer dynostack-grid-defaults (bundled styles.css)      │  ← lowest
└──────────────────────────────────────────────────────────┘
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
- `Delete` button → opens the confirmation dialog first, then calls `onBulkDelete?(rows)` after confirm
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

## View sheet

Click the row action "View" → a right-side `Sheet` slides in showing every visible column as a `{Label}: {value}` card. The user can switch layout density inline:

| Option | Layout | Intended use |
| --- | --- | --- |
| `Compact` | 3 columns, tighter cards | Scan more fields at once. |
| `Relaxed` | 2 columns, medium spacing | Balanced default for mixed values. |
| `Comfy` | 1 column, roomier cards | Read long values without cramped wrapping. |

The sheet is responsive and wider on desktop so the multi-column modes have enough room for real row data.

Works out of the box with no props. Customize via `viewSheet`:

```tsx
<DataTable
  viewSheet={{
    side: "right",                              // or "left"
    defaultDensity: "relaxed",                  // initial layout density
    hideDensityTabs: true,                      // hide the layout picker
    fields: ["name", "email", "role"],          // limit / reorder shown columns
    renderField: ({ column, value, row }) =>    // override how a value renders
      column.id === "phone" ? <a href={`tel:${value}`}>{String(value)}</a> : null,
    renderHeader: (row) => <YourCustomHeader row={row} />,
    labels: {
      title: (row) => `${row.name} (${row.role})`,
      description: (row) => `Joined ${row.joinedAt}`,
      emptyValue: "—",
      density: { compact: "3 cols", relaxed: "2 cols", comfy: "1 col" },
    },
  }}
  onView={(row) => track("user.view", row)}   // optional side-effect
/>
```

Disable the built-in sheet entirely:

```tsx
<DataTable viewSheet={false} onView={(row) => router.push(`/users/${row.id}`)} />
```

`onView` fires before the sheet opens, so you can navigate / log / fetch alongside it.

---

## Delete confirmation

Both the row-action "Delete" and the toolbar "Bulk delete" open a confirmation `AlertDialog` by default. The user must confirm before `onDelete` or `onBulkDelete` fires.

The dialog is mounted inside the DataTable portal container, so its blur / dim overlay covers only that table instance. It does not block or blur the rest of the page.

```tsx
<DataTable
  onDelete={(row) => api.deleteUser(row.id)}
  onBulkDelete={(rows) => api.bulkDelete(rows.map(r => r.id))}
  confirmDelete={{
    title: ({ rows, source }) =>
      source === "bulk"
        ? `Delete ${rows.length} users?`
        : `Delete ${rows[0].name}?`,
    description: ({ rows }) =>
      `${rows.length === 1 ? "This user" : "These users"} will be permanently removed. This cannot be undone.`,
    confirmLabel: "Yes, delete",
    cancelLabel: "Keep",
  }}
/>
```

Use `onDelete` for the built-in row delete action. Do not put the actual delete mutation in `onRowAction("delete")`, because the built-in delete action is handled by the confirmation flow.

Skip the dialog (fire immediately):

```tsx
<DataTable confirmDelete={false} onDelete={(row) => softDelete(row)} />
```

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
    if (action === "suspend") saveMutation.mutate({ ...row, status: "suspended" })
    // ...
  }}
  onDelete={(row) => deleteMutation.mutate([row.id])}
/>
```

---

## Server-side data

You can do server-side data in either mode.

### Controlled server-side data

Own the API call in your page and pass the result into the table:

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

Pair this with TanStack Query's pagination/cursor utilities when you want query
caching and mutation orchestration outside the grid.

### Built-in server-side data

Let the grid call your API by setting `dataSource.mode` to `"server"`:

```tsx
<DataTable<User>
  columns={columns}
  dataSource={{
    mode: "server",
    fetchRows: async (state) => {
      const res = await fetch("/api/users/grid", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      })

      if (!res.ok) throw new Error("Users request failed")
      return res.json() as Promise<{ rows: User[]; totalRecords: number }>
    },
    onError: (_error, context) => {
      toast.error(context.message)
    },
  }}
/>
```

`state` contains `pageIndex`, `pageSize`, `sorting`, `columnFilters`, and
`globalFilter`. In server mode the table assumes the API already applied those
operations and only renders the returned page.

---

## API reference

| Prop                      | Type                                                       | Default                | Description                                            |
| ------------------------- | ---------------------------------------------------------- | ---------------------- | ------------------------------------------------------ |
| `data`                    | `TData[]`                                                  | `[]`                   | Controlled row data. Use this when fetching outside the table. |
| `columns`                 | `ColumnDef<TData>[]`                                       | —                      | TanStack column definitions.                           |
| `dataSource`              | `DataTableDataSource<TData>`                               | —                      | Optional internal fetcher for client/server data loading. |
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
| `theme`                   | `DataTableTheme`                                           | inherits `:root`       | Per-instance CSS-variable overrides. Accepts flat tokens **or** `{ light, dark }`. |
| `isolate`                 | `boolean`                                                  | `false`                | Ignore the app's `:root` and render with bundled defaults. |
| `onView`                  | `(row: TData) => void`                                     | —                      | Side-effect when "View" is clicked. Fires *before* the sheet opens. |
| `onDelete`                | `(row: TData) => void`                                     | —                      | Single-row delete handler. Fires *after* the confirm modal (or immediately if `confirmDelete={false}`). |
| `viewSheet`               | `ViewSheetConfig<TData> \| false`                          | enabled                | Configure or disable the built-in View sheet. |
| `confirmDelete`           | `ConfirmDeleteConfig<TData> \| boolean`                    | `true`                 | Configure or disable the delete confirmation modal (applies to single + bulk). |

`TData` must extend `{ id: string \| number }`.

```ts
type DataTableDataSource<TData> = {
  fetchRows: (params: {
    pageIndex: number
    pageSize: number
    sorting: SortingState
    columnFilters: ColumnFiltersState
    globalFilter: string
  }) => Promise<TData[] | { rows: TData[]; totalRecords?: number }>
  mode?: "client" | "server"
  enabled?: boolean
  initialData?: TData[]
  deps?: readonly unknown[]
  onError?: (
    error: unknown,
    context: { type: "load" | "refresh"; message: string }
  ) => void
}
```

```ts
// Theme types
type DataTableTokens = {
  background?: string
  foreground?: string
  card?: string
  cardForeground?: string
  popover?: string
  popoverForeground?: string
  primary?: string
  primaryForeground?: string
  secondary?: string
  secondaryForeground?: string
  muted?: string
  mutedForeground?: string
  accent?: string
  accentForeground?: string
  destructive?: string
  destructiveForeground?: string
  border?: string
  input?: string
  ring?: string
  radius?: string
  fontFamily?: string
}

type DataTableModedTheme = {
  light?: DataTableTokens
  dark?: DataTableTokens
}

type DataTableTheme = DataTableTokens | DataTableModedTheme
```

```ts
// Theme exports
import {
  themePresets,        // ready-made moded presets
  buildPreset,         // (hue, chroma?) => DataTableModedTheme
  splitTheme,          // (theme) => { light, dark }
  tokensToStyle,       // (tokens) => React.CSSProperties
  tokensToCssBlock,    // (tokens) => "var:val;var:val" string
  ISOLATE_LIGHT_TOKENS,
  ISOLATE_DARK_TOKENS,
} from "@dynostack/react-grid"
```

```ts
// View sheet types
type ViewSheetDensity = "compact" | "relaxed" | "comfy"

type ViewSheetConfig<TData> = {
  side?: "right" | "left" | "top" | "bottom"
  defaultDensity?: ViewSheetDensity
  hideDensityTabs?: boolean
  fields?: string[]
  renderField?: (args: {
    column: Column<TData, unknown>
    value: unknown
    row: TData
  }) => React.ReactNode
  renderHeader?: (row: TData) => React.ReactNode
  labels?: {
    title?: (row: TData) => React.ReactNode
    description?: (row: TData) => React.ReactNode
    emptyValue?: string
    density?: { compact?: string; relaxed?: string; comfy?: string }
  }
}

// Confirm-delete types
type ConfirmDeleteContext<TData> = {
  rows: TData[]
  source: "single" | "bulk"
}

type ConfirmDeleteConfig<TData> = {
  title?: (ctx: ConfirmDeleteContext<TData>) => React.ReactNode
  description?: (ctx: ConfirmDeleteContext<TData>) => React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
}
```

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
