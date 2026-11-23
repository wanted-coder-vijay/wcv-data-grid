export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'
export interface FormField {
  id: string
  label: string
  type: FieldType
  required?: boolean
  help?: string
  options?: string[]
  step: number
  min?: number
  max?: number
  visibleWhen?: { fieldId: string; equals: string }
}
export interface FormSchema {
  version: 1
  title: string
  description: string
  steps: string[]
  fields: FormField[]
}
export type FormValues = Record<string, string | boolean>
export interface Resource {
  id: string
  name: string
  color: string
}
/** ISO instants; recurrence repeats at the same UTC time, not floating local time. */
export interface ScheduleEvent {
  id: string
  title: string
  start: string
  end: string
  resourceId: string
  recurrence?: 'weekly'
  repeatUntil?: string
}
export interface Schedule {
  version: 1
  events: ScheduleEvent[]
  resources: Resource[]
}
export interface ChartPoint {
  label: string
  [key: string]: string | number
}
export interface ChartSeries {
  key: string
  label: string
  color: string
}
export type ChartKind = 'line' | 'bar' | 'area'
export interface ChartConfig {
  curve?: 'monotone' | 'linear' | 'step'
  animated?: boolean
  markers?: boolean
  version: 1
  title: string
  kind: ChartKind
  points: ChartPoint[]
  series: ChartSeries[]
}
export interface DashboardWidget {
  id: string
  title: string
  kind: 'metric' | 'chart' | 'notes'
  width: 1 | 2 | 3
  metric?: number
  unit?: string
  note?: string
  chart?: ChartConfig
}
export interface Dashboard {
  version: 1
  title: string
  widgets: DashboardWidget[]
}
export type WorkflowNodeKind =
  | 'start'
  | 'approval'
  | 'condition'
  | 'action'
  | 'end'
export interface WorkflowNode {
  id: string
  label: string
  kind: WorkflowNodeKind
  x: number
  y: number
  assignee?: string
  condition?: { field: string; operator: 'gt' | 'eq'; value: string }
  action?: string
}
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  branch?: 'yes' | 'no'
}
export interface Workflow {
  version: 1
  title: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}
export interface PlanTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  assignee: string
  dependencies: string[]
  milestone?: boolean
}
export interface ProjectPlan {
  version: 1
  title: string
  tasks: PlanTask[]
}
export type BlockKind =
  | 'paragraph'
  | 'heading'
  | 'subheading'
  | 'bullet'
  | 'quote'
export interface DocumentBlock {
  id: string
  kind: BlockKind
  text: string
}
export interface DocumentAttachment {
  id: string
  name: string
  size: number
  type: string
}
/** Inline formatting uses **bold**, *italic* and @mentions; never raw HTML. */
export interface StudioDocument {
  version: 1
  title: string
  blocks: DocumentBlock[]
  attachments: DocumentAttachment[]
}
export interface SaveProps<T> {
  value: T
  onChange: (value: T) => void
}

export type ApplicationNodeKind =
  | 'client'
  | 'service'
  | 'database'
  | 'cache'
  | 'queue'
  | 'auth'
  | 'storage'
  | 'external'
export type ConnectorKind = 'https' | 'query' | 'event' | 'auth' | 'storage'
export interface ApplicationNode {
  id: string
  label: string
  kind: ApplicationNodeKind
  x: number
  y: number
  description: string
}
export interface ApplicationConnector {
  id: string
  source: string
  target: string
  label: string
  kind: ConnectorKind
  style: 'curve' | 'elbow' | 'straight'
}
export interface ApplicationDiagram {
  version: 1
  title: string
  description: string
  nodes: ApplicationNode[]
  connectors: ApplicationConnector[]
  notes: string
}
