import type {
  FormSchema,
  FormField,
  FormValues,
  ScheduleEvent,
  Schedule,
  Workflow,
  PlanTask,
  ProjectPlan,
  ChartConfig,
} from './types'
export * from './types'
export const dayMs = 86_400_000
export const newId = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
export function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(date + 'T00:00:00Z') + days * dayMs)
    .toISOString()
    .slice(0, 10)
}
export function dateDistance(start: string, end: string): number {
  return Math.round(
    (Date.parse(end + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / dayMs
  )
}
export function isDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value
  )
}
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  if (from < 0 || from >= items.length || to < 0 || to >= items.length)
    return next
  next.splice(to, 0, next.splice(from, 1)[0])
  return next
}
export function fieldVisible(
  field: FormField,
  values: FormValues,
  fields: FormField[] = [],
  seen = new Set<string>()
): boolean {
  if (!field.visibleWhen) return true
  if (seen.has(field.id)) return false
  seen.add(field.id)
  const source = fields.find((item) => item.id === field.visibleWhen!.fieldId)
  return (
    (!source || fieldVisible(source, values, fields, seen)) &&
    String(values[field.visibleWhen.fieldId] ?? '') === field.visibleWhen.equals
  )
}
export function validateFormSchema(schema: FormSchema): string[] {
  const errors: string[] = [],
    ids = new Set(schema.fields.map((field) => field.id))
  if (!schema.title.trim()) errors.push('Give the form a title.')
  if (!schema.steps.length) errors.push('Add at least one step.')
  if (ids.size !== schema.fields.length)
    errors.push('Field IDs must be unique.')
  for (const field of schema.fields) {
    if (!field.label.trim()) errors.push('Every field needs a label.')
    if (
      field.step < 0 ||
      field.step >= schema.steps.length ||
      !Number.isInteger(field.step)
    )
      errors.push(`${field.label}: choose an existing step.`)
    if (
      field.type === 'select' &&
      !field.options?.some((option) => option.trim())
    )
      errors.push(`${field.label}: add an option.`)
    if (
      field.min !== undefined &&
      field.max !== undefined &&
      field.min > field.max
    )
      errors.push(`${field.label}: minimum exceeds maximum.`)
    const seen = new Set([field.id])
    let source = field.visibleWhen?.fieldId
    while (source) {
      if (!ids.has(source)) {
        errors.push(`${field.label}: visibility references a missing field.`)
        break
      }
      if (seen.has(source)) {
        errors.push(`${field.label}: visibility conditions contain a cycle.`)
        break
      }
      seen.add(source)
      source = schema.fields.find((item) => item.id === source)?.visibleWhen
        ?.fieldId
    }
  }
  return [...new Set(errors)]
}
export function validateForm(
  schema: FormSchema,
  values: FormValues,
  step?: number
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of schema.fields) {
    if (
      (step !== undefined && field.step !== step) ||
      !fieldVisible(field, values, schema.fields)
    )
      continue
    const raw = values[field.id],
      text = String(raw ?? '').trim()
    if (field.required && (field.type === 'checkbox' ? raw !== true : !text))
      errors[field.id] = `${field.label} is required.`
    else if (
      text &&
      field.type === 'email' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
    )
      errors[field.id] = 'Enter a valid email address.'
    else if (
      text &&
      field.type === 'number' &&
      (!Number.isFinite(Number(text)) ||
        (field.min !== undefined && Number(text) < field.min) ||
        (field.max !== undefined && Number(text) > field.max))
    )
      errors[field.id] =
        `Enter a number${field.min !== undefined ? ` ≥ ${field.min}` : ''}${field.max !== undefined ? ` ≤ ${field.max}` : ''}.`
    else if (text && field.type === 'select' && !field.options?.includes(text))
      errors[field.id] = 'Choose an available option.'
    else if (text && field.type === 'date' && !isDate(text))
      errors[field.id] = 'Enter a valid date.'
  }
  return errors
}
export function formSubmission(
  schema: FormSchema,
  values: FormValues
): FormValues {
  return Object.fromEntries(
    schema.fields
      .filter((field) => fieldVisible(field, values, schema.fields))
      .map((field) => [
        field.id,
        values[field.id] ?? (field.type === 'checkbox' ? false : ''),
      ])
  )
}
export function expandEvents(
  events: ScheduleEvent[],
  from: string,
  to: string
): ScheduleEvent[] {
  const start = Date.parse(from),
    end = Date.parse(to),
    result: ScheduleEvent[] = []
  for (const event of events) {
    const base = Date.parse(event.start),
      duration = Date.parse(event.end) - base
    if (!Number.isFinite(base) || duration <= 0) continue
    const limit =
      event.recurrence === 'weekly'
        ? Date.parse(
            (event.repeatUntil ?? event.start.slice(0, 10)) + 'T23:59:59Z'
          )
        : base
    const first = event.recurrence
      ? Math.max(0, Math.floor((start - base - duration) / (7 * dayMs)))
      : 0
    for (let index = first; ; index++) {
      const time = base + index * 7 * dayMs
      if (time > limit || time >= end || (!event.recurrence && index > 0)) break
      if (time + duration > start)
        result.push({
          ...event,
          id: index ? `${event.id}::${index}` : event.id,
          start: new Date(time).toISOString(),
          end: new Date(time + duration).toISOString(),
        })
    }
  }
  return result.sort((a, b) => a.start.localeCompare(b.start))
}
export function validateEvent(
  event: ScheduleEvent,
  schedule: Schedule
): string | undefined {
  if (!event.title.trim()) return 'Give the appointment a title.'
  const start = Date.parse(event.start),
    end = Date.parse(event.end)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return 'End time must be after start time.'
  if (!schedule.resources.some((resource) => resource.id === event.resourceId))
    return 'Choose an available resource.'
  if (end - start > 7 * dayMs)
    return 'Appointments must be no longer than seven days.'
  if (
    event.recurrence &&
    (!event.repeatUntil ||
      !isDate(event.repeatUntil) ||
      event.repeatUntil < event.start.slice(0, 10) ||
      dateDistance(event.start.slice(0, 10), event.repeatUntil) > 366)
  )
    return 'Weekly recurrence needs an end date within one year of the start.'
  const horizon = new Date(
    Math.max(
      end,
      Date.parse((event.repeatUntil ?? event.end.slice(0, 10)) + 'T23:59:59Z')
    ) + dayMs
  ).toISOString()
  const occurrences = expandEvents([event], event.start, horizon)
  const others = expandEvents(
    schedule.events.filter(
      (item) => item.id !== event.id && item.resourceId === event.resourceId
    ),
    event.start,
    horizon
  )
  if (
    occurrences.some((a) =>
      others.some(
        (b) =>
          Date.parse(a.start) < Date.parse(b.end) &&
          Date.parse(a.end) > Date.parse(b.start)
      )
    )
  )
    return 'This resource already has an appointment during that time.'
}
export function validateWorkflow(flow: Workflow): string[] {
  const errors: string[] = [],
    ids = new Set(flow.nodes.map((node) => node.id))
  if (ids.size !== flow.nodes.length) errors.push('Node IDs must be unique.')
  if (new Set(flow.edges.map((edge) => edge.id)).size !== flow.edges.length)
    errors.push('Connection IDs must be unique.')
  const starts = flow.nodes.filter((node) => node.kind === 'start')
  if (starts.length !== 1) errors.push('Use exactly one start node.')
  if (!flow.nodes.some((node) => node.kind === 'end'))
    errors.push('Add an end node.')
  if (flow.edges.some((edge) => !ids.has(edge.source) || !ids.has(edge.target)))
    errors.push('A connection references a missing node.')
  const visiting = new Set<string>(),
    visited = new Set<string>()
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true
    if (visited.has(id)) return false
    visiting.add(id)
    for (const edge of flow.edges.filter((edge) => edge.source === id))
      if (visit(edge.target)) return true
    visiting.delete(id)
    visited.add(id)
    return false
  }
  if (flow.nodes.some((node) => visit(node.id)))
    errors.push('Workflow contains a cycle.')
  for (const node of flow.nodes) {
    const outgoing = flow.edges.filter((edge) => edge.source === node.id)
    if (!node.label.trim()) errors.push('Every node needs a label.')
    if (node.kind === 'end' && outgoing.length)
      errors.push(`${node.label}: end nodes cannot have outgoing connections.`)
    if (
      node.kind === 'start' &&
      flow.edges.some((edge) => edge.target === node.id)
    )
      errors.push('Start node cannot have incoming connections.')
    if (node.kind === 'condition') {
      if (!node.condition?.field.trim())
        errors.push(`${node.label}: choose a condition field.`)
      if (
        node.condition?.operator === 'gt' &&
        !Number.isFinite(Number(node.condition.value))
      )
        errors.push(`${node.label}: comparison value must be numeric.`)
      if (
        outgoing.length !== 2 ||
        outgoing.filter((edge) => edge.branch === 'yes').length !== 1 ||
        outgoing.filter((edge) => edge.branch === 'no').length !== 1
      )
        errors.push(`${node.label}: connect one yes and one no branch.`)
    } else if (node.kind !== 'end' && outgoing.length !== 1)
      errors.push(`${node.label}: connect exactly one next step.`)
    if (node.kind === 'approval' && !node.assignee?.trim())
      errors.push(`${node.label}: assign a reviewer.`)
  }
  if (starts.length === 1) {
    const reachable = new Set<string>()
    const walk = (id: string) => {
      if (reachable.has(id)) return
      reachable.add(id)
      flow.edges
        .filter((edge) => edge.source === id)
        .forEach((edge) => walk(edge.target))
    }
    walk(starts[0].id)
    if (flow.nodes.some((node) => !reachable.has(node.id)))
      errors.push('Connect every node to the start path.')
  }
  return [...new Set(errors)]
}
export function simulateWorkflow(
  flow: Workflow,
  input: Record<string, unknown>,
  approvals: Record<string, boolean> = {}
): { trace: string[]; outcome: string } {
  const errors = validateWorkflow(flow)
  if (errors.length) return { trace: [], outcome: errors.join(' ') }
  const trace: string[] = []
  let current = flow.nodes.find((node) => node.kind === 'start')!
  for (let i = 0; i <= flow.nodes.length; i++) {
    trace.push(current.id)
    if (current.kind === 'end')
      return { trace, outcome: 'Completed simulation' }
    if (current.kind === 'approval' && approvals[current.id] !== true)
      return {
        trace,
        outcome:
          approvals[current.id] === false
            ? `Rejected by ${current.assignee}`
            : `Waiting for ${current.assignee}`,
      }
    const condition = current.condition
    const branch =
      current.kind === 'condition' && condition
        ? (
            condition.operator === 'gt'
              ? Number(input[condition.field]) > Number(condition.value)
              : String(input[condition.field]) === condition.value
          )
          ? 'yes'
          : 'no'
        : undefined
    const edge = flow.edges.find(
      (edge) =>
        edge.source === current.id && (!branch || edge.branch === branch)
    )!
    current = flow.nodes.find((node) => node.id === edge.target)!
  }
  return { trace, outcome: 'Simulation stopped' }
}
export function validatePlan(plan: ProjectPlan): string[] {
  const errors: string[] = [],
    ids = new Set(plan.tasks.map((task) => task.id))
  if (ids.size !== plan.tasks.length) errors.push('Task IDs must be unique.')
  for (const task of plan.tasks) {
    if (!task.name.trim()) errors.push('Every task needs a name.')
    if (!isDate(task.start) || !isDate(task.end) || task.end < task.start)
      errors.push(`${task.name}: choose valid start and end dates.`)
    if (task.milestone && task.start !== task.end)
      errors.push(
        `${task.name}: milestones must have the same start and end date.`
      )
    if (
      !Number.isFinite(task.progress) ||
      task.progress < 0 ||
      task.progress > 100
    )
      errors.push(`${task.name}: progress must be between 0 and 100.`)
    for (const id of task.dependencies) {
      const dependency = plan.tasks.find((item) => item.id === id)
      if (!dependency) errors.push(`${task.name}: dependency is missing.`)
      else if (task.start <= dependency.end)
        errors.push(`${task.name}: start after ${dependency.name} finishes.`)
    }
  }
  const active = new Set<string>(),
    done = new Set<string>()
  const visit = (task: PlanTask): boolean => {
    if (active.has(task.id)) return true
    if (done.has(task.id)) return false
    active.add(task.id)
    for (const id of task.dependencies) {
      const dependency = plan.tasks.find((item) => item.id === id)
      if (dependency && visit(dependency)) return true
    }
    active.delete(task.id)
    done.add(task.id)
    return false
  }
  if (plan.tasks.some(visit)) errors.push('Dependencies contain a cycle.')
  return [...new Set(errors)]
}
/** Move one task; preserve durations and push successors forward to keep finish-to-start constraints. */
export function reschedulePlan(
  plan: ProjectPlan,
  id: string,
  days: number
): ProjectPlan {
  if (!Number.isInteger(days)) throw new Error('Move by whole days.')
  const moved = plan.tasks.map((task) =>
    task.id === id
      ? {
          ...task,
          start: shiftDate(task.start, days),
          end: shiftDate(task.end, days),
        }
      : { ...task }
  )
  for (let pass = 0; pass < moved.length; pass++)
    for (const task of moved) {
      const earliest = task.dependencies.reduce((latest, depId) => {
        const dep = moved.find((item) => item.id === depId)
        return dep && dep.end >= latest ? shiftDate(dep.end, 1) : latest
      }, task.start)
      if (earliest > task.start) {
        const duration = dateDistance(task.start, task.end)
        task.start = earliest
        task.end = shiftDate(earliest, duration)
      }
    }
  const result = { ...plan, tasks: moved },
    errors = validatePlan(result)
  if (errors.length) throw new Error(errors.join(' '))
  return result
}
/** Longest dependency chain by working span, without resource leveling or business calendars. */
export function criticalPath(plan: ProjectPlan): string[] {
  if (validatePlan(plan).length) return []
  const memo = new Map<string, { duration: number; path: string[] }>()
  const score = (task: PlanTask): { duration: number; path: string[] } => {
    if (memo.has(task.id)) return memo.get(task.id)!
    const previous = task.dependencies
      .map((id) => score(plan.tasks.find((item) => item.id === id)!))
      .sort((a, b) => b.duration - a.duration)[0] ?? { duration: 0, path: [] }
    const result = {
      duration:
        previous.duration +
        dateDistance(task.start, task.end) +
        (task.milestone ? 0 : 1),
      path: [...previous.path, task.id],
    }
    memo.set(task.id, result)
    return result
  }
  return (
    plan.tasks
      .filter(
        (task) =>
          !plan.tasks.some((other) => other.dependencies.includes(task.id))
      )
      .map(score)
      .sort(
        (a, b) => b.duration - a.duration || b.path.length - a.path.length
      )[0]?.path ?? []
  )
}
export function validateChart(chart: ChartConfig): string[] {
  const errors: string[] = []
  if (
    new Set(chart.series.map((series) => series.key)).size !==
    chart.series.length
  )
    errors.push('Series keys must be unique.')
  for (const series of chart.series)
    if (
      chart.points.some(
        (point) =>
          typeof point[series.key] !== 'number' ||
          !Number.isFinite(point[series.key])
      )
    )
      errors.push(`${series.label}: every value must be a finite number.`)
  return errors
}
export function csvCell(value: unknown): string {
  let text = String(value ?? '')
  if (typeof value !== 'number' && /^[\s]*[=+@-]/.test(text)) text = "'" + text
  return '"' + text.replace(/"/g, '""') + '"'
}
export function chartCsv(chart: ChartConfig): string {
  return [
    ['Label', ...chart.series.map((series) => series.label)],
    ...chart.points.map((point) => [
      point.label,
      ...chart.series.map((series) => point[series.key]),
    ]),
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n')
}
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Could not save. Your changes are retained; try again.'
}

export { chartPath } from './chart-path'

export { parseApplicationDiagram, connectorPath, applicationSvg, applicationMarkdown } from './application-core'
