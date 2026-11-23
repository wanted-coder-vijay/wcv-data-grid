# Dynostack React Studio

Eight controlled React modules for business workflows. Published independently as `@dynostack/react-studio`; it does not depend on React Grid.

| Import                              | Component          | Model            |
| ----------------------------------- | ------------------ | ---------------- |
| `@dynostack/react-studio/forms`     | `FormBuilder`      | `FormSchema`     |
| `@dynostack/react-studio/scheduler` | `Scheduler`        | `Schedule`       |
| `@dynostack/react-studio/dashboard` | `DashboardBuilder` | `Dashboard`      |
| `@dynostack/react-studio/workflow`  | `WorkflowDesigner` | `Workflow`       |
| `@dynostack/react-studio/gantt`     | `GanttPlanner`     | `ProjectPlan`    |
| `@dynostack/react-studio/document`  | `DocumentEditor`   | `StudioDocument` |
| `@dynostack/react-studio/application` | `ApplicationDesigner` | `ApplicationDiagram` |
| `@dynostack/react-studio/charts`    | `ChartExplorer`    | `ChartConfig`    |

## Install

```sh
npm install @dynostack/react-studio
```

## Build locally

From this directory, run `npm install`, `npm run typecheck`, `npm run build`, `npm test`, and `npm pack`. Install the generated `.tgz` in your React application. In this repository, build tools and React can resolve from the parent `node_modules` without another install.

Import `@dynostack/react-studio/styles.css` once. CSS is scoped to `.ds-tool` and does not require Tailwind, Radix, the data grid, or a runtime chart library. Individual subpath imports keep unrelated modules out of your application's entry point. React 18.2+ is a peer dependency.

```tsx
import { useState } from 'react'
import { FormBuilder } from '@dynostack/react-studio/forms'
import type { FormSchema } from '@dynostack/react-studio'
import '@dynostack/react-studio/styles.css'

const initial: FormSchema = {
  version: 1,
  title: 'Contact',
  description: 'Tell us about your project.',
  steps: ['Details'],
  fields: [
    {
      id: 'email',
      label: 'Work email',
      type: 'email',
      step: 0,
      required: true,
    },
  ],
}
export function Intake() {
  const [value, setValue] = useState(initial)
  return (
    <FormBuilder
      value={value}
      onChange={setValue}
      onSubmit={async (response) => {
        const result = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response),
        })
        if (!result.ok) throw new Error('Could not submit. Please try again.')
      }}
    />
  )
}
```

## State and persistence

Every component takes `value` and `onChange(nextValue)`. The application owns the model; changes are immutable. IDs must be stable and unique. Exported configurations have `version: 1` and contain serializable data. They do not contain callbacks, upload contents, or credentials.

`FormBuilder.onSubmit(values)` receives visible field values after validation. `Scheduler.onSaveEvent(event)` is awaited before the event is committed to the controlled schedule. `DashboardBuilder`, `WorkflowDesigner`, `GanttPlanner`, and `DocumentEditor` expose `onSave(model)`. Return a promise to show saving state; throw an Error to display a failure and keep edits for retry. Schedule deletion is an `onChange` operation; applications must persist the updated collection themselves. `ChartExplorer.onDrillDown(point)` reports a selected period.

The showcase at `/studio?tool=forms` includes working sample configurations, JSON download/copy, integration examples and save-failure simulation. Its save adapter stores selected data in browser local storage; it is not a production backend, and editable sessions are not automatically restored after refresh. Backend callbacks must enforce authentication, authorization, validation and concurrency rules on the server.

## Public helpers

The `./core` entry exports types and pure helpers: `validateFormSchema`, `validateForm`, `formSubmission`, `fieldVisible`, `expandEvents`, `validateEvent`, `validateWorkflow`, `simulateWorkflow`, `validatePlan`, `reschedulePlan`, `criticalPath`, `validateChart`, `chartCsv`, `shiftDate`, `dateDistance`, `moveItem` and `csvCell`.

Scheduler events store ISO instants; task dates store `YYYY-MM-DD` calendar dates. Weekly recurrence is bounded to one year by the appointment editor and repeats in UTC. Finish-to-start tasks begin on a calendar day after dependencies finish.

## Styling and accessibility

Override `--ds-bg`, `--ds-surface`, `--ds-soft`, `--ds-text`, `--ds-muted`, `--ds-border`, `--ds-accent`, `--ds-accent-soft` and `--ds-edge` on `.ds-tool` to customize colors. All controls have native keyboard access. Forms and widgets have reorder buttons; workflow nodes move with arrows; Gantt bars move with left/right arrows. Charts expose data point buttons instead of requiring pointer hover. Motion is not required and reduced-motion preferences are respected.

See [FEATURES.md](FEATURES.md) for the implemented scope and remaining advanced capabilities.

## Application architecture and component blocks

`ApplicationDesigner` is exported from `@dynostack/react-studio/application`.
It accepts `value: ApplicationDiagram`, `onChange` and optional async `onSave`.
The diagram model contains component nodes, typed connectors and architecture notes.
Use canvas, code or split mode. The code pane accepts the version 1 JSON schema;
Apply rejects invalid IDs, unsupported kinds, coordinates outside +/-10000 and
more than 100 nodes / 300 connectors. Cycles are supported for architecture.

Select and drag a node or focus the canvas and move the selected node with arrow
keys (Shift moves 25 units). Connect two components with the Connect tool or node
ports. Select a connector to edit its label, protocol and curve/elbow/straight
style. Pan, zoom, fit, erase, undo/redo, SVG, JSON and Markdown exports are local.
The walkthrough describes each node and connector. Connector types document
contracts; they do not provision services or connect accounts.

Charts default to shape-preserving cubic interpolation. Set `curve` to
`monotone`, `linear` or `step`, `markers` to show all points and `animated: false`
to disable entry motion. Hover inspection, keyboard period buttons, range
sliders and a drag range selection are available. `ChartView` also supports
`sparkline` and `onRangeSelect`. `MetricCard` combines a KPI and a sparkline.
Reduced-motion preferences disable animation.

The showcase `/blocks` gallery has ten live blocks, filters, search, preview/code,
375px preview widths, replay and copyable integration examples. Studio and Blocks
consume the site's existing graphite theme tokens in both appearance modes.
Standalone CSS defaults to neutral light; override `--ds-*` on a `.ds-tool`
container for your application theme.
