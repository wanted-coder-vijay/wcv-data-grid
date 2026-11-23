import { useState } from 'react'
import {
  BookOpen,
  SlidersHorizontal,
  RotateCcw,
  Copy,
  Check,
  Download,
  ArrowUpRight,
  CalendarDays,
  LayoutDashboard,
  GitBranch,
  FileText,
  BarChart3,
  ListChecks,
  AlignLeft,
} from 'lucide-react'
import {
  FormBuilder,
  Scheduler,
  DashboardBuilder,
  WorkflowDesigner,
  GanttPlanner,
  DocumentEditor,
  ChartExplorer,
  ApplicationDesigner,
} from '../../../studio/src/index'
import type { FormValues } from '../../../studio/src/types'
import { studioTools, type StudioToolId } from './catalog'
import {
  formSample,
  scheduleSample,
  dashboardSample,
  workflowSample,
  planSample,
  documentSample,
  chartSample,
  applicationSample,
  documentTemplates,
} from './samples'
import '../../../studio/src/styles.css'
import './studio.css'
import { BrandMark } from '../Brand'
const icons = {
  application: GitBranch,
  forms: AlignLeft,
  scheduler: CalendarDays,
  dashboard: LayoutDashboard,
  workflow: GitBranch,
  gantt: ListChecks,
  document: FileText,
  charts: BarChart3,
}
const clone = <T,>(value: T): T => structuredClone(value)
function initialTool(): StudioToolId {
  if (typeof window === 'undefined') return 'forms'
  const id = new URLSearchParams(window.location.search).get('tool')
  return studioTools.find((tool) => tool.id === id)?.id ?? 'forms'
}
export default function StudioApp() {
  const [active, setActive] = useState<StudioToolId>(initialTool),
    [tab, setTab] = useState<'playground' | 'docs'>('playground'),
    [failure, setFailure] = useState(false),
    [message, setMessage] = useState(''),
    [copied, setCopied] = useState(false)
  const [form, setForm] = useState(() => clone(formSample)),
    [schedule, setSchedule] = useState(() => clone(scheduleSample)),
    [dashboard, setDashboard] = useState(() => clone(dashboardSample)),
    [workflow, setWorkflow] = useState(() => clone(workflowSample)),
    [plan, setPlan] = useState(() => clone(planSample)),
    [document, setDocument] = useState(() => clone(documentSample)),
    [application, setApplication] = useState(() => clone(applicationSample)),
    [chart, setChart] = useState(() => clone(chartSample)),
    [responses, setResponses] = useState<FormValues[]>([])
  const tool = studioTools.find((item) => item.id === active)!,
    Icon = icons[active]
  const values = {
    application,
    forms: form,
    scheduler: schedule,
    dashboard,
    workflow,
    gantt: plan,
    document,
    charts: chart,
  }
  async function save(kind: string, value: unknown) {
    await new Promise((resolve) => setTimeout(resolve, 450))
    if (failure)
      throw new Error(
        'Demo save failed. Your draft is retained; disable simulated failure and try again.'
      )
    localStorage.setItem(`dynostack-studio:${kind}`, JSON.stringify(value))
    setMessage(`Saved ${kind} in this browser.`)
  }
  function reset() {
    const setters = {
      application: () => setApplication(clone(applicationSample)),
      forms: () => setForm(clone(formSample)),
      scheduler: () => setSchedule(clone(scheduleSample)),
      dashboard: () => setDashboard(clone(dashboardSample)),
      workflow: () => setWorkflow(clone(workflowSample)),
      gantt: () => setPlan(clone(planSample)),
      document: () => setDocument(clone(documentSample)),
      charts: () => setChart(clone(chartSample)),
    }
    setters[active]()
    setMessage('Sample configuration restored.')
    setResponses([])
  }
  function navigate(id: StudioToolId) {
    setActive(id)
    setMessage('')
    setCopied(false)
    const url = new URL(window.location.href)
    url.searchParams.set('tool', id)
    history.replaceState({}, '', url)
  }
  const code = `import { useState } from 'react'\nimport { ${tool.component} } from '@dynostack/react-studio/${active}'\nimport '@dynostack/react-studio/styles.css'\n\n// initialValue: the JSON exported from this playground\nexport function Example({ initialValue }) {\n  const [value, setValue] = useState(initialValue)\n  return <${tool.component}\n    value={value}\n    onChange={setValue}\n    ${tool.callback}={${active === 'charts' ? '(point) => console.log(point)' : active === 'forms' ? 'async (response) => {\n      // await your API; throw on failure to retain the response\n    }' : active === 'scheduler' ? 'async (event) => {\n      // await your API; throw on failure to retain the event draft\n    }' : 'async (draft) => {\n      // await your API; throw on failure to retain the draft\n    }'}}\n  />\n}`
  return (
    <main className="ds-studio">
      <aside className="ds-studio-nav">
        <a href="/#products" className="ds-studio-back">
          ← All products
        </a>
        <div className="ds-studio-brand">
          <span className="ds-studio-logo">
            <BrandMark size={27} />
          </span>
          <div>
            <strong>Dynostack Studio</strong>
            <small>Tools for working teams</small>
          </div>
        </div>
        <a className="ds-studio-grid-link" href="/blocks">
          Explore component blocks <ArrowUpRight size={14} />
        </a>
        <nav aria-label="Studio tools">
          {studioTools.map((item) => {
            const ItemIcon = icons[item.id]
            return (
              <button
                key={item.id}
                aria-current={active === item.id ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                <ItemIcon size={18} />
                <span>{item.name}</span>
                {active === item.id && <i />}
              </button>
            )
          })}
        </nav>
        <div className="ds-studio-note">
          <strong>First release</strong>
          <p>Eight independent modules. One shared language.</p>
          <span>Local preview · v0.1.0</span>
        </div>
        <a className="ds-studio-grid-link" href="/playground">
          Open React Grid <ArrowUpRight size={14} />
        </a>
      </aside>
      <div className="ds-studio-main">
        <div className="ds-studio-topline">
          <span>Dynostack / Studio / {tool.name}</span>
          <span>React + TypeScript</span>
        </div>
        <header className="ds-studio-intro">
          <div>
            <div className="ds-studio-title">
              <Icon size={30} />
              <h1>{tool.name}</h1>
            </div>
            <p>{tool.description}</p>
          </div>
          <button onClick={reset}>
            <RotateCcw size={14} />
            Reset sample
          </button>
        </header>
        <div className="ds-studio-capabilities">
          {tool.features.map((feature) => (
            <span key={feature}>
              <Check size={13} />
              {feature}
            </span>
          ))}
        </div>
        <div className="ds-studio-tabbar">
          <div>
            <button
              aria-pressed={tab === 'playground'}
              onClick={() => setTab('playground')}
            >
              <SlidersHorizontal size={15} />
              Playground
            </button>
            <button
              aria-pressed={tab === 'docs'}
              onClick={() => setTab('docs')}
            >
              <BookOpen size={15} />
              Integration docs
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={failure}
              onChange={(e) => setFailure(e.target.checked)}
            />
            Simulate save failure
          </label>
        </div>
        {message && (
          <p className="ds-studio-message" role="status">
            {message}
          </p>
        )}
        {tab === 'playground' ? (
          <div key={active} className="ds-studio-workspace">
            {active === 'forms' && (
              <>
                <FormBuilder
                  value={form}
                  onChange={setForm}
                  onSubmit={async (response) => {
                    await save('response', response)
                    setResponses((previous) => [...previous, response])
                  }}
                />
                {responses.length > 0 && (
                  <div className="ds-studio-responses">
                    <h3>Submitted responses ({responses.length})</h3>
                    <pre>{JSON.stringify(responses.at(-1), null, 2)}</pre>
                  </div>
                )}
              </>
            )}
            {active === 'scheduler' && (
              <Scheduler
                value={schedule}
                onChange={setSchedule}
                anchorDate="2026-10-08"
                onSaveEvent={async (event) => {
                  await save('event', event)
                }}
              />
            )}
            {active === 'application' && (
              <ApplicationDesigner
                value={application}
                onChange={setApplication}
                onSave={(draft) => save('application', draft)}
              />
            )}
            {active === 'dashboard' && (
              <DashboardBuilder
                value={dashboard}
                onChange={setDashboard}
                chart={chart}
                onSave={(draft) => save('dashboard', draft)}
              />
            )}
            {active === 'workflow' && (
              <WorkflowDesigner
                value={workflow}
                onChange={setWorkflow}
                onSave={(draft) => save('workflow', draft)}
              />
            )}
            {active === 'gantt' && (
              <GanttPlanner
                value={plan}
                onChange={setPlan}
                onSave={(draft) => save('plan', draft)}
              />
            )}
            {active === 'document' && (
              <DocumentEditor
                value={document}
                onChange={setDocument}
                templates={documentTemplates}
                onSave={(draft) => save('document', draft)}
              />
            )}
            {active === 'charts' && (
              <ChartExplorer
                value={chart}
                onChange={setChart}
                onDrillDown={(point) =>
                  setMessage(
                    `Inspecting ${point.label}: ${chart.series.map((series) => `${series.label} ${point[series.key]}`).join(', ')}.`
                  )
                }
              />
            )}
          </div>
        ) : (
          <section className="ds-studio-docs">
            <div>
              <h2>Use {tool.name.toLowerCase()} in your app</h2>
              <p>
                Install the Studio package, import only the module you
                need, and pass the exported configuration as controlled state.
              </p>
              <div className="ds-studio-install">
                <code>
                  npm install @dynostack/react-studio
                </code>
                <span>
                  React Grid remains a separate package. Studio ships standalone CSS and React peers.
                </span>
              </div>
              <h3>Controlled state</h3>
              <p>
                <code>value</code> is your document. <code>onChange</code>{' '}
                receives the next complete configuration. Keep it in React state
                or your application store. Styling is plain CSS; no Tailwind
                setup is required.
              </p>
              <h3>Save and failure handling</h3>
              <p>
                {active === 'charts'
                  ? 'onDrillDown receives the selected data point. Range and hidden-series controls are local display state.'
                  : 'The callback can return a promise. Throw an Error when your API rejects a save. The editor displays it and retains the draft for retry. Validate and authorize all data again on your server.'}
              </p>
              <h3>First-release scope</h3>
              <p>{tool.scope}</p>
              <h3>Export the configuration</h3>
              <p>
                Use Configuration or Export JSON in the playground. The exported
                JSON contains the model, not React callbacks or files. The demo
                save stores data in this browser; application callbacks should
                store it in your backend.
              </p>
              <button
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(values[active], null, 2)], {
                      type: 'application/json',
                    })
                  )
                  const link = window.document.createElement('a')
                  link.href = url
                  link.download = `${active}.json`
                  link.click()
                  setTimeout(() => URL.revokeObjectURL(url), 1000)
                }}
              >
                <Download size={14} />
                Export current configuration
              </button>
            </div>
            <div className="ds-studio-example">
              <div>
                <span>React integration</span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(code)
                      setCopied(true)
                    } catch {
                      setMessage(
                        'Clipboard unavailable. Select the example to copy it.'
                      )
                    }
                  }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy code'}
                </button>
              </div>
              <pre>
                <code>{code}</code>
              </pre>
            </div>
          </section>
        )}
        <div className="ds-studio-footnote">
          <span>{tool.scope}</span>
          <a
            href="https://github.com/wanted-coder-vijay/wcv-data-grid"
            target="_blank"
            rel="noreferrer"
          >
            Source <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </main>
  )
}
