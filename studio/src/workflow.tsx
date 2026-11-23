import { useEffect, useId, useRef, useState } from 'react'
import type {
  Workflow,
  WorkflowNode,
  WorkflowNodeKind,
  SaveProps,
} from './types'
import { newId, validateWorkflow, simulateWorkflow } from './core'
import { Empty, JsonExport, Notice, useSave } from './shared'
export interface WorkflowDesignerProps extends SaveProps<Workflow> {
  onSave?: (flow: Workflow) => void | Promise<void>
}
const nodeKinds: WorkflowNodeKind[] = [
  'start',
  'approval',
  'condition',
  'action',
  'end',
]
const kindNames = {
  start: 'Start',
  approval: 'Approval',
  condition: 'Condition',
  action: 'Action',
  end: 'End',
}
export function WorkflowDesigner({
  value,
  onChange,
  onSave,
}: WorkflowDesignerProps) {
  const markerId = useId().replace(/:/g, '') + '-arrow'
  const scroll = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1),
    [autoFit, setAutoFit] = useState(true)
  const [selected, setSelected] = useState(
      value.nodes.find((node) => node.kind === 'condition')?.id ??
        value.nodes[0]?.id ??
        ''
    ),
    [target, setTarget] = useState(''),
    [branch, setBranch] = useState<'yes' | 'no'>('yes')
  const [input, setInput] = useState('{"amount": 12500}'),
    [approval, setApproval] = useState('approved'),
    [result, setResult] = useState<{ trace: string[]; outcome: string } | null>(
      null
    ),
    [simulationError, setSimulationError] = useState('')
  const board = useRef<HTMLDivElement>(null),
    drag = useRef<{
      id: string
      x: number
      y: number
      startX: number
      startY: number
    } | null>(null),
    save = useSave(value, onSave)
  const node = value.nodes.find((item) => item.id === selected),
    problems = validateWorkflow(value)
  function commit(next: Workflow) {
    onChange(next)
    setResult(null)
    setSimulationError('')
  }
  function update(patch: Partial<WorkflowNode>) {
    if (node)
      commit({
        ...value,
        nodes: value.nodes.map((item) =>
          item.id === node.id ? { ...item, ...patch } : item
        ),
      })
  }
  function add(kind: WorkflowNodeKind) {
    const id = newId('node')
    commit({
      ...value,
      nodes: [
        ...value.nodes,
        {
          id,
          kind,
          label: kindNames[kind],
          x: 80 + (value.nodes.length % 3) * 250,
          y: 70 + Math.floor(value.nodes.length / 3) * 140,
          ...(kind === 'approval' ? { assignee: 'Team lead' } : {}),
          ...(kind === 'condition'
            ? { condition: { field: 'amount', operator: 'gt', value: '10000' } }
            : {}),
          ...(kind === 'action' ? { action: 'Send notification' } : {}),
        },
      ],
    })
    setSelected(id)
  }
  function connect() {
    if (
      !node ||
      !target ||
      node.id === target ||
      !value.nodes.some((item) => item.id === target)
    )
      return
    if (
      value.edges.some(
        (edge) =>
          edge.source === node.id &&
          edge.target === target &&
          (node.kind !== 'condition' || edge.branch === branch)
      )
    )
      return
    commit({
      ...value,
      edges: [
        ...value.edges,
        {
          id: newId('edge'),
          source: node.id,
          target,
          ...(node.kind === 'condition' ? { branch } : {}),
        },
      ],
    })
  }
  function simulate() {
    setSimulationError('')
    try {
      const parsed: unknown = JSON.parse(input)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('Sample input must be a JSON object.')
      setResult(
        simulateWorkflow(
          value,
          parsed as Record<string, unknown>,
          Object.fromEntries(
            value.nodes
              .filter((item) => item.kind === 'approval')
              .map((item) => [item.id, approval === 'approved'])
          )
        )
      )
    } catch {
      setResult(null)
      setSimulationError('Enter a valid JSON object for the sample input.')
    }
  }
  const extentX = Math.max(920, ...value.nodes.map((item) => item.x + 250)),
    extentY = Math.max(460, ...value.nodes.map((item) => item.y + 130))
  useEffect(() => {
    if (!autoFit || !scroll.current) return
    const fit = () =>
      setZoom(Math.max(0.3, Math.min(1, scroll.current!.clientWidth / extentX)))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(scroll.current)
    return () => observer.disconnect()
  }, [autoFit, extentX])
  return (
    <section className="ds-tool ds-workflow" aria-label="Workflow designer">
      <div className="ds-toolbar">
        <label className="ds-inline-label">
          Workflow title
          <input
            value={value.title}
            disabled={save.saving}
            onChange={(e) => commit({ ...value, title: e.target.value })}
          />
        </label>
        {nodeKinds.map((kind) => (
          <button
            key={kind}
            disabled={
              save.saving ||
              (kind === 'start' &&
                value.nodes.some((item) => item.kind === 'start'))
            }
            onClick={() => add(kind)}
          >
            ＋ {kindNames[kind]}
          </button>
        ))}
        {onSave && (
          <button
            className="ds-primary"
            disabled={save.saving || problems.length > 0}
            onClick={save.run}
          >
            {save.saving ? 'Saving…' : 'Save workflow'}
          </button>
        )}
        <button onClick={() => setAutoFit(true)} aria-pressed={autoFit}>
          Fit diagram
        </button>
        <label className="ds-inline-label">
          Zoom
          <select
            aria-label="Diagram zoom"
            value={autoFit ? 'fit' : zoom}
            onChange={(e) => {
              if (e.target.value === 'fit') setAutoFit(true)
              else {
                setAutoFit(false)
                setZoom(Number(e.target.value))
              }
            }}
          >
            <option value="fit">Fit</option>
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
          </select>
        </label>
        <JsonExport value={value} filename="workflow" />
      </div>
      {save.message && <Notice error={save.failed}>{save.message}</Notice>}
      <div className="ds-flow-layout">
        <div>
          <div className="ds-flow-scroll" ref={scroll}>
            <div style={{ width: extentX * zoom, height: extentY * zoom }}>
              <div
                ref={board}
                className="ds-flow-board"
                style={{
                  width: extentX,
                  height: extentY,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <svg
                  className="ds-flow-edges"
                  width={extentX}
                  height={extentY}
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id={markerId}
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M0,0 L8,4 L0,8" fill="var(--ds-edge)" />
                    </marker>
                  </defs>
                  {value.edges.map((edge) => {
                    const a = value.nodes.find(
                        (item) => item.id === edge.source
                      ),
                      b = value.nodes.find((item) => item.id === edge.target)
                    if (!a || !b) return null
                    const sx = a.x + 200,
                      sy = a.y + 40,
                      tx = b.x,
                      ty = b.y + 40,
                      bend = Math.max(70, Math.abs(tx - sx) / 2)
                    return (
                      <g
                        key={edge.id}
                        className={
                          result?.trace.includes(edge.source) &&
                          result.trace.includes(edge.target)
                            ? 'is-traced'
                            : ''
                        }
                      >
                        <path
                          d={`M${sx},${sy} C${sx + bend},${sy} ${tx - bend},${ty} ${tx},${ty}`}
                          fill="none"
                          stroke="var(--ds-edge)"
                          strokeWidth="2"
                          markerEnd={`url(#${markerId})`}
                        />
                        {edge.branch && (
                          <text
                            x={(sx + tx) / 2}
                            y={(sy + ty) / 2 - 9}
                            textAnchor="middle"
                          >
                            {edge.branch}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </svg>
                {value.nodes.map((item) => (
                  <button
                    key={item.id}
                    className={`ds-flow-node ds-node-${item.kind} ${item.id === selected ? 'is-selected' : ''} ${result?.trace.includes(item.id) ? 'is-traced' : ''}`}
                    style={{ left: item.x, top: item.y }}
                    aria-label={`Select ${item.label}`}
                    aria-pressed={item.id === selected}
                    disabled={save.saving}
                    onClick={() => setSelected(item.id)}
                    onPointerDown={(e) => {
                      if (save.saving || e.button !== 0) return
                      e.currentTarget.setPointerCapture(e.pointerId)
                      drag.current = {
                        id: item.id,
                        x: item.x,
                        y: item.y,
                        startX: e.clientX,
                        startY: e.clientY,
                      }
                      setSelected(item.id)
                    }}
                    onPointerMove={(e) => {
                      const dragging = drag.current
                      if (!dragging || dragging.id !== item.id) return
                      commit({
                        ...value,
                        nodes: value.nodes.map((n) =>
                          n.id === item.id
                            ? {
                                ...n,
                                x: Math.max(
                                  16,
                                  Math.min(
                                    2000,
                                    dragging.x +
                                      (e.clientX - dragging.startX) / zoom
                                  )
                                ),
                                y: Math.max(
                                  16,
                                  Math.min(
                                    1800,
                                    dragging.y +
                                      (e.clientY - dragging.startY) / zoom
                                  )
                                ),
                              }
                            : n
                        ),
                      })
                    }}
                    onPointerUp={() => {
                      drag.current = null
                    }}
                    onPointerCancel={() => {
                      drag.current = null
                    }}
                    onKeyDown={(e) => {
                      const delta: Record<string, [number, number]> = {
                        ArrowLeft: [-20, 0],
                        ArrowRight: [20, 0],
                        ArrowUp: [0, -20],
                        ArrowDown: [0, 20],
                      }
                      if (delta[e.key]) {
                        e.preventDefault()
                        commit({
                          ...value,
                          nodes: value.nodes.map((n) =>
                            n.id === item.id
                              ? {
                                  ...n,
                                  x: Math.max(16, n.x + delta[e.key][0]),
                                  y: Math.max(16, n.y + delta[e.key][1]),
                                }
                              : n
                          ),
                        })
                      }
                    }}
                  >
                    <span className="ds-node-kind">{kindNames[item.kind]}</span>
                    <strong>{item.label}</strong>
                    <small>
                      {item.kind === 'approval'
                        ? item.assignee
                        : item.kind === 'condition'
                          ? `${item.condition?.field ?? 'field'} ${item.condition?.operator === 'gt' ? '>' : '='} ${item.condition?.value ?? ''}`
                          : item.kind === 'action'
                            ? item.action
                            : item.kind === 'start'
                              ? 'Entry point'
                              : 'Workflow complete'}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="ds-flow-status">
            {problems.length ? (
              <details open>
                <summary>{problems.length} issues to resolve</summary>
                <ul>
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </details>
            ) : (
              <Notice>Workflow valid. All branches reach an end.</Notice>
            )}
            <p className="ds-muted">
              Drag nodes to move them, or select a node and use arrow keys.
            </p>
          </div>
        </div>
        <aside className="ds-panel">
          <h3>Step settings</h3>
          {node ? (
            <fieldset disabled={save.saving}>
              <label>
                Step label
                <input
                  value={node.label}
                  onChange={(e) => update({ label: e.target.value })}
                />
              </label>
              {node.kind === 'approval' && (
                <label>
                  Reviewer
                  <input
                    value={node.assignee ?? ''}
                    onChange={(e) => update({ assignee: e.target.value })}
                  />
                </label>
              )}
              {node.kind === 'action' && (
                <label>
                  Action description
                  <input
                    value={node.action ?? ''}
                    onChange={(e) => update({ action: e.target.value })}
                  />
                </label>
              )}
              {node.kind === 'condition' && (
                <>
                  <label>
                    Input field
                    <input
                      value={node.condition?.field ?? ''}
                      onChange={(e) =>
                        update({
                          condition: {
                            field: e.target.value,
                            operator: node.condition?.operator ?? 'gt',
                            value: node.condition?.value ?? '',
                          },
                        })
                      }
                    />
                  </label>
                  <label>
                    Comparison
                    <select
                      value={node.condition?.operator ?? 'gt'}
                      onChange={(e) =>
                        update({
                          condition: {
                            field: node.condition?.field ?? '',
                            value: node.condition?.value ?? '',
                            operator: e.target.value as 'gt' | 'eq',
                          },
                        })
                      }
                    >
                      <option value="gt">Greater than</option>
                      <option value="eq">Equals</option>
                    </select>
                  </label>
                  <label>
                    Compare with
                    <input
                      value={node.condition?.value ?? ''}
                      onChange={(e) =>
                        update({
                          condition: {
                            field: node.condition?.field ?? '',
                            operator: node.condition?.operator ?? 'gt',
                            value: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                </>
              )}
              {node.kind !== 'end' && (
                <>
                  <h3>Connect a step</h3>
                  <label>
                    Next step
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                    >
                      <option value="">Choose a step</option>
                      {value.nodes
                        .filter(
                          (item) => item.id !== node.id && item.kind !== 'start'
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  {node.kind === 'condition' && (
                    <label>
                      Branch
                      <select
                        value={branch}
                        onChange={(e) =>
                          setBranch(e.target.value as 'yes' | 'no')
                        }
                      >
                        <option>yes</option>
                        <option>no</option>
                      </select>
                    </label>
                  )}
                  <button disabled={!target} onClick={connect}>
                    Connect
                  </button>
                  <div className="ds-connections">
                    {value.edges
                      .filter((edge) => edge.source === node.id)
                      .map((edge) => (
                        <div key={edge.id}>
                          <span>
                            {edge.branch ? `${edge.branch}: ` : ''}
                            {value.nodes.find((item) => item.id === edge.target)
                              ?.label ?? 'Missing step'}
                          </span>
                          <button
                            aria-label={`Remove connection ${edge.id}`}
                            onClick={() =>
                              commit({
                                ...value,
                                edges: value.edges.filter(
                                  (item) => item.id !== edge.id
                                ),
                              })
                            }
                          >
                            ×
                          </button>
                        </div>
                      ))}
                  </div>
                </>
              )}
              <button
                className="ds-danger"
                onClick={() => {
                  commit({
                    ...value,
                    nodes: value.nodes.filter((item) => item.id !== node.id),
                    edges: value.edges.filter(
                      (edge) =>
                        edge.source !== node.id && edge.target !== node.id
                    ),
                  })
                  setSelected('')
                }}
              >
                Delete step
              </button>
            </fieldset>
          ) : (
            <Empty>Select a step or add one.</Empty>
          )}
          <h3>Test a path</h3>
          <label>
            Sample input
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
            />
          </label>
          <label>
            Reviewer decision
            <select
              value={approval}
              onChange={(e) => setApproval(e.target.value)}
            >
              <option value="approved">Approve all reviews</option>
              <option value="rejected">Reject all reviews</option>
            </select>
          </label>
          <button
            className="ds-primary"
            disabled={problems.length > 0}
            onClick={simulate}
          >
            Run simulation
          </button>
          {simulationError && <Notice error>{simulationError}</Notice>}
          {result && (
            <div className="ds-simulation">
              <Notice>{result.outcome}</Notice>
              <ol>
                {result.trace.map((id) => (
                  <li key={id}>
                    {value.nodes.find((item) => item.id === id)?.label}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <p className="ds-muted">
            Simulation only. Actions describe steps; they do not send messages
            or execute services.
          </p>
        </aside>
      </div>
    </section>
  )
}
