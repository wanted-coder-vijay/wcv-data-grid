import { useState } from "react"
import type { Column } from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
  PinIcon,
  PinOffIcon,
  FilterIcon,
} from "lucide-react"

import { cn } from "./lib/utils"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { ColumnFilterPanel, isFilterActive } from "./filters"

type Props<TData, TValue> = {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: Props<TData, TValue>) {
  const filterType = column.columnDef.meta?.filterType
  const canSort = column.getCanSort()
  const canFilter = column.getCanFilter() && !!filterType
  const canHide = column.getCanHide()
  const canPin = column.getCanPin()

  const sorted = column.getIsSorted()
  const isPinned = column.getIsPinned()
  const filterValue = column.getFilterValue()
  const isFiltered = isFilterActive(filterType, filterValue)

  return (
    <div className="flex items-center justify-between gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="xs"
            className="-ml-2 h-7 px-1.5 text-xs font-medium data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {canSort ? (
              sorted === "desc" ? (
                <ArrowDownIcon className="opacity-70" />
              ) : sorted === "asc" ? (
                <ArrowUpIcon className="opacity-70" />
              ) : (
                <ChevronsUpDownIcon className="opacity-50" />
              )
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {canSort && (
            <>
              <DropdownMenuItem onSelect={() => column.toggleSorting(false)}>
                <ArrowUpIcon /> Ascending
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => column.toggleSorting(true)}>
                <ArrowDownIcon /> Descending
              </DropdownMenuItem>
              {sorted && (
                <DropdownMenuItem onSelect={() => column.clearSorting()}>
                  <ChevronsUpDownIcon /> Clear sort
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}
          {canPin && (
            <>
              <DropdownMenuLabel>Pin column</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => column.pin(isPinned === "left" ? false : "left")}
              >
                {isPinned === "left" ? <PinOffIcon /> : <PinIcon />}{" "}
                {isPinned === "left" ? "Unpin from left" : "Pin to left"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => column.pin(isPinned === "right" ? false : "right")}
              >
                {isPinned === "right" ? <PinOffIcon /> : <PinIcon />}{" "}
                {isPinned === "right" ? "Unpin from right" : "Pin to right"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {canHide && (
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              <EyeOffIcon /> Hide column
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canFilter && (
        <ColumnFilter column={column} isFiltered={isFiltered} />
      )}
    </div>
  )
}

function ColumnFilter<TData, TValue>({
  column,
  isFiltered,
}: {
  column: Column<TData, TValue>
  isFiltered: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className={cn(
            "size-6",
            isFiltered && "bg-primary/10 text-primary"
          )}
          aria-label="Filter column"
        >
          <FilterIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">
            Filter
          </div>
          {isFiltered && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Active
            </span>
          )}
        </div>
        <ColumnFilterPanel column={column} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
