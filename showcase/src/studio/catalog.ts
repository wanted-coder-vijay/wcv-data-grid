export const studioTools = [
  {
    id: 'application',
    name: 'Application workflow',
    component: 'ApplicationDesigner',
    description:
      'Map how your application works, explain service responsibilities, and define the contracts between them.',
    features: [
      'Canvas and code',
      'Typed connectors',
      'Undo and redo',
      'SVG and notes export',
    ],
    initial: 'applicationSample',
    callback: 'onSave',
    scope:
      'Reference architecture with editable JSON code, eight component types and five connector protocols. Connectors are documentation; backend adapters and credentials belong in your application.',
  },
  {
    id: 'forms',
    name: 'Form builder',
    component: 'FormBuilder',
    description:
      'Turn a project request into a form your team can actually use.',
    features: [
      'Seven field types',
      'Conditional visibility',
      'Multistep validation',
      'Async submission',
    ],
    initial: 'formSample',
    callback: 'onSubmit',
    scope:
      'Structured JSON forms with a visual editor and runtime preview. Hidden values are excluded from submission. Your callback owns persistence.',
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    component: 'Scheduler',
    description: 'See who is booked, make room for the next appointment.',
    features: [
      'Resource calendars',
      'Weekly recurrence',
      'Timezone display',
      'Conflict detection',
    ],
    initial: 'scheduleSample',
    callback: 'onSaveEvent',
    scope:
      'Week and agenda views. Instants are stored in UTC. Weekly repeats keep the same UTC time, which may shift local time across DST. Editing or deleting a recurrence affects its full series.',
  },
  {
    id: 'dashboard',
    name: 'Dashboard builder',
    component: 'DashboardBuilder',
    description:
      'Arrange the metrics, charts, and notes that move your team forward.',
    features: [
      'Three widget types',
      'Reorder and resize',
      'Live configuration',
      'Async layout save',
    ],
    initial: 'dashboardSample',
    callback: 'onSave',
    scope:
      'Responsive three-column layouts. Widget width is set in column units; drag and keyboard controls reorder widgets. Data comes from your application, with no built-in analytics backend.',
  },
  {
    id: 'workflow',
    name: 'Workflow designer',
    component: 'WorkflowDesigner',
    description:
      'Map an approval, follow its branches, test the path before it runs.',
    features: [
      'Movable nodes',
      'Condition branches',
      'Graph validation',
      'Path simulation',
    ],
    initial: 'workflowSample',
    callback: 'onSave',
    scope:
      'Acyclic approval diagrams with yes/no conditions. Simulation uses supplied JSON and reviewer decisions. This package does not execute services, messages, or durable jobs.',
  },
  {
    id: 'gantt',
    name: 'Gantt planner',
    component: 'GanttPlanner',
    description: 'Plan the launch with real dates, owners, and dependencies.',
    features: [
      'Finish-to-start links',
      'Cascade rescheduling',
      'Milestones and progress',
      'Baseline comparison',
    ],
    initial: 'planSample',
    callback: 'onSave',
    scope:
      'Calendar-day tasks and strict finish-to-start dependencies. Moving a task pushes successors forward. The highlighted chain is the longest by task duration, not a full CPM calculation. No business calendars or resource leveling.',
  },
  {
    id: 'document',
    name: 'Document editor',
    component: 'DocumentEditor',
    description:
      'Write the brief, bring in the team, keep the decisions together.',
    features: [
      'Structured blocks',
      'Bold, italic, mentions',
      'Templates and outline',
      'Markdown export',
    ],
    initial: 'documentSample',
    callback: 'onSave',
    scope:
      'Block-based writing with safe inline formatting, read mode and metadata attachments. Connect onAttach for real uploads. No real-time collaboration, comments, or tracked changes in this first release.',
  },
  {
    id: 'charts',
    name: 'Chart explorer',
    component: 'ChartExplorer',
    description:
      'Find the story in the numbers, then inspect what is behind it.',
    features: [
      'Line, bar, area',
      'Series toggles',
      'Range exploration',
      'CSV and JSON export',
    ],
    initial: 'chartSample',
    callback: 'onDrillDown',
    scope:
      'SVG charts for modest datasets with keyboard-accessible data inspection and range filters. Values must be finite numbers. No streaming, aggregation service, or large-dataset downsampling.',
  },
] as const
export type StudioToolId = (typeof studioTools)[number]['id']
