# Dynostack feature status

Audited 2026-10-09 for the 0.6.0 release. See ADVANCED_GRID.md for contracts and limits.

| Priority | Feature | Source status | Playground / documentation or missing work |
| --- | --- | --- | --- |
| 1 | Validated asynchronous editing | Implemented | Validation, delayed saves, forced failure, retry and draft retention toggles; README and Reliable editing docs. |
| 2 | Fully controlled table state | Implemented | Full/partial state, snapshot callback, inspector and reset; README and Controlled state docs. |
| 3 | Saved views | Implemented | Save/restore/rename/delete/reset, optional localStorage, clear presets; README and Saved views docs. |
| 4 | Keyboard navigation | Implemented | Opt-in arrow/Home/End/Tab navigation, Enter/F2 editing, Escape return focus and announcements. Native editor keys retained; row saves remain explicit. |
| 5 | Row virtualization | Implemented | Measured TanStack Virtual rows, overscan, bounded viewport and retained editing rows. Expanded details stay virtualized; large flat models prepare in bounded tasks. Playground supports 50,000 sample rows and adjustable overscan. |
| 6 | Native XLSX export | Implemented | Optional /xlsx adapter, literal typed cells, formats, multiple sheets, async toolbar status. Legacy HTML .xls remains compatible. |
| 7 | Grouping and aggregation | Implemented | Multi-level group model, native aggregations, expand/collapse, controlled grouping and saved views; server grouping requires an adapter. |
| 8 | Selection across server pages | Implemented contract | useGridQuerySelection retains query/exclusions across pages; backend resolves selection; exports remain loaded rows only. |
| 9 | Custom cell editors | Implemented | meta.renderEditor, custom display, validated async commit and read-only rules. |
| 10 | Bulk editing | Implemented atomic contract | createGridTransaction/useGridTransactions validate whole batches and persist before applying. API lab supports selected-row bulk editing. Partial-success reconciliation is not provided. |
| 11 | Spreadsheet interactions | Implemented paste/fill contracts | Quoted TSV parser, bounded rectangle patches and explicit API lab coordinates/fill controls. Drag-selected ranges and native clipboard shortcuts remain open. |
| 12 | Undo/redo | Implemented | Bounded persisted history; conflicts do not overwrite newer edits. API lab undo/redo. |
| 13 | Advanced filter builder | Implemented AST | Nested cross-column AND/OR, typed operators, import validation and server forwarding. API lab JSON editor; visual tree builder remains open. |
| 14 | Locale-aware formatting | Implemented | Global/per-column Intl locale/currency/timezone and RTL direction. Physical left/right pinning remains. |
| 15 | Conditional formatting | Implemented | Declarative row predicates with per-cell styles; custom formatValue/cellStyle contracts. |
| 16 | Pinned summary rows | Implemented | Sticky summaries with page/filtered/server scope and explicit server totals. |
| 17 | Live data updates | Implemented contract | Upsert/delete helpers report dirty-row conflicts; adapters receive AbortSignal. Transport and versioning belong to applications. |
| 18 | Browser and visual regression | Partial | 17 package tests plus 24 Studio tests; live Chromium API/grouping/editing/loading checks. Full cross-browser visual baselines remain open. |

Full enterprise parity is not claimed. The remaining advanced UI and cross-browser limitations are explicit in ADVANCED_GRID.md.
No ranking or indexing guarantee is implied by SEO prerendering.
