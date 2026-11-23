import { useEffect, useRef } from "react"
import type { PointerEvent } from "react"
import type { Row, Table } from "@tanstack/react-table"
import { GripVertical } from "lucide-react"

function cue(name: string) {
  document.dispatchEvent(new CustomEvent("dynostack-row-motion", { detail: name }))
}

export function RowGrip<T>({ row, table, commit }: {
  row: Row<T>
  table: Table<T>
  commit: (rows: T[]) => void
}) {
  const cleanup = useRef<(() => void) | undefined>(undefined)
  useEffect(() => () => cleanup.current?.(), [])
  function plan() {
    const page = table.getRowModel().rows
    const group = page.filter(r => r.id === row.id || (row.getIsSelected() && r.getIsSelected()))
    const moving = new Set(group)
    const rest = page.filter(r => !moving.has(r))
    const origin = page.slice(0, page.indexOf(row)).filter(r => !moving.has(r)).length
    const data = table.options.data
    const order = (slot: number) => [...rest.slice(0, slot), ...group, ...rest.slice(slot)]
    function apply(slot: number) {
      if (table.options.data !== data || table.getRowModel().rows !== page) return
      const next = data.slice()
      const arranged = order(slot)
      if (arranged.every((r, i) => r === page[i])) return
      page.forEach((r, i) => { next[r.index] = arranged[i].original })
      commit(next)
    }
    return { page, group, moving, rest, origin, order, apply }
  }

  function start(e: PointerEvent<HTMLButtonElement>) {
    if (!e.isPrimary || e.button !== 0) return
    const handle = e.currentTarget
    const body = handle.closest("tbody")
    if (!body) return
    const p = plan()
    const nodes = Array.from(body.rows)
    if (!p.rest.length || nodes.length !== p.page.length) return
    e.preventDefault()
    const pointer = e.pointerId
    const initialY = e.clientY
    const firstTop = body.getBoundingClientRect().top
    const boxes = nodes.map(node => node.getBoundingClientRect())
    const lead = p.page.indexOf(row)
    const indices = new Map(p.page.map((r, i) => [r, i]))
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    let slot = p.origin
    let moved = false
    handle.setPointerCapture(pointer)
    cue("lift")
    function move(event: globalThis.PointerEvent) {
      if (event.pointerId !== pointer) return
      const dy = event.clientY - initialY + firstTop - body!.getBoundingClientRect().top
      if (Math.abs(dy) < 3 && !moved) return
      moved = true
      const center = boxes[lead].top + boxes[lead].height / 2 + dy
      const nextSlot = p.rest.filter(r => {
        const box = boxes[indices.get(r)!]
        return center > box.top + box.height / 2
      }).length
      if (nextSlot !== slot) cue("shift")
      slot = nextSlot
      let top = boxes[0].top
      let groupOffset = 0
      const beforeLead = p.group.slice(0, p.group.indexOf(row)).reduce((h,r) => h + boxes[indices.get(r)!].height, 0)
      for (const r of p.order(slot)) {
        const i = indices.get(r)!
        const node = nodes[i]
        const lifted = p.moving.has(r)
        const offset = lifted ? boxes[lead].top + dy - beforeLead + groupOffset - boxes[i].top : top - boxes[i].top
        node.style.transition = lifted || reduced ? "none" : "transform 380ms cubic-bezier(.19,1.24,.34,1)"
        node.style.transform = `translateY(${offset}px)${lifted && !reduced ? " scale(1.03)" : ""}`
        if (lifted) {
          groupOffset += boxes[i].height
          node.dataset.rowLifted = ""
        }
        top += boxes[i].height
      }
    }
    const viewport = body.closest<HTMLElement>("[data-grid-scrollbar]")
    let frame = 0
    let latest: globalThis.PointerEvent | undefined
    function scroll() {
      frame = 0
      if (!latest || !viewport || !moved) return
      const bounds = viewport.getBoundingClientRect()
      const y = latest.clientY
      const speed = y < bounds.top + 32 ? -9 : y > bounds.bottom - 32 ? 9 : 0
      const before = viewport.scrollTop
      viewport.scrollTop += speed
      if (viewport.scrollTop !== before) {
        move(latest)
        frame = requestAnimationFrame(scroll)
      }
    }
    function track(event: globalThis.PointerEvent) {
      latest = event
      move(event)
      if (!frame) frame = requestAnimationFrame(scroll)
    }
    function stop() {
      cancelAnimationFrame(frame)
      handle.removeEventListener("pointermove", track)
      handle.removeEventListener("pointerup", drop)
      handle.removeEventListener("lostpointercapture", cancel)
      handle.removeEventListener("pointercancel", cancel)
      window.removeEventListener("keydown", escape, true)
      if (handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer)
      for (const node of nodes) {
        node.style.removeProperty("transform")
        node.style.removeProperty("transition")
        delete node.dataset.rowLifted
      }
      cleanup.current = undefined
    }
    function drop(event: globalThis.PointerEvent) {
      if (event.pointerId !== pointer) return
      move(event)
      const positions = moved && !reduced ? nodes.map(node => node.getBoundingClientRect().top) : []
      stop()
      if (moved) p.apply(slot)
      if (positions.length) requestAnimationFrame(() => {
        nodes.forEach((node, i) => {
          if (!node.isConnected) return
          const offset = positions[i] - node.getBoundingClientRect().top
          const scale = p.moving.has(p.page[i]) ? 1.03 : 1
          node.animate([{ transform: `translateY(${offset}px) scale(${scale})` }, { transform: "none" }],
            { duration: 310, easing: "cubic-bezier(.18,1.16,.32,1)" })
        })
      })
      cue("drop")
    }
    function cancel() { stop(); cue("cancel") }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") cancel() }
    cleanup.current = stop
    handle.addEventListener("pointermove", track)
    handle.addEventListener("pointerup", drop)
    handle.addEventListener("pointercancel", cancel)
    handle.addEventListener("lostpointercapture", cancel)
    window.addEventListener("keydown", escape, true)
  }

  return <button type="button" className="grid-row-grip" aria-label={`Move row ${row.id}`}
    title="Drag to move. Select rows to move together. Use Up or Down when focused."
    onPointerDown={start} onKeyDown={e => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
      e.preventDefault()
      e.stopPropagation()
      const p = plan()
      const edge = e.key === "ArrowUp" ? p.group[0] : p.group[p.group.length - 1]
      const index = p.page.indexOf(edge)
      const slot = p.page.slice(0, index).filter(r => !p.moving.has(r)).length + (e.key === "ArrowUp" ? -1 : 1)
      if (slot >= 0 && slot <= p.rest.length) { p.apply(slot); cue("drop") }
    }}><GripVertical size={16} aria-hidden="true" /></button>
}
