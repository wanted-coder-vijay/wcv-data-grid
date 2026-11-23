import { useState } from 'react'
import type {
  Dashboard,
  DashboardWidget,
  SaveProps,
  ChartConfig,
} from './types'
import { moveItem, newId } from './core'
import { ChartView } from './charts'
import { Empty, JsonExport, Notice, useSave } from './shared'
export interface DashboardBuilderProps extends SaveProps<Dashboard> {
  chart?: ChartConfig
  onSave?: (dashboard: Dashboard) => void | Promise<void>
}
export function DashboardBuilder({
  value,
  onChange,
  chart,
  onSave,
}: DashboardBuilderProps) {
  const [editing, setEditing] = useState(true),
    [selected, setSelected] = useState(value.widgets[0]?.id ?? ''),
    [query, setQuery] = useState('')
  const save = useSave(value, onSave),
    widget = value.widgets.find((item) => item.id === selected),
    filtered = value.widgets.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
  function update(patch: Partial<DashboardWidget>) {
    if (widget)
      onChange({
        ...value,
        widgets: value.widgets.map((item) =>
          item.id === widget.id ? { ...item, ...patch } : item
        ),
      })
  }
  function add(kind: DashboardWidget['kind']) {
    const id = newId('widget')
    onChange({
      ...value,
      widgets: [
        ...value.widgets,
        {
          id,
          kind,
          title:
            kind === 'metric'
              ? 'New metric'
              : kind === 'chart'
                ? 'New chart'
                : 'Team notes',
          width: kind === 'chart' ? 2 : 1,
          metric: 0,
          unit: '',
          note: 'Add a note for your team.',
          chart,
        },
      ],
    })
    setSelected(id)
  }
  return (
    <section className="ds-tool ds-dashboard" aria-label="Dashboard builder">
      <div className="ds-toolbar">
        <label className="ds-inline-label">
          Dashboard title
          <input
            value={value.title}
            disabled={!editing || save.saving}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </label>
        <button
          aria-pressed={editing}
          disabled={save.saving}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Preview dashboard' : 'Edit layout'}
        </button>
        <label className="ds-inline-label">
          Find widget
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter widgets…"
          />
        </label>
        {onSave && (
          <button
            className="ds-primary"
            disabled={save.saving}
            onClick={save.run}
          >
            {save.saving ? 'Saving…' : 'Save layout'}
          </button>
        )}
        <JsonExport value={value} filename="dashboard" />
      </div>
      {save.message && <Notice error={save.failed}>{save.message}</Notice>}
      <div className={`ds-dashboard-layout ${editing ? 'is-editing' : ''}`}>
        <div>
          <div className="ds-dashboard-heading">
            <h2>{value.title}</h2>
            {editing && (
              <div className="ds-inline-actions">
                <button disabled={save.saving} onClick={() => add('metric')}>
                  ＋ Metric
                </button>
                <button disabled={save.saving} onClick={() => add('chart')}>
                  ＋ Chart
                </button>
                <button disabled={save.saving} onClick={() => add('notes')}>
                  ＋ Notes
                </button>
              </div>
            )}
          </div>
          <div className="ds-widget-grid">
            {filtered.map((item) => {
              const index = value.widgets.findIndex((w) => w.id === item.id)
              return (
                <article
                  key={item.id}
                  className={`ds-widget ${selected === item.id && editing ? 'is-selected' : ''}`}
                  style={{ gridColumn: `span ${item.width}` }}
                  draggable={editing && !save.saving}
                  onDragStart={(e) =>
                    e.dataTransfer.setData('text/plain', item.id)
                  }
                  onDragOver={(e) => {
                    if (editing && !save.saving) e.preventDefault()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (!editing || save.saving) return
                    const from = value.widgets.findIndex(
                      (w) => w.id === e.dataTransfer.getData('text/plain')
                    )
                    if (from >= 0)
                      onChange({
                        ...value,
                        widgets: moveItem(value.widgets, from, index),
                      })
                  }}
                >
                  <header>
                    <h3>{item.title}</h3>
                    {editing && (
                      <button
                        disabled={save.saving}
                        aria-label={`Edit ${item.title}`}
                        onClick={() => setSelected(item.id)}
                      >
                        Settings
                      </button>
                    )}
                  </header>
                  {item.kind === 'metric' ? (
                    <div className="ds-metric">
                      <strong>
                        {Number.isFinite(item.metric)
                          ? item.metric!.toLocaleString()
                          : '—'}
                      </strong>
                      <span>{item.unit}</span>
                    </div>
                  ) : item.kind === 'chart' ? (
                    item.chart ? (
                      <ChartView
                        value={{ ...item.chart, title: item.title }}
                        compact
                      />
                    ) : (
                      <Empty>
                        Pass chart data or choose a chart in your application.
                      </Empty>
                    )
                  ) : (
                    <p className="ds-widget-note">{item.note}</p>
                  )}
                  {editing && (
                    <footer className="ds-inline-actions">
                      <button
                        disabled={save.saving || index === 0}
                        aria-label={`Move ${item.title} earlier`}
                        onClick={() =>
                          onChange({
                            ...value,
                            widgets: moveItem(value.widgets, index, index - 1),
                          })
                        }
                      >
                        ←
                      </button>
                      <button
                        disabled={
                          save.saving || index === value.widgets.length - 1
                        }
                        aria-label={`Move ${item.title} later`}
                        onClick={() =>
                          onChange({
                            ...value,
                            widgets: moveItem(value.widgets, index, index + 1),
                          })
                        }
                      >
                        →
                      </button>
                      <button
                        disabled={save.saving}
                        aria-label={`Resize ${item.title}`}
                        onClick={() =>
                          onChange({
                            ...value,
                            widgets: value.widgets.map((w) =>
                              w.id === item.id
                                ? {
                                    ...w,
                                    width: ((w.width % 3) + 1) as 1 | 2 | 3,
                                  }
                                : w
                            ),
                          })
                        }
                      >
                        Width {item.width}/3
                      </button>
                    </footer>
                  )}
                </article>
              )
            })}
          </div>
          {!filtered.length && (
            <Empty>
              {value.widgets.length
                ? 'No widgets match this search.'
                : 'Add a metric, chart, or note to start your dashboard.'}
            </Empty>
          )}
        </div>
        {editing && (
          <aside className="ds-panel">
            <h3>Widget settings</h3>
            {widget ? (
              <fieldset disabled={save.saving}>
                <label>
                  Widget title
                  <input
                    value={widget.title}
                    onChange={(e) => update({ title: e.target.value })}
                  />
                </label>
                <label>
                  Columns
                  <select
                    value={widget.width}
                    onChange={(e) =>
                      update({ width: Number(e.target.value) as 1 | 2 | 3 })
                    }
                  >
                    {[1, 2, 3].map((width) => (
                      <option key={width}>{width}</option>
                    ))}
                  </select>
                </label>
                {widget.kind === 'metric' ? (
                  <>
                    <label>
                      Metric value
                      <input
                        type="number"
                        value={widget.metric ?? 0}
                        onChange={(e) =>
                          update({ metric: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label>
                      Unit
                      <input
                        value={widget.unit ?? ''}
                        onChange={(e) => update({ unit: e.target.value })}
                      />
                    </label>
                  </>
                ) : widget.kind === 'notes' ? (
                  <label>
                    Note
                    <textarea
                      rows={6}
                      value={widget.note ?? ''}
                      onChange={(e) => update({ note: e.target.value })}
                    />
                  </label>
                ) : (
                  widget.chart && (
                    <label>
                      Widget chart type
                      <select
                        value={widget.chart.kind}
                        onChange={(e) =>
                          update({
                            chart: {
                              ...widget.chart!,
                              kind: e.target.value as ChartConfig['kind'],
                            },
                          })
                        }
                      >
                        <option>line</option>
                        <option>bar</option>
                        <option>area</option>
                      </select>
                    </label>
                  )
                )}
                <button
                  className="ds-danger"
                  onClick={() => {
                    onChange({
                      ...value,
                      widgets: value.widgets.filter(
                        (item) => item.id !== widget.id
                      ),
                    })
                    setSelected('')
                  }}
                >
                  Remove widget
                </button>
              </fieldset>
            ) : (
              <Empty>Select a widget to configure it.</Empty>
            )}
            <p className="ds-muted">
              Drag widgets to reorder. Use the arrow buttons with a keyboard.
              Resize by changing column width.
            </p>
          </aside>
        )}
      </div>
    </section>
  )
}
