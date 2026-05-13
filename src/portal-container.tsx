"use client"

import { createContext, useContext } from "react"

/**
 * Shared portal container for every overlay inside a DataTable (popover,
 * dropdown, select, sheet, alert-dialog, …).
 *
 * `<DataTable>` provides a ref pointing to a `<div>` rendered *inside* the
 * themed grid root. When the value is non-null, every overlay primitive
 * mounts its portal into that div instead of `document.body`.
 *
 * Why this matters
 * ----------------
 * CSS variables cascade only down the DOM tree. The grid's `theme` prop
 * applies inline tokens to the grid root — if a popover portals to
 * `document.body` (Radix default), those tokens never reach the popover and
 * its `bg-primary` / `bg-popover` / `border` etc. resolve from `:root`
 * instead. That's why a `theme={themePresets.rose}` table can show a black
 * "Apply" button on a white popover surrounded by a rose grid.
 *
 * Mounting overlays inside the themed root fixes this cleanly with no global
 * CSS pollution.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

/** Read the current grid's portal container, or `null` when outside a DataTable. */
export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContainerContext)
}
