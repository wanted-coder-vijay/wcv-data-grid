import type { Table } from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { cn } from "./lib/utils"
import { Button } from "./ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

type Props<TData> = {
  table: Table<TData>
  pageSizeOptions?: number[]
}

function getPageRange(current: number, total: number): (number | "…")[] {
  const pages: (number | "…")[] = []
  if (total <= 7) {
    for (let i = 0; i < total; i++) pages.push(i)
    return pages
  }
  pages.push(0)
  if (current > 3) pages.push("…")
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 4) pages.push("…")
  pages.push(total - 1)
  return pages
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
}: Props<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()
  const totalRows = table.getFilteredRowModel().rows.length
  const fromRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const toRow = Math.min(totalRows, (pageIndex + 1) * pageSize)
  const selected = table.getSelectedRowModel().rows.length

  const range = getPageRange(pageIndex, pageCount)

  return (
    <div className="grid grid-cols-1 items-center gap-2 border-t p-2 text-xs md:grid-cols-3">
      <div className="flex items-center gap-2 text-muted-foreground md:justify-self-start">
        {selected > 0 ? (
          <span>
            <span className="font-medium text-foreground">{selected}</span>{" "}
            selected ·{" "}
          </span>
        ) : null}
        <span>
          Showing{" "}
          <span className="font-medium text-foreground">{fromRow}</span>–
          <span className="font-medium text-foreground">{toRow}</span> of{" "}
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat().format(totalRows)}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-1 md:justify-self-center">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          aria-label="First page"
        >
          <ChevronsLeftIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeftIcon />
        </Button>

        {range.map((p, idx) =>
          p === "…" ? (
            <span key={`e-${idx}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => table.setPageIndex(p)}
              className={cn(
                "h-7 min-w-7 rounded-md border border-transparent px-2 text-xs font-medium transition-colors hover:bg-accent",
                p === pageIndex
                  ? "border-border bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              {p + 1}
            </button>
          )
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRightIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          aria-label="Last page"
        >
          <ChevronsRightIcon />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground md:justify-self-end">
        <span>Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => table.setPageSize(Number(v))}
        >
          <SelectTrigger size="sm" className="h-7 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
