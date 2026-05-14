# Changelog

All notable changes to `@dynostack/react-grid` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.1] — 2026-05-14

True zero-config for Tailwind v4 consumers.

### Fixed

- **Tailwind v4 utility classes resolve out of the box.** The shipped `styles.css` now declares a top-level `@theme inline { … }` block mapping every shadcn semantic token (`--color-background`, `--color-popover`, `--color-primary`, …) to the CSS variables the package already defined. Without this block, Tailwind v4 didn't generate `bg-popover`, `bg-card`, `text-foreground`, etc., so bundled `className` strings produced no styles — overlays in particular rendered with transparent backgrounds in projects that didn't have shadcn pre-installed.

  Bare Tailwind v4 + Vite consumers can now drop the package in with three lines and zero `tailwind.config.js`:

  ```css
  @import "tailwindcss";
  @source "../node_modules/@dynostack/react-grid/dist";
  @import "@dynostack/react-grid/styles.css";
  ```

  shadcn consumers see no change — the `@theme` declarations match shadcn's own and merge cleanly. Tailwind v3 consumers were always required to map semantic colors in `tailwind.config.js`; v3 ignores `@theme` directives, so they're unaffected.

### Docs

- **Rewrote the README "Tailwind setup" section** as v4-first zero-config, with a separate v3 sub-section that links out to shadcn's manual color mapping.
- Updated the "Why this just works" callout to mention the `@theme inline` registration alongside the existing cascade-layer explanation.

---

## [0.3.0] — 2026-05-14

Built-in View sheet, delete confirmation, and a portal-container fix that finally makes themes work everywhere — including overlays.

### Added

- **Built-in View sheet.** Clicking the "View" row action opens a right-side `Sheet` rendering each visible column as a `{Label}: {value}` card. Includes density tabs (Compact / Relaxed / Comfy → 1 / 2 / 3 columns).
  ```tsx
  <DataTable
    viewSheet={{
      side: "right",
      defaultDensity: "relaxed",
      renderField: ({ column, value }) => <code>{String(value)}</code>,
    }}
  />
  ```
  Pass `viewSheet={false}` to disable and handle View yourself.
- **Built-in delete confirmation.** Both single-row "Delete" and toolbar "Bulk delete" now open a confirmation `AlertDialog` by default. Configurable copy:
  ```tsx
  <DataTable
    confirmDelete={{
      title: ({ rows, source }) => source === "bulk" ? `Delete ${rows.length}?` : "Delete row?",
      confirmLabel: "Remove",
    }}
  />
  ```
  Pass `confirmDelete={false}` to fire delete handlers immediately.
- **New props**: `onView`, `onDelete`, `viewSheet`, `confirmDelete`.
- **New UI primitives**: `Sheet`, `AlertDialog` — both portal-container-aware.
- **Exports**: `PortalContainerContext`, `usePortalContainer`, `ViewSheetConfig`, `ViewSheetDensity`, `ViewSheetLabels`, `ConfirmDeleteConfig`, `ConfirmDeleteContext`.

### Fixed

- **Portal escape from theme.** Popovers, dropdowns, selects, and the row-actions menu now portal into the themed grid root instead of `document.body`. Per-instance `theme={themePresets.X}` now repaints **all** overlay surfaces — `Apply` buttons, filter operator pickers, action menus, etc. Previously they leaked back to `:root` defaults, producing the "rose grid, black Apply button" inconsistency.
- **Native `<select>` in filter operator picker.** Replaced the unstyled browser `<select>` (the source of the bright-blue OS highlight) with the themed Radix `Select` primitive. Operator picker now follows the active theme.
- **Tinted destructive token in presets.** Each `buildPreset(hue)` now derives a destructive color that's blended slightly toward the preset's hue while staying in the red band. The "Delete" action no longer looks out of place inside a violet or rose table.

### Compatibility

- `onRowAction` still fires for every action including `view` and `delete`. The new built-in handlers run in addition, so existing consumers see no behavior change beyond the new modal + sheet appearing.
- `onBulkDelete` still receives the same array signature. The toolbar button now opens a confirmation modal first (disable via `confirmDelete={false}`).

---

## [0.2.0] — 2026-05-14

Theming overhaul: zero-config defaults, automatic OS dark-mode follow, full-repaint presets, and cascade-layered styles that never overwrite the consumer's theme.

