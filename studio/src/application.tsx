import { useId, useRef, useState } from 'react'
import type {
  ApplicationDiagram,
  ApplicationNodeKind,
  ApplicationConnector,
  ConnectorKind,
  SaveProps,
} from './types'
import {
  applicationNodeKinds,
  connectorKinds,
  connectorPath,
  parseApplicationDiagram,
  applicationSvg,
  applicationMarkdown,
} from './application-core'
import { downloadText, JsonExport, Notice, useSave } from './shared'
export interface ApplicationDesignerProps extends SaveProps<ApplicationDiagram> {
  onSave?: (value: ApplicationDiagram) => void | Promise<void>
}
export function ApplicationDesigner({
  value,
  onChange,
  onSave,
}: ApplicationDesignerProps) {
  const marker = useId().replace(/[^a-z0-9]/gi, ''),
    svg = useRef<SVGSVGElement>(null),
    [mode, setMode] = useState<'canvas' | 'code' | 'split'>('canvas'),
    [tool, setTool] = useState<'select' | 'connect' | 'pan' | 'erase'>(
      'select'
    ),
    [selected, setSelected] = useState<string | null>(null),
    [source, setSource] = useState<string | null>(null),
    [code, setCode] = useState(''),
    [error, setError] = useState(''),
    [past, setPast] = useState<ApplicationDiagram[]>([]),
    [future, setFuture] = useState<ApplicationDiagram[]>([]),
    [view, setView] = useState({ x: 0, y: 0, w: 1100, h: 620 }),
    [walk, setWalk] = useState(false)
  const drag = useRef<{
      id: string | null
      x: number
      y: number
      original: ApplicationDiagram
      view: typeof view
    } | null>(null),
    saving = useSave(value, onSave),
    node = value.nodes.find((n) => n.id === selected),
    edge = value.connectors.find((e) => e.id === selected)
  const commit = (next: ApplicationDiagram) => {
    setPast((p) => [...p.slice(-99), structuredClone(value)])
    setFuture([])
    onChange(next)
    setError('')
  }
  const position = (event: React.PointerEvent) => {
    const point = svg.current!.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const matrix = svg.current!.getScreenCTM()
    return matrix ? point.matrixTransform(matrix.inverse()) : point
  }
  const remove = (id: string) => {
    commit({
      ...value,
      nodes: value.nodes.filter((n) => n.id !== id),
      connectors: value.connectors.filter(
        (e) => e.id !== id && e.source !== id && e.target !== id
      ),
    })
    setSelected(null)
    setSource(null)
  }
  const fit = () => {
    const x = Math.min(0, ...value.nodes.map((n) => n.x)) - 40,
      y = Math.min(0, ...value.nodes.map((n) => n.y)) - 40,
      w = Math.max(900, ...value.nodes.map((n) => n.x + 180)) + 40 - x,
      h = Math.max(480, ...value.nodes.map((n) => n.y + 80)) + 40 - y
    setView({
      x,
      y,
      w: Math.max(w, (h * 1100) / 620),
      h: Math.max(h, (w * 620) / 1100),
    })
  }
  const changeMode = (next: typeof mode) => {
    setCode(JSON.stringify(value, null, 2))
    setMode(next)
    setError('')
  }
  const add = (kind: ApplicationNodeKind) => {
    if (value.nodes.length >= 100) {
      setError('Maximum 100 nodes.')
      return
    }
    const id = crypto.randomUUID()
    commit({
      ...value,
      nodes: [
        ...value.nodes,
        {
          id,
          kind,
          label: `New ${kind}`,
          description: 'Describe its responsibility and integration.',
          x: view.x + 80 + (value.nodes.length % 3) * 220,
          y: view.y + 100 + (value.nodes.length % 4) * 110,
        },
      ],
    })
    setSelected(id)
  }
  const connect = (id: string) => {
    if (!source) {
      setSource(id)
      setSelected(id)
      return
    }
    if (source === id) {
      setSource(null)
      return
    }
    if (value.connectors.length >= 300) {
      setError('Maximum 300 connectors.')
      return
    }
    const idEdge = crypto.randomUUID()
    commit({
      ...value,
      connectors: [
        ...value.connectors,
        {
          id: idEdge,
          source,
          target: id,
          kind: 'https',
          style: 'curve',
          label: 'HTTPS request',
        },
      ],
    })
    setSource(null)
    setSelected(idEdge)
  }
  return (
    <section
      className="ds-tool ds-application"
      aria-label="Application designer"
    >
      <div className="ds-toolbar">
        <div className="ds-segment">
          {(['canvas', 'split', 'code'] as const).map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              onClick={() => changeMode(m)}
            >
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <button
          disabled={!past.length}
          onClick={() => {
            const previous = past[past.length - 1]
            setPast(past.slice(0, -1))
            setFuture((f) => [...f, value])
            onChange(previous)
            setSelected(null)
          }}
        >
          Undo
        </button>
        <button
          disabled={!future.length}
          onClick={() => {
            const next = future[future.length - 1]
            setFuture(future.slice(0, -1))
            setPast((p) => [...p, value])
            onChange(next)
            setSelected(null)
          }}
        >
          Redo
        </button>
        <button aria-pressed={walk} onClick={() => setWalk(!walk)}>
          How it works
        </button>
        <button
          onClick={() =>
            downloadText(
              'application.svg',
              applicationSvg(value),
              'image/svg+xml'
            )
          }
        >
          Export SVG
        </button>
        <button
          onClick={() =>
            downloadText(
              'architecture.md',
              applicationMarkdown(value),
              'text/markdown'
            )
          }
        >
          Export notes
        </button>
        <JsonExport value={value} filename="application" />
        {onSave && (
          <button
            className="ds-primary"
            disabled={saving.saving}
            onClick={() => saving.run()}
          >
            {saving.saving ? 'Saving...' : 'Save diagram'}
          </button>
        )}
      </div>
      {saving.message && (
        <Notice error={saving.failed}>{saving.message}</Notice>
      )}
      {error && <Notice error>{error}</Notice>}
      <div className="ds-architecture-heading">
        <div>
          <h2>{value.title}</h2>
          <p>{value.description}</p>
        </div>
        <span>
          {value.nodes.length} components / {value.connectors.length} connectors
        </span>
      </div>
      <div className={`ds-architecture-workspace is-${mode}`}>
        {mode !== 'code' && (
          <div className="ds-canvas-pane">
            <div className="ds-canvas-tools">
              {(['select', 'connect', 'pan', 'erase'] as const).map((t) => (
                <button
                  key={t}
                  aria-pressed={tool === t}
                  onClick={() => {
                    setTool(t)
                    setSource(null)
                  }}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
              <span />
              <button
                onClick={() =>
                  setView((v) => ({
                    ...v,
                    w: Math.min(5000, v.w * 1.2),
                    h: Math.min(5000, v.h * 1.2),
                  }))
                }
                aria-label="Zoom out"
              >
                -
              </button>
              <button
                onClick={() =>
                  setView((v) => ({
                    ...v,
                    w: Math.max(250, v.w / 1.2),
                    h: Math.max(140, v.h / 1.2),
                  }))
                }
                aria-label="Zoom in"
              >
                +
              </button>
              <button onClick={fit}>Fit</button>
            </div>
            <svg
              ref={svg}
              className={`ds-architecture-canvas tool-${tool}`}
              viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
              tabIndex={0}
              role="group"
              aria-label="Architecture canvas. Select a node, use arrow keys to move, Delete to erase."
              onKeyDown={(e) => {
                if (selected && ['Delete', 'Backspace'].includes(e.key)) {
                  e.preventDefault()
                  remove(selected)
                }
                if (
                  node &&
                  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                    e.key
                  )
                ) {
                  e.preventDefault()
                  const step = e.shiftKey ? 25 : 10
                  commit({
                    ...value,
                    nodes: value.nodes.map((n) =>
                      n.id === node.id
                        ? {
                            ...n,
                            x:
                              n.x +
                              (e.key === 'ArrowLeft'
                                ? -step
                                : e.key === 'ArrowRight'
                                  ? step
                                  : 0),
                            y:
                              n.y +
                              (e.key === 'ArrowUp'
                                ? -step
                                : e.key === 'ArrowDown'
                                  ? step
                                  : 0),
                          }
                        : n
                    ),
                  })
                }
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget || tool === 'pan') {
                  const p = position(e)
                  drag.current = {
                    id: null,
                    x: e.clientX,
                    y: e.clientY,
                    original: value,
                    view,
                  }
                  e.currentTarget.setPointerCapture(e.pointerId)
                  if (tool !== 'pan') setSelected(null)
                }
              }}
              onPointerMove={(e) => {
                const d = drag.current
                if (!d) return
                const p = position(e)
                if (d.id) {
                  onChange({
                    ...d.original,
                    nodes: d.original.nodes.map((n) =>
                      n.id === d.id
                        ? {
                            ...n,
                            x: Math.max(
                              -10000,
                              Math.min(10000, n.x + p.x - d.x)
                            ),
                            y: Math.max(
                              -10000,
                              Math.min(10000, n.y + p.y - d.y)
                            ),
                          }
                        : n
                    ),
                  })
                } else {
                  const bounds = e.currentTarget.getBoundingClientRect()
                  setView((v) => ({
                    ...v,
                    x: d.view.x - ((e.clientX - d.x) / bounds.width) * d.view.w,
                    y:
                      d.view.y - ((e.clientY - d.y) / bounds.height) * d.view.h,
                  }))
                }
              }}
              onPointerUp={() => {
                drag.current = null
              }}
              onPointerCancel={() => {
                if (drag.current?.id) onChange(drag.current.original)
                drag.current = null
              }}
            >
              <defs>
                <pattern
                  id={marker + 'dots'}
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r=".7" fill="var(--ds-border)" />
                </pattern>
                <marker
                  id={marker + 'arrow'}
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0 0 L8 4 L0 8" fill="var(--ds-edge)" />
                </marker>
              </defs>
              <rect
                x={view.x}
                y={view.y}
                width={view.w}
                height={view.h}
                fill={`url(#${marker + 'dots'})`}
                pointerEvents="none"
              />
              {value.connectors.map((c) => {
                const a = value.nodes.find((n) => n.id === c.source),
                  b = value.nodes.find((n) => n.id === c.target)
                if (!a || !b) return null
                const path = connectorPath(c, value.nodes)
                return (
                  <g
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Connector ${c.label} from ${a.label} to ${b.label}`}
                    onClick={() =>
                      tool === 'erase' ? remove(c.id) : setSelected(c.id)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelected(c.id)
                    }}
                  >
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="18"
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke={
                        selected === c.id
                          ? 'var(--ds-accent)'
                          : 'var(--ds-edge)'
                      }
                      strokeWidth={selected === c.id ? 2.5 : 1.5}
                      markerEnd={`url(#${marker + 'arrow'})`}
                      strokeDasharray={c.kind === 'event' ? '5 5' : undefined}
                    />
                    <text
                      className="ds-connector-label"
                      x={(a.x + b.x + 180) / 2}
                      y={(a.y + b.y) / 2 + 25}
                      textAnchor="middle"
                    >
                      {c.label}
                    </text>
                  </g>
                )
              })}
              {value.nodes.map((n) => (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.label}, ${n.kind}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      tool === 'connect' ? connect(n.id) : setSelected(n.id)
                    }
                  }}
                  onPointerDown={(e) => {
                    if (tool === 'pan') return
                    e.stopPropagation()
                    if (tool === 'erase') {
                      remove(n.id)
                      return
                    }
                    if (tool === 'connect') {
                      connect(n.id)
                      return
                    }
                    setSelected(n.id)
                    const p = position(e)
                    setPast((past) => [
                      ...past.slice(-99),
                      structuredClone(value),
                    ])
                    setFuture([])
                    drag.current = {
                      id: n.id,
                      x: p.x,
                      y: p.y,
                      original: value,
                      view,
                    }
                    svg.current?.setPointerCapture(e.pointerId)
                  }}
                >
                  <rect
                    width="180"
                    height="80"
                    rx="10"
                    fill="var(--ds-surface)"
                    stroke={
                      selected === n.id || source === n.id
                        ? 'var(--ds-accent)'
                        : 'var(--ds-border)'
                    }
                    strokeWidth={selected === n.id ? 2 : 1}
                  />
                  <text x="16" y="25" className="ds-node-kind">
                    {n.kind.toUpperCase()}
                  </text>
                  <text x="16" y="53" className="ds-node-title">
                    {n.label.length > 21
                      ? n.label.slice(0, 20) + '...'
                      : n.label}
                  </text>
                  <circle
                    cx="180"
                    cy="40"
                    r="5"
                    fill="var(--ds-surface)"
                    stroke="var(--ds-edge)"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      setTool('connect')
                      connect(n.id)
                    }}
                  />
                </g>
              ))}
            </svg>
            <div className="ds-canvas-status">
              {source
                ? 'Choose a target component to finish the connector.'
                : tool === 'erase'
                  ? 'Click a component or connector to erase it.'
                  : tool === 'pan'
                    ? 'Drag to pan the canvas.'
                    : 'Drag components. Use Connect and click two components. Arrow keys move the selected node.'}
              <span>{Math.round((1100 / view.w) * 100)}%</span>
            </div>
          </div>
        )}
        {mode !== 'canvas' && (
          <div className="ds-code-pane">
            <div>
              <strong>Diagram as code</strong>
              <span>JSON / schema v1</span>
            </div>
            <textarea
              aria-label="Diagram source"
              value={code}
              spellCheck={false}
              onChange={(e) => setCode(e.target.value)}
            />
            <div>
              <button
                className="ds-primary"
                onClick={() => {
                  try {
                    commit(parseApplicationDiagram(code))
                    setSelected(null)
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Invalid diagram')
                  }
                }}
              >
                Apply code
              </button>
              <button onClick={() => setCode(JSON.stringify(value, null, 2))}>
                Sync from canvas
              </button>
            </div>
            <p>
              Apply validates IDs, coordinates and connectors. Invalid code
              retains the current diagram.
            </p>
          </div>
        )}
      </div>
      <div className="ds-architecture-bottom">
        <aside>
          <h3>Components</h3>
          <div className="ds-node-palette">
            {applicationNodeKinds.map((kind) => (
              <button key={kind} onClick={() => add(kind)}>
                + {kind}
              </button>
            ))}
          </div>
          <p>
            Connectors describe API contracts; they do not provision or connect
            live services.
          </p>
        </aside>
        <aside>
          <h3>
            {node
              ? 'Component properties'
              : edge
                ? 'Connector properties'
                : 'Diagram properties'}
          </h3>
          {node ? (
            <>
              <label>
                Component label
                <input
                  value={node.label}
                  maxLength={200}
                  onChange={(e) =>
                    commit({
                      ...value,
                      nodes: value.nodes.map((n) =>
                        n.id === node.id ? { ...n, label: e.target.value } : n
                      ),
                    })
                  }
                />
              </label>
              <label>
                Responsibility
                <textarea
                  value={node.description}
                  onChange={(e) =>
                    commit({
                      ...value,
                      nodes: value.nodes.map((n) =>
                        n.id === node.id
                          ? { ...n, description: e.target.value }
                          : n
                      ),
                    })
                  }
                />
              </label>
            </>
          ) : edge ? (
            <>
              <label>
                Connector label
                <input
                  value={edge.label}
                  maxLength={200}
                  onChange={(e) =>
                    commit({
                      ...value,
                      connectors: value.connectors.map((c) =>
                        c.id === edge.id ? { ...c, label: e.target.value } : c
                      ),
                    })
                  }
                />
              </label>
              <label>
                Protocol
                <select
                  value={edge.kind}
                  onChange={(e) =>
                    commit({
                      ...value,
                      connectors: value.connectors.map((c) =>
                        c.id === edge.id
                          ? { ...c, kind: e.target.value as ConnectorKind }
                          : c
                      ),
                    })
                  }
                >
                  {connectorKinds.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label>
                Connector style
                <select
                  value={edge.style}
                  onChange={(e) =>
                    commit({
                      ...value,
                      connectors: value.connectors.map((c) =>
                        c.id === edge.id
                          ? {
                              ...c,
                              style: e.target
                                .value as ApplicationConnector['style'],
                            }
                          : c
                      ),
                    })
                  }
                >
                  {['curve', 'elbow', 'straight'].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label>
                Diagram title
                <input
                  value={value.title}
                  onChange={(e) => commit({ ...value, title: e.target.value })}
                />
              </label>
              <label>
                Architecture notes
                <textarea
                  value={value.notes}
                  onChange={(e) => commit({ ...value, notes: e.target.value })}
                />
              </label>
            </>
          )}
          {(node || edge) && (
            <button onClick={() => remove(selected!)}>Delete selected</button>
          )}
        </aside>
      </div>
      {walk && (
        <div className="ds-architecture-walk">
          <h3>How this application works</h3>
          <p>{value.notes}</p>
          <ol>
            {value.nodes.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    setSelected(n.id)
                    setView({ x: n.x - 200, y: n.y - 160, w: 650, h: 366 })
                  }}
                >
                  {n.label}
                </button>
                <span>{n.description}</span>
              </li>
            ))}
          </ol>
          <h3>Connector contracts</h3>
          <ul>
            {value.connectors.map((e) => (
              <li key={e.id}>
                <strong>
                  {value.nodes.find((n) => n.id === e.source)?.label} →{' '}
                  {value.nodes.find((n) => n.id === e.target)?.label}
                </strong>
                <span>
                  {e.label} / {e.kind}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
