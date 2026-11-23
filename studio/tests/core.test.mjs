import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateForm,
  validateFormSchema,
  formSubmission,
  fieldVisible,
  expandEvents,
  validateEvent,
  validateWorkflow,
  simulateWorkflow,
  validatePlan,
  reschedulePlan,
  criticalPath,
  validateChart,
  chartCsv,
  shiftDate,
  moveItem,
} from '../dist/core.js'
import { documentMarkdown } from '../dist/document.js'
const form = {
  version: 1,
  title: 'Request',
  description: '',
  steps: ['Project', 'Contact'],
  fields: [
    {
      id: 'team',
      type: 'select',
      label: 'Team',
      step: 0,
      required: true,
      options: ['Engineering', 'Design'],
    },
    {
      id: 'budget',
      type: 'number',
      label: 'Budget',
      step: 0,
      required: true,
      min: 100,
      max: 10000,
    },
    {
      id: 'platform',
      type: 'text',
      label: 'Platform',
      step: 0,
      required: true,
      visibleWhen: { fieldId: 'team', equals: 'Engineering' },
    },
    { id: 'email', type: 'email', label: 'Email', step: 1, required: true },
    {
      id: 'consent',
      type: 'checkbox',
      label: 'Consent',
      step: 1,
      required: true,
    },
  ],
}
test('multistep forms validate only the current step and exclude hidden stale values', () => {
  assert.deepEqual(Object.keys(validateForm(form, {}, 0)).sort(), [
    'budget',
    'team',
  ])
  const values = {
    team: 'Design',
    budget: '200',
    platform: 'Secret stale platform',
    email: 'team@example.com',
    consent: true,
  }
  assert.deepEqual(validateForm(form, values), {})
  assert.equal('platform' in formSubmission(form, values), false)
  assert.equal(
    validateForm(form, { ...values, team: 'Engineering', platform: '' })
      .platform,
    'Platform is required.'
  )
})
test('invalid numbers, options, emails and required consent are rejected', () => {
  const errors = validateForm(form, {
    team: 'Invented',
    budget: '1e999',
    email: 'invalid',
    consent: false,
  })
  assert.deepEqual(Object.keys(errors).sort(), [
    'budget',
    'consent',
    'email',
    'team',
  ])
})
test('cyclic and dangling field visibility is rejected without recursion failure', () => {
  const a = {
      id: 'a',
      label: 'A',
      type: 'text',
      step: 0,
      visibleWhen: { fieldId: 'b', equals: 'yes' },
    },
    b = {
      ...a,
      id: 'b',
      label: 'B',
      visibleWhen: { fieldId: 'a', equals: 'yes' },
    }
  assert.ok(
    validateFormSchema({ ...form, fields: [a, b] }).some((error) =>
      /cycle/.test(error)
    )
  )
  assert.equal(fieldVisible(a, { a: 'yes', b: 'yes' }, [a, b]), false)
  assert.ok(
    validateFormSchema({ ...form, fields: [a] }).some((error) =>
      /missing/.test(error)
    )
  )
})
const event = {
  id: 'event',
  title: 'Review',
  start: '2026-10-05T09:00:00Z',
  end: '2026-10-05T10:00:00Z',
  resourceId: 'room',
  recurrence: 'weekly',
  repeatUntil: '2026-11-02',
}
const schedule = {
  version: 1,
  resources: [
    { id: 'room', name: 'Room', color: '#123456' },
    { id: 'other', name: 'Other', color: '#654321' },
  ],
  events: [event],
}
test('weekly recurrences expand only within the requested range', () => {
  const events = expandEvents(
    [event],
    '2026-10-12T00:00:00Z',
    '2026-10-26T00:00:00Z'
  )
  assert.deepEqual(
    events.map((item) => item.start),
    ['2026-10-12T09:00:00.000Z', '2026-10-19T09:00:00.000Z']
  )
  assert.equal(
    expandEvents([event], '2026-11-03T00:00:00Z', '2026-11-10T00:00:00Z')
      .length,
    0
  )
})
test('booking rejects conflicts on later occurrences, permits adjacent times and other resources', () => {
  const candidate = {
    ...event,
    id: 'new',
    recurrence: undefined,
    repeatUntil: undefined,
    start: '2026-10-19T09:30:00Z',
    end: '2026-10-19T10:30:00Z',
  }
  assert.match(validateEvent(candidate, schedule), /already/)
  assert.equal(
    validateEvent({ ...candidate, resourceId: 'other' }, schedule),
    undefined
  )
  assert.equal(
    validateEvent({ ...candidate, start: '2026-10-19T10:00:00Z' }, schedule),
    undefined
  )
  assert.equal(validateEvent(event, schedule), undefined)
})
test('a newly recurring series cannot overlap a future one-off booking', () => {
  const existing = {
    ...event,
    id: 'future',
    recurrence: undefined,
    start: '2026-10-26T09:10:00Z',
    end: '2026-10-26T09:40:00Z',
  }
  assert.match(
    validateEvent(event, { ...schedule, events: [existing] }),
    /already/
  )
})
test('invalid resources, inverted times and unbounded recurrence are rejected', () => {
  assert.match(
    validateEvent({ ...event, resourceId: 'missing' }, schedule),
    /available/
  )
  assert.match(validateEvent({ ...event, end: event.start }, schedule), /after/)
  assert.match(
    validateEvent({ ...event, repeatUntil: '2030-01-01' }, schedule),
    /within one year/
  )
})
test('UTC weekly recurrence remains the same instant of day through DST', () => {
  const occurrences = expandEvents(
    [
      {
        ...event,
        start: '2026-10-26T09:00:00Z',
        end: '2026-10-26T10:00:00Z',
        repeatUntil: '2026-11-02',
      },
    ],
    '2026-10-26T00:00:00Z',
    '2026-11-03T00:00:00Z'
  )
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
  })
  assert.deepEqual(
    occurrences.map((item) => formatter.format(new Date(item.start))),
    ['05:00', '04:00']
  )
})
const flow = {
  version: 1,
  title: 'Approval',
  nodes: [
    { id: 's', label: 'Start', kind: 'start', x: 0, y: 0 },
    {
      id: 'c',
      label: 'Check',
      kind: 'condition',
      x: 0,
      y: 0,
      condition: { field: 'amount', operator: 'gt', value: '100' },
    },
    {
      id: 'a',
      label: 'Approve',
      kind: 'approval',
      assignee: 'Priya',
      x: 0,
      y: 0,
    },
    { id: 'e', label: 'End', kind: 'end', x: 0, y: 0 },
  ],
  edges: [
    { id: '1', source: 's', target: 'c' },
    { id: '2', source: 'c', target: 'a', branch: 'yes' },
    { id: '3', source: 'c', target: 'e', branch: 'no' },
    { id: '4', source: 'a', target: 'e' },
  ],
}
test('workflow simulation follows conditions and stops for pending or rejected approvals', () => {
  assert.deepEqual(validateWorkflow(flow), [])
  assert.deepEqual(simulateWorkflow(flow, { amount: 20 }).trace, [
    's',
    'c',
    'e',
  ])
  assert.equal(
    simulateWorkflow(flow, { amount: 200 }).outcome,
    'Waiting for Priya'
  )
  assert.equal(
    simulateWorkflow(flow, { amount: 200 }, { a: false }).outcome,
    'Rejected by Priya'
  )
  assert.deepEqual(simulateWorkflow(flow, { amount: 200 }, { a: true }).trace, [
    's',
    'c',
    'a',
    'e',
  ])
})
test('graph validation rejects cycles, duplicate branches and missing nodes', () => {
  assert.ok(
    validateWorkflow({
      ...flow,
      edges: [...flow.edges, { id: 'cycle', source: 'e', target: 's' }],
    }).some((error) => /cycle/.test(error))
  )
  assert.ok(
    validateWorkflow({
      ...flow,
      edges: flow.edges.map((edge) =>
        edge.id === '3' ? { ...edge, branch: 'yes' } : edge
      ),
    }).some((error) => /yes and one no/.test(error))
  )
  assert.ok(
    validateWorkflow({
      ...flow,
      nodes: flow.nodes.filter((node) => node.id !== 'a'),
    }).some((error) => /missing/.test(error))
  )
})
test('disconnected steps cannot masquerade as a valid workflow', () => {
  assert.ok(
    validateWorkflow({
      ...flow,
      nodes: [
        ...flow.nodes,
        { id: 'orphan', label: 'Disconnected end', kind: 'end', x: 0, y: 0 },
      ],
    }).some((error) => /every node/.test(error))
  )
})
const plan = {
  version: 1,
  title: 'Launch',
  tasks: [
    {
      id: 'a',
      name: 'Design',
      start: '2026-10-05',
      end: '2026-10-07',
      progress: 50,
      assignee: 'Sam',
      dependencies: [],
    },
    {
      id: 'b',
      name: 'Build',
      start: '2026-10-08',
      end: '2026-10-11',
      progress: 0,
      assignee: 'Alex',
      dependencies: ['a'],
    },
    {
      id: 'c',
      name: 'Launch',
      start: '2026-10-12',
      end: '2026-10-12',
      progress: 0,
      assignee: 'Priya',
      dependencies: ['b'],
      milestone: true,
    },
  ],
}
test('rescheduling cascades through successors, preserves durations and does not mutate inputs', () => {
  assert.deepEqual(validatePlan(plan), [])
  const next = reschedulePlan(plan, 'a', 3)
  assert.deepEqual(
    next.tasks.map((task) => task.start),
    ['2026-10-08', '2026-10-11', '2026-10-15']
  )
  assert.equal(next.tasks[1].end, '2026-10-14')
  assert.equal(plan.tasks[0].start, '2026-10-05')
  assert.deepEqual(criticalPath(next), ['a', 'b', 'c'])
})
test('invalid dates, progress, milestones, missing dependencies and cycles are rejected', () => {
  for (const patch of [
    { start: '2026-02-30' },
    { progress: 101 },
    { milestone: true },
    { dependencies: ['missing'] },
  ])
    assert.ok(
      validatePlan({
        ...plan,
        tasks: plan.tasks.map((task) =>
          task.id === 'a' ? { ...task, ...patch } : task
        ),
      }).length
    )
  const cyclic = {
    ...plan,
    tasks: plan.tasks.map((task) =>
      task.id === 'a' ? { ...task, dependencies: ['c'] } : task
    ),
  }
  assert.ok(validatePlan(cyclic).some((error) => /cycle/.test(error)))
  assert.throws(() => reschedulePlan(cyclic, 'a', 1))
})
test('calendar arithmetic handles month boundaries and leap days in UTC', () => {
  assert.equal(shiftDate('2028-02-28', 1), '2028-02-29')
  assert.equal(shiftDate('2026-10-31', 1), '2026-11-01')
})
test('chart validation allows negative and zero values but rejects non-finite data', () => {
  const chart = {
    version: 1,
    title: 'Balance',
    kind: 'bar',
    series: [{ key: 'value', label: 'Balance', color: '#123456' }],
    points: [
      { label: 'A', value: -10 },
      { label: 'B', value: 0 },
    ],
  }
  assert.deepEqual(validateChart(chart), [])
  assert.ok(
    validateChart({ ...chart, points: [{ label: 'Bad', value: Infinity }] })
      .length
  )
})
test('CSV export quotes cells and neutralizes formula-like labels', () => {
  const chart = {
    version: 1,
    title: 'CSV',
    kind: 'line',
    series: [{ key: 'v', label: '=SUM(A1)', color: '#123456' }],
    points: [{ label: '@danger,"quoted"', v: 23 }],
  }
  const csv = chartCsv(chart)
  assert.match(csv, /"'=SUM\(A1\)"/)
  assert.match(csv, /"'@danger,""quoted"""/)
  assert.match(csv, /"23"/)
})
test('document export preserves formatting without evaluating HTML', () => {
  const markdown = documentMarkdown({
    version: 1,
    title: 'Brief',
    attachments: [],
    blocks: [
      { id: '1', kind: 'heading', text: 'Scope' },
      {
        id: '2',
        kind: 'paragraph',
        text: '**Bold** <script>alert(1)</script>',
      },
    ],
  })
  assert.match(markdown, /^# Brief/)
  assert.match(markdown, /## Scope/)
  assert.match(markdown, /\*\*Bold\*\*/)
})
test('keyboard reordering produces a new list and leaves boundary moves unchanged', () => {
  const items = ['a', 'b', 'c']
  assert.deepEqual(moveItem(items, 0, 2), ['b', 'c', 'a'])
  assert.deepEqual(items, ['a', 'b', 'c'])
  assert.deepEqual(moveItem(items, 0, -1), items)
})