### Added

- **`buildPreset(hue, chroma?)`** — generate a full `{ light, dark }` token set from a single OKLCH hue. Use it for custom brand colors:
  ```ts
  import { buildPreset } from "@dynostack/react-grid"
  const teal = buildPreset(180)
  ```
- **`splitTheme(theme)`** — split a flat or moded theme into `{ light, dark }` variants. Useful for embedding the grid in custom theming layers.
- **`tokensToStyle(tokens)`** — convert a token map into a React `CSSProperties` object.
- **`tokensToCssBlock(tokens)`** — convert a token map into a `var:value;…` string for use inside `<style>` tags.
- **`<DataTable isolate>`** — opt out of inheriting the app's `:root` tokens. The grid renders with bundled neutral defaults regardless of surrounding theme. Useful for embedding the grid in heavily-themed shells.
- **Optional `@dynostack/react-grid/page.css`** — wires `<body>` to the grid's tokens so the page background matches the table:
  ```ts
  import "@dynostack/react-grid/styles.css"
  import "@dynostack/react-grid/page.css"   // optional
  ```
- **New presets**: `neutral`, `rose`, `sky`, `slate` (in addition to existing `violet`, `emerald`, `amber`, `light`, `dark`).
- **New types**: `DataTableTokens`, `DataTableModedTheme`.

### Changed

- **Presets now repaint the entire table.** `themePresets.violet`, `emerald`, and `amber` ship as full `{ light, dark }` moded themes covering every shadcn token. Previously they only overrode 5 accent tokens (`primary`, `primary-foreground`, `accent`, `accent-foreground`, `ring`), which made `theme={themePresets.violet}` look like a no-op in many setups.
- **Automatic OS dark mode.** `styles.css` now includes `@media (prefers-color-scheme: dark)` — the grid follows the OS theme out of the box, no `.dark` class required. Manual override via `class="light"` or `class="dark"` on `<html>` is still respected and takes precedence.
- **Cascade-layered defaults.** All declarations in `styles.css` now live inside `@layer dynostack-grid-defaults { … }`. Any unlayered consumer rule (which is where shadcn and most app CSS lives) automatically wins, regardless of import order. **You can no longer accidentally overwrite your app's theme by importing the grid's stylesheet in the wrong place.**
- **`theme` prop accepts moded shape.** In addition to a flat token map, you can now pass `{ light, dark }`:
  ```tsx
  <DataTable theme={{
    light: { primary: "oklch(0.6 0.2 200)", /* … */ },
    dark:  { primary: "oklch(0.7 0.18 200)", /* … */ },
  }} />
  ```
  The grid emits a scoped `<style>` block targeting only this instance — multiple grids on the same page can wear different moded themes without interfering.

### Compatibility

No breaking API changes. All existing prop signatures are preserved:

- `themeToStyle(theme)` still works and returns the light variant for moded themes.
- `theme={flatTokens}` still works exactly as before.
- `themePresets.light` and `themePresets.dark` still exist.

If you depended on `themePresets.violet` (or `emerald` / `amber`) only re-coloring buttons and rings — you'll now see the entire table re-tinted. Two options to keep the old look:

```tsx
// Option 1: pass just the accent tokens
<DataTable theme={{
  primary: "oklch(0.55 0.22 285)",
  primaryForeground: "oklch(1 0 0)",
  accent: "oklch(0.94 0.04 285)",
  accentForeground: "oklch(0.3 0.12 285)",
  ring: "oklch(0.55 0.22 285 / 0.5)",
}} />

// Option 2: use buildPreset with very low chroma for a subtle tint
<DataTable theme={buildPreset(285, 0.005)} />
```

---

## [0.1.3] — Previous release

Initial public theming surface with five-token presets (`light`, `dark`, `emerald`, `violet`, `amber`) and a flat `theme` prop.

[0.3.1]: https://github.com/wanted-coder-vijay/wcv-data-grid/releases/tag/v0.3.1
[0.3.0]: https://github.com/wanted-coder-vijay/wcv-data-grid/releases/tag/v0.3.0
[0.2.0]: https://github.com/wanted-coder-vijay/wcv-data-grid/releases/tag/v0.2.0
[0.1.3]: https://github.com/wanted-coder-vijay/wcv-data-grid/releases/tag/v0.1.3
