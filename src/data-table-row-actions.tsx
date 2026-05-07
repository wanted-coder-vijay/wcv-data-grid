import { useEffect, useRef, useState } from "react"
import {
  CopyIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
  CheckIcon,
} from "lucide-react"

import { Button } from "./ui/button"
import { cn } from "./lib/utils"

export type RowActionId = "view" | "edit" | "duplicate" | "delete" | string

export type CustomRowAction<TData> = {
  id: string
  label: string
  icon?: React.ReactNode
  danger?: boolean
  show?: (row: TData) => boolean
}

export type DataTableRowActionsProps<TData> = {
  row: TData
  actions?: ("view" | "edit" | "duplicate" | "delete")[]
  customActions?: CustomRowAction<TData>[]
  onAction?: (action: RowActionId, row: TData) => void
  isEditing?: boolean
  onSaveEdit?: () => void
  onCancelEdit?: () => void
}

const builtinIcons = {
  view: <EyeIcon />,
  edit: <PencilIcon />,
  duplicate: <CopyIcon />,
  delete: <Trash2Icon />,
}

const builtinLabels = {
  view: "View",
  edit: "Edit",
  duplicate: "Duplicate",
  delete: "Delete",
}

export function DataTableRowActions<TData>({
  row,
  actions = ["view", "edit", "duplicate", "delete"],
  customActions = [],
  onAction,
  isEditing,
  onSaveEdit,
  onCancelEdit,
}: DataTableRowActionsProps<TData>) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  if (isEditing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onSaveEdit}
          aria-label="Save row"
          className="text-emerald-600 hover:text-emerald-600"
        >
          <CheckIcon />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onCancelEdit}
          aria-label="Cancel edit"
        >
          <XIcon />
        </Button>
      </div>
    )
  }

  return (
    <div ref={menuRef} className="relative flex justify-end">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Open row actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontalIcon />
      </Button>

      {open && (
        <div className="absolute top-7 right-0 z-50 w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {actions.map((a) => (
            <RowActionButton
              key={a}
              danger={a === "delete"}
              onClick={() => {
                setOpen(false)
                onAction?.(a, row)
              }}
            >
              {builtinIcons[a]} {builtinLabels[a]}
            </RowActionButton>
          ))}
          {customActions.length > 0 && actions.length > 0 && (
            <div className="-mx-1 my-1 h-px bg-border" />
          )}
          {customActions
            .filter((c) => (c.show ? c.show(row) : true))
            .map((c) => (
              <RowActionButton
                key={c.id}
                danger={c.danger}
                onClick={() => {
                  setOpen(false)
                  onAction?.(c.id, row)
                }}
              >
                {c.icon} {c.label}
              </RowActionButton>
            ))}
        </div>
      )}
    </div>
  )
}

function RowActionButton({
  children,
  danger,
  onClick,
}: {
  children: React.ReactNode
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
        danger && "text-destructive hover:bg-destructive/10 hover:text-destructive"
      )}
    >
      {children}
    </button>
  )
}
