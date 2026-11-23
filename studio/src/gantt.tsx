import { useState, type DragEvent } from 'react'
import type { ProjectPlan, PlanTask, SaveProps } from './types'
import {
  criticalPath,
  dateDistance,
  newId,
  reschedulePlan,
  shiftDate,
  validatePlan,
  errorMessage,
} from './core'
import { Empty, JsonExport, Notice, useSave } from './shared'
export interface GanttPlannerProps extends SaveProps<ProjectPlan> {
  onSave?: (plan: ProjectPlan) => void | Promise<void>
}
export function GanttPlanner({ value, onChange, onSave }: GanttPlannerProps) {
  const [draft, setDraft] = useState<PlanTask | null>(null),
    [zoom, setZoom] = useState<'day' | 'week'>('day'),
    [owner, setOwner] = useState('all'),
    [showCritical, setShowCritical] = useState(true),
    [error, setError] = useState(''),
    [baseline, setBaseline] = useState<ProjectPlan | null>(null)
  const save = useSave(value, onSave),
    problems = validatePlan(value),
    path = criticalPath(value),
    validTasks = value.tasks.filter(
      (task) =>
        /^\d{4}-\d{2}-\d{2}$/.test(task.start) &&
        /^\d{4}-\d{2}-\d{2}$/.test(task.end)
    )
  const earliest =
      validTasks.map((task) => task.start).sort()[0] ?? '2026-10-05',
    latest =
      validTasks
        .map((task) => task.end)
        .sort()
        .at(-1) ?? shiftDate(earliest, 14),
    first = shiftDate(earliest, -2),
    span = Math.max(21, Math.min(366, dateDistance(first, latest) + 4)),
    cell = zoom === 'day' ? 40 : 18
  const tasks = value.tasks.filter(
      (task) => owner === 'all' || task.assignee === owner
    ),
    ticks = Array.from({ length: span }, (_, index) => shiftDate(first, index)),
    timelineWidth = span * cell
  function edit(task?: PlanTask) {
    setError('')
    setDraft(
      task
        ? { ...task, dependencies: [...task.dependencies] }
        : {
            id: newId('task'),
            name: '',
            start: earliest,
            end: shiftDate(earliest, 2),
            progress: 0,
            assignee: '',
            dependencies: [],
          }
    )
  }
  function commitTask() {
    if (!draft) return
    const next = {
      ...value,
      tasks: value.tasks.some((task) => task.id === draft.id)
        ? value.tasks.map((task) => (task.id === draft.id ? draft : task))
        : [...value.tasks, draft],
    }
    const errors = validatePlan(next)
    if (errors.length) {
      setError(errors.join(' '))
      return
    }
    onChange(next)
    setDraft(null)
    setError('')
  }
  function move(id: string, days: number) {
    try {
      onChange(reschedulePlan(value, id, days))
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  function dropTask(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (save.saving) return
    try {
      const payload = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (typeof payload.id === 'string' && typeof payload.x === 'number') {
        move(payload.id, Math.round((e.clientX - payload.x) / cell))
      }
    } catch {
      setError('Could not move that task. Use arrow keys instead.')
    }
  }
  return (
    <section className="ds-tool ds-gantt" aria-label="Gantt planner">
      <div className="ds-toolbar">
        <label className="ds-inline-label">
          Plan title
          <input
            disabled={save.saving}
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </label>
        <div className="ds-segment">
          <button aria-pressed={zoom === 'day'} onClick={() => setZoom('day')}>
            Days
          </button>
          <button
            aria-pressed={zoom === 'week'}
            onClick={() => setZoom('week')}
          >
            Weeks
          </button>
        </div>
        <label className="ds-inline-label">
          Assignee
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="all">Everyone</option>
            {[...new Set(value.tasks.map((task) => task.assignee))].map(
              (name) => (
                <option key={name} value={name}>
                  {name || 'Unassigned'}
                </option>
              )
            )}
          </select>
        </label>
        <label className="ds-check">
          <input
            type="checkbox"
            checked={showCritical}
            onChange={(e) => setShowCritical(e.target.checked)}
          />
          Longest chain
        </label>
        <button onClick={() => setBaseline(structuredClone(value))}>
          {baseline ? 'Update baseline' : 'Capture baseline'}
        </button>
        <button
          className="ds-primary"
          disabled={save.saving}
          onClick={() => edit()}
        >
          New task
        </button>
        {onSave && (
          <button
            disabled={save.saving || !!problems.length}
            onClick={save.run}
          >
            {save.saving ? 'Saving…' : 'Save plan'}
          </button>
        )}
        <JsonExport value={value} filename="project-plan" />
      </div>
      {save.message && <Notice error={save.failed}>{save.message}</Notice>}
      {problems.length > 0 && <Notice error>{problems.join(' ')}</Notice>}
      {error && !draft && <Notice error>{error}</Notice>}
      {draft ? (
        <form
          className="ds-panel ds-task-editor"
          onSubmit={(e) => {
            e.preventDefault()
            commitTask()
          }}
        >
          <h3>
            {value.tasks.some((task) => task.id === draft.id)
              ? 'Edit task'
              : 'New task'}
          </h3>
          <fieldset disabled={save.saving}>
            <label>
              Task name
              <input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <div className="ds-two">
              <label>
                Start date
                <input
                  required
                  type="date"
                  value={draft.start}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      start: e.target.value,
                      ...(draft.milestone ? { end: e.target.value } : {}),
                    })
                  }
                />
              </label>
              <label>
                End date
                <input
                  required
                  type="date"
                  disabled={draft.milestone}
                  value={draft.end}
                  onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                />
              </label>
            </div>
            <div className="ds-two">
              <label>
                Assignee
                <input
                  value={draft.assignee}
                  onChange={(e) =>
                    setDraft({ ...draft, assignee: e.target.value })
                  }
                />
              </label>
              <label>
                Progress (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.progress}
                  onChange={(e) =>
                    setDraft({ ...draft, progress: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label className="ds-check">
              <input
                type="checkbox"
                checked={!!draft.milestone}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    milestone: e.target.checked,
                    ...(e.target.checked ? { end: draft.start } : {}),
                  })
                }
              />
              Milestone
            </label>
            <h3>Finish-to-start dependencies</h3>
            <div className="ds-dependency-list">
              {value.tasks
                .filter((task) => task.id !== draft.id)
                .map((task) => (
                  <label className="ds-check" key={task.id}>
                    <input
                      type="checkbox"
                      checked={draft.dependencies.includes(task.id)}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          dependencies: e.target.checked
                            ? [...draft.dependencies, task.id]
                            : draft.dependencies.filter((id) => id !== task.id),
                        })
                      }
                    />
                    {task.name}
                  </label>
                ))}
            </div>
            {error && <Notice error>{error}</Notice>}
            <div className="ds-toolbar">
              <button className="ds-primary" type="submit">
                Apply task
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(null)
                  setError('')
                }}
              >
                Cancel
              </button>
              {value.tasks.some((task) => task.id === draft.id) && (
                <button
                  type="button"
                  className="ds-danger"
                  disabled={value.tasks.some((task) =>
                    task.dependencies.includes(draft.id)
                  )}
                  onClick={() => {
                    onChange({
                      ...value,
                      tasks: value.tasks.filter((task) => task.id !== draft.id),
                    })
                    setDraft(null)
                  }}
                >
                  Delete task
                </button>
              )}
            </div>
            {value.tasks.some((task) =>
              task.dependencies.includes(draft.id)
            ) && (
              <p className="ds-muted">
                Remove this task from successor dependencies before deleting it.
              </p>
            )}
          </fieldset>
        </form>
      ) : tasks.length ? (
        <div className="ds-gantt-scroll">
          <div
            className="ds-gantt-chart"
            style={{ minWidth: timelineWidth + 240 }}
          >
            <div className="ds-gantt-head">
              <div className="ds-gantt-label">Task / owner</div>
              <div className="ds-gantt-days" style={{ width: timelineWidth }}>
                {ticks.map((day, index) => (
                  <div
                    key={day}
                    style={{ width: cell }}
                    className={
                      [0, 6].includes(new Date(day + 'T00:00:00Z').getUTCDay())
                        ? 'is-weekend'
                        : ''
                    }
                  >
                    {zoom === 'day' ? (
                      <>
                        <small>
                          {index === 0 || day.endsWith('01')
                            ? new Intl.DateTimeFormat('en', {
                                month: 'short',
                                timeZone: 'UTC',
                              }).format(new Date(day + 'T00:00:00Z'))
                            : ''}
                        </small>
                        {Number(day.slice(-2))}
                      </>
                    ) : index % 7 === 0 ? (
                      <span>{day.slice(5)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="ds-gantt-rows">
              {tasks.map((task) => {
                const base = baseline?.tasks.find(
                    (item) => item.id === task.id
                  ),
                  offset = dateDistance(first, task.start),
                  duration = dateDistance(task.start, task.end) + 1
                return (
                  <div className="ds-gantt-row" key={task.id}>
                    <button
                      className="ds-gantt-label"
                      disabled={save.saving}
                      onClick={() => edit(task)}
                    >
                      <strong>{task.name}</strong>
                      <small>
                        {task.assignee || 'Unassigned'} · {task.progress}%
                      </small>
                    </button>
                    <div
                      className="ds-gantt-lane"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={dropTask}
                      style={{
                        width: timelineWidth,
                        backgroundSize: `${cell}px 100%`,
                      }}
                    >
                      {base && (
                        <div
                          className="ds-baseline"
                          style={{
                            left: dateDistance(first, base.start) * cell,
                            width:
                              (dateDistance(base.start, base.end) + 1) * cell,
                          }}
                        />
                      )}
                      <button
                        disabled={save.saving || problems.length > 0}
                        className={`ds-gantt-bar ${task.milestone ? 'is-milestone' : ''} ${showCritical && path.includes(task.id) ? 'is-critical' : ''}`}
                        style={{
                          left: offset * cell + 2,
                          width: task.milestone
                            ? 20
                            : Math.max(24, duration * cell - 4),
                        }}
                        aria-label={`${task.name}, ${task.start} to ${task.end}, ${task.progress}% complete. Arrow keys move by one day.`}
                        title={`${task.name}: ${task.start} → ${task.end}`}
                        draggable={!save.saving && !problems.length}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'text/plain',
                            JSON.stringify({ id: task.id, x: e.clientX })
                          )
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onClick={() => edit(task)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            e.preventDefault()
                            move(task.id, e.key === 'ArrowLeft' ? -1 : 1)
                          }
                        }}
                      >
                        <span style={{ width: `${task.progress}%` }} />
                        <strong>{!task.milestone && task.name}</strong>
                      </button>
                      <div className="ds-gantt-drop" />
                    </div>
                  </div>
                )
              })}
              <svg
                className="ds-gantt-dependencies"
                style={{ left: 240 }}
                width={timelineWidth}
                height={tasks.length * 62}
                aria-hidden="true"
              >
                {tasks.flatMap((task, index) =>
                  task.dependencies.map((id) => {
                    const previous = tasks.findIndex((item) => item.id === id)
                    if (previous < 0) return null
                    const from = tasks[previous],
                      x1 = (dateDistance(first, from.end) + 1) * cell,
                      x2 = dateDistance(first, task.start) * cell,
                      y1 = previous * 62 + 27,
                      y2 = index * 62 + 27
                    return (
                      <path
                        key={id + task.id}
                        d={`M${x1},${y1} H${x1 + 8} V${y2} H${x2}`}
                        fill="none"
                        stroke="var(--ds-edge)"
                        strokeWidth="1.5"
                      />
                    )
                  })
                )}
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <Empty>
          No tasks in this view. Add a task or select another assignee.
        </Empty>
      )}
      <div className="ds-gantt-legend">
        <span>
          <i />
          Scheduled task
        </span>
        <span>
          <i className="is-critical" />
          Longest dependency chain
        </span>
        {baseline && (
          <span>
            <i className="is-baseline" />
            Captured baseline
          </span>
        )}
        <span>
          {value.tasks.length} tasks /{' '}
          {value.tasks.filter((task) => task.progress === 100).length} complete
        </span>
      </div>
      <p className="ds-muted">
        Drag bars or use left/right arrow keys to move tasks. Successors shift
        forward automatically. Calendar days; no resource leveling. Timeline
        displays up to one year.
      </p>
    </section>
  )
}
