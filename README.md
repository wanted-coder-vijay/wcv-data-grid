# @wcv/data-grid

Enterprise-grade React DataTable. Built on TanStack Table v8, Radix UI, and
Tailwind CSS — with a shadcn/ui look that you can theme per-instance.

## Features

- **Editing** — double-click cell editing and full-row editing with `Save` / `Cancel`
- **Add row** — local "draft" insertion that lives until you commit
- **Filters** — ag-grid–level: text/number/date with operator + AND/OR combine, set filter with search and select-all, boolean
- **Sort, hide, pin, resize, reorder** every column
- **Selection + bulk actions** with the `__select` pinned column
- **Expandable rows** (sub-row renderer or nested `getSubRows`)
- **Pagination** with configurable page sizes
- **Export** to CSV / Excel
- **Theming** — shadcn CSS variables; per-instance overrides via the `theme` prop, plus presets (`light`, `dark`, `emerald`, `violet`, `amber`)
- **Density** — `compact` / `default` / `comfortable`
- **i18n / labels** — every visible string overridable via `labels`
- **Feature flags** — turn off any toolbar control or table capability through `features`

## Install

```sh
npm i @wcv/data-grid
```

Peer deps: `react >= 18`, `react-dom >= 18`. Internal deps
(`@tanstack/react-table`, `radix-ui`, `lucide-react`, `class-variance-authority`,
`clsx`, `tailwind-merge`) are bundled in.

### Tailwind setup

The component ships Tailwind class names verbatim. Tell your Tailwind config
to scan the package files:

```js
// tailwind.config.{js,ts}
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@wcv/data-grid/dist/**/*.{js,mjs,cjs}",
  ],
}
```

### Theme tokens

If your app already has shadcn/ui set up, the table will pick up your tokens
automatically — nothing to do.

If not, import the default-tokens stylesheet once:

```ts
import "@wcv/data-grid/styles.css"
```

## Quick start

```tsx
import { DataTable } from "@wcv/data-grid"
import "@wcv/data-grid/styles.css"

type User = { id: number; name: string; email: string; role: "admin" | "viewer" }

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
]

export function Users({ data }: { data: User[] }) {
  return (
    <DataTable<User>
      data={data}
      columns={columns}
      onCellEdit={(row, columnId, value) => save({ ...row, [columnId]: value })}
      onRowSave={(row, draft) => save({ ...row, ...draft })}
      onAddRow={() => ({ name: "", email: "", role: "viewer" })}
      onBulkDelete={(rows) => removeMany(rows.map((r) => r.id))}
    />
  )
}
```

## Theming

Per-instance overrides via CSS variables, scoped to the table root:

```tsx
import { DataTable, themePresets } from "@wcv/data-grid"

<DataTable
  data={data}
  columns={columns}
  theme={themePresets.violet}            // preset
  // or fully custom:
  // theme={{ primary: "oklch(0.6 0.2 200)", radius: "0.25rem" }}
/>
```

All [shadcn tokens](https://ui.shadcn.com/docs/theming) are supported plus
`radius` and `fontFamily`. Anything you omit falls through to the consumer's
`:root`.

## Density

```tsx
<DataTable density="compact" /* | "default" | "comfortable" */ />
```

## Features (toggle anything off)

```tsx
<DataTable
  features={{
    search: false,
    refresh: true,
    columnVisibility: true,
    export: false,
    addRow: true,
    pagination: true,
    sorting: true,
    filtering: true,
    resizing: false,
    reordering: false,
    pinning: true,
  }}
/>
```

## Labels (i18n)

Every visible string is overridable:

```tsx
<DataTable
  labels={{
    search: "Rechercher...",
    addRow: "Ajouter",
    delete: "Supprimer",
    clear: "Effacer",
    selected: "sélectionné(s)",
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

## Column meta

Each column can declare:

```ts
type ColumnMeta = {
  label?: string                       // header label & filter title
  editor?: "text" | "number" | "currency" | "date" | "select" | "switch" | "checkbox"
  filterType?: "text" | "number" | "select" | "multi-select" | "boolean" | "date"
  selectOptions?: { value: string; label: string }[]
  align?: "left" | "right" | "center"
  cellClassName?: string
  headerClassName?: string
  exportable?: boolean
  isEditable?: boolean | ((row) => boolean)
  badgeMap?: Partial<Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline">>
}
```

## Filter API

The package exports the filter primitives so you can build custom panels too:

```ts
import {
  textFilterFn, numberFilterFn, dateFilterFn, setFilterFn, booleanFilterFn,
  type AdvFilter, type SetFilter,
} from "@wcv/data-grid"
```

The default `filterFn` is wired automatically based on `meta.filterType`.

## License

MIT
