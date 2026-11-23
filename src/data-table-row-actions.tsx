import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  CopyIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
  CheckIcon,
  Loader2Icon,
} from "lucide-react"

import { Button } from "./ui/button"
import { cn } from "./lib/utils"
import { usePortalContainer } from "./portal-container"

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
  isSaving?: boolean
  saveError?: string
  savingLabel?: string
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
  isSaving,
  saveError,
  savingLabel = "Saving…",
  onSaveEdit,
  onCancelEdit,
}: DataTableRowActionsProps<TData>) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const portalContainer = usePortalContainer()

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    if (portalContainer) {
      // Position relative to the container instead of the viewport so that
      // the menu inherits the grid's themed CSS variables.
      const cRect = portalContainer.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom - cRect.top + 4,
        left: Math.max(8, rect.right - cRect.left - 160),
      })
    } else {
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - 160),
      })
    }
  }, [open, portalContainer])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    const onDismiss = () => setOpen(false)
    document.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("scroll", onDismiss, true)
    window.addEventListener("resize", onDismiss)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("scroll", onDismiss, true)
      window.removeEventListener("resize", onDismiss)
    }
  }, [open])

  if (isEditing) {
    return (
      <div aria-busy={isSaving} className="flex flex-nowrap items-center justify-end gap-1" style={{ minWidth: 56 }}>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onSaveEdit}
          disabled={isSaving}
          aria-label={isSaving ? savingLabel : "Save row"}
          title={isSaving ? savingLabel : saveError || "Save row"}
          className="text-emerald-600 hover:text-emerald-600"
        >
          {isSaving ? <Loader2Icon className="animate-spin" /> : <CheckIcon />}
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onCancelEdit}
          disabled={isSaving}
          aria-label="Cancel edit"
        >
          <XIcon />
        </Button>
        {isSaving && <span role="status" className="sr-only">{savingLabel}</span>}

      </div>
    )
  }

  return (
    <div ref={menuRef} className="relative flex justify-end">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon-xs"
        aria-label="Open row actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontalIcon />
      </Button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="z-[1000] w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
            style={{
              position: portalContainer ? "absolute" : "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
            }}
          >
            {actions.map((a) => (
              <RowActionButton
                key={a}
                icon={builtinIcons[a]}
                danger={a === "delete"}
                onClick={() => {
                  setOpen(false)
                  onAction?.(a, row)
                }}
              >
                {builtinLabels[a]}
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
                  icon={c.icon}
                  danger={c.danger}
                  onClick={() => {
                    setOpen(false)
                    onAction?.(c.id, row)
                  }}
                >
                  {c.label}
                </RowActionButton>
              ))}
          </div>,
          portalContainer ?? document.body
        )}
    </div>
  )
}

function RowActionButton({
  icon,
  children,
  danger,
  onClick,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
  danger?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-9 w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
        danger && "text-destructive hover:bg-destructive/10 hover:text-destructive"
      )}
    >
      <span aria-hidden="true" className="grid size-[1em] shrink-0 place-items-center [&_svg]:size-full">{icon}</span>
      <span>{children}</span>
    </button>
  )
}
