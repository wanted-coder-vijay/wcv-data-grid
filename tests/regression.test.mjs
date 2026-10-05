import { test } from "node:test"
import assert from "node:assert/strict"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { readFileSync, existsSync } from "node:fs"
import {
  DataTable,
  EditableCell,
  sanitizeSpreadsheetValue,
  tokensToCssBlock,
  tokensToStyle,
  exportToCsv,
  exportToExcel,
} from "../dist/index.js"

test("every declared package export exists in the release", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  )
  for (const entry of Object.values(pkg.exports))
    for (const target of typeof entry === "string"
      ? [entry]
      : Object.values(entry))
      assert.ok(existsSync(new URL(`../${target}`, import.meta.url)), target)
})

test("untrusted formula text is neutralized while numbers and ordinary text survive", () => {
  for (const text of [
    "=1+1",
    "+SUM(A1:A2)",
    "-1+2",
    "@SUM(A1:A2)",
    ' \t=HYPERLINK("https://example.com")',
    "\tplain",
    "＝1+1",
  ])
    assert.equal(sanitizeSpreadsheetValue(text), `'${text}`)
  assert.equal(sanitizeSpreadsheetValue(-42), "-42")
  assert.equal(
    sanitizeSpreadsheetValue('ordinary "text"\nnew line'),
    'ordinary "text"\nnew line'
  )
})
test("CSV and Excel export protect both headers and cells without dropping selected rows", async () => {
  const blobs = []
  const downloads = []
  const saved = {
    document: globalThis.document,
    create: URL.createObjectURL,
    revoke: URL.revokeObjectURL,
  }
  globalThis.document = {
    createElement: () => ({
      click() {
        downloads.push(this.download)
      },
    }),
    body: { appendChild() {}, removeChild() {} },
  }
  URL.createObjectURL = (blob) => {
    blobs.push(blob)
    return "blob:test"
  }
  URL.revokeObjectURL = () => {}
  const columns = [
    { id: "name", columnDef: { header: "=BAD" } },
    { id: "amount", columnDef: { header: "Amount" } },
    { id: "secret", columnDef: { meta: { exportable: false } } },
  ]
  const row = { getValue: (key) => (key === "name" ? "=1+1" : -42) }
  const table = {
    getVisibleLeafColumns: () => columns,
    getSelectedRowModel: () => ({ rows: [row] }),
    getFilteredRowModel: () => ({ rows: [] }),
  }
  try {
    exportToCsv(table, "projects")
    exportToExcel(table, "projects")
    const csv = await blobs[0].text()
    assert.match(csv, /'=BAD,Amount/)
    assert.match(csv, /'=1\+1,-42/)
    const xls = await blobs[1].text()
    assert.match(xls, /'=1\+1<\/td>/)
    assert.deepEqual(downloads, ["projects.csv", "projects.xls"])
  } finally {
    globalThis.document = saved.document
    URL.createObjectURL = saved.create
    URL.revokeObjectURL = saved.revoke
  }
})
test("theme values cannot break declarations, insert rules or load URLs", () => {
  for (const value of [
    "red;}body{display:none}",
    "url(https://example.com)",
    "u\\72l(x)",
    "red/*comment*/",
    "</style>",
  ]) {
    assert.equal(tokensToCssBlock({ primary: value }), "")
    assert.deepEqual(tokensToStyle({ primary: value }), {})
  }
  assert.equal(
    tokensToCssBlock({ primary: "oklch(0.5 0.2 235)", radius: "0.5rem" }),
    "--primary:oklch(0.5 0.2 235);--radius:0.5rem"
  )
})
test("read-only cells stay read-only in whole-row edit mode", () => {
  for (const flag of [false, () => false]) {
    const html = renderToStaticMarkup(
      React.createElement(EditableCell, {
        column: { columnDef: { meta: { editor: "text", isEditable: flag } } },
        row: { original: { id: "1" } },
        getValue: () => "Protected",
        isEditing: true,
        onCommit() {
          throw new Error("unexpected commit")
        },
        onCancel() {},
        onStartEdit() {},
      })
    )
    assert.match(html, /Protected/)
    assert.doesNotMatch(html, /<input/)
  }
})
test("pagination off renders all rows and initialSorting determines first row", () => {
  const data = Array.from({ length: 18 }, (_, i) => ({
    id: String(i),
    name: `Project ${String(i).padStart(2, "0")}`,
  }))
  const html = renderToStaticMarkup(
    React.createElement(DataTable, {
      data,
      columns: [{ accessorKey: "name", header: "Project" }],
      initialPageSize: 5,
      initialSorting: [{ id: "name", desc: true }],
      features: { pagination: false },
      rowActions: [],
      enableSelection: false,
      ariaLabel: "Accessible projects",
    })
  )
  assert.match(html, /aria-label="Accessible projects"/)
  assert.equal((html.match(/Project \d\d/g) || []).length, 18)
  assert.ok(html.indexOf("Project 17") < html.indexOf("Project 00"))
})
