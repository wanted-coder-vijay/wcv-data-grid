"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog"

export type ConfirmDeleteContext<TData> = {
  /** The rows being deleted. Single-row delete passes one row; bulk passes many. */
  rows: TData[]
  /** "single" when triggered from the row actions menu; "bulk" from the toolbar. */
  source: "single" | "bulk"
}

export type ConfirmDeleteConfig<TData> = {
  /** Modal title. Receives the same context the resolver receives. */
  title?: (ctx: ConfirmDeleteContext<TData>) => React.ReactNode
  /** Modal description / body. */
  description?: (ctx: ConfirmDeleteContext<TData>) => React.ReactNode
  /** Confirm button label. Defaults to "Delete". */
  confirmLabel?: string
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string
}

export function DataTableConfirmDelete<TData>({
  open,
  onOpenChange,
  context,
  onConfirm,
  config,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: ConfirmDeleteContext<TData> | null
  onConfirm: () => void
  config?: ConfirmDeleteConfig<TData>
}) {
  if (!context) return null
  const title = config?.title
    ? config.title(context)
    : context.source === "bulk"
      ? `Delete ${context.rows.length} ${context.rows.length === 1 ? "row" : "rows"}?`
      : "Delete this row?"
  const description = config?.description
    ? config.description(context)
    : context.source === "bulk"
      ? `${context.rows.length} ${context.rows.length === 1 ? "row" : "rows"} will be permanently removed. This cannot be undone.`
      : "This row will be permanently removed. This cannot be undone."

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{config?.cancelLabel ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {config?.confirmLabel ?? "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
