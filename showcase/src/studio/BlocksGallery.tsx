import { useState, type ReactNode } from 'react'
import {
  ArrowUpRight,
  Code2,
  Monitor,
  Smartphone,
  RotateCcw,
  Copy,
  Check,
  Search,
  Boxes,
} from 'lucide-react'
import {
  ChartView,
  MetricCard,
  FormBuilder,
  Scheduler,
  DashboardBuilder,
  WorkflowDesigner,
  GanttPlanner,
  DocumentEditor,
  ApplicationDesigner,
} from '../../../studio/src/index'
import {
  chartSample,
  formSample,
  scheduleSample,
  dashboardSample,
  workflowSample,
  planSample,
  documentSample,
  applicationSample,
} from './samples'
import { studioTools, type StudioToolId } from './catalog'
import '../../../studio/src/styles.css'
import './studio.css'
import './blocks.css'
const blockInfo = [
  {
    id: 'metric',
    name: 'Revenue overview',
    category: 'Charts',
    description:
      'A compact KPI with a gradient area chart and period comparison.',
  },
  {
    id: 'line-metric',
    name: 'Activity pulse',
    category: 'Charts',
    description: 'A quiet line chart paired with a single headline metric.',
  },
  ...studioTools.map((t) => ({
    id: t.id,
    name: t.name,
    category:
      t.id === 'charts'
        ? 'Charts'
        : t.id === 'application' || t.id === 'workflow'
          ? 'Workflows'
          : 'Productivity',
    description: t.description,
  })),
]
function Block({ item }: { item: (typeof blockInfo)[number] }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview'),
    [mobile, setMobile] = useState(false),
    [replay, setReplay] = useState(0),
    [copy, setCopy] = useState(''),
    [chart, setChart] = useState(() => structuredClone(chartSample)),
    [form, setForm] = useState(() => structuredClone(formSample)),
    [schedule, setSchedule] = useState(() => structuredClone(scheduleSample)),
    [dashboard, setDashboard] = useState(() =>
      structuredClone(dashboardSample)
    ),
    [workflow, setWorkflow] = useState(() => structuredClone(workflowSample)),
    [plan, setPlan] = useState(() => structuredClone(planSample)),
    [document, setDocument] = useState(() => structuredClone(documentSample)),
    [application, setApplication] = useState(() =>
      structuredClone(applicationSample)
    )
  const values = {
    forms: form,
    scheduler: schedule,
    dashboard,
    workflow,
    gantt: plan,
    document,
    charts: chart,
    application,
  }
  const metric = item.id === 'metric' || item.id === 'line-metric',
    tool = studioTools.find((t) => t.id === item.id),
    model = metric
      ? {
          ...chart,
          kind: item.id === 'metric' ? 'area' : 'line',
          series: [chart.series[0]],
        }
      : values[item.id as StudioToolId]
  const component = metric
      ? 'MetricCard'
      : item.id === 'charts'
        ? 'ChartView'
        : tool!.component,
    extra = metric
      ? item.id === 'metric'
        ? ' title="Monthly revenue" metric="$148,200" change={12.8}'
        : ' title="Active sessions" metric="24,892" change={8.4}'
      : item.id === 'scheduler'
        ? ' anchorDate="2026-10-05"'
        : item.id === 'dashboard'
          ? ' chart={chartData}'
          : ''
  const code = `import { useState } from 'react'\nimport { ${component} } from '@dynostack/react-studio/${metric ? 'charts' : item.id}'\nimport '@dynostack/react-studio/styles.css'\n\nconst initialValue = ${JSON.stringify(model, null, 2)}${item.id === 'dashboard' ? '\nconst chartData = ' + JSON.stringify(chart, null, 2) : ''}\n\nexport function Example() {\n  const [value, setValue] = useState(initialValue)\n  return <${component} value={value}${metric || item.id === 'charts' ? '' : ' onChange={setValue}'}${extra} />\n}`
  let preview: ReactNode
  switch (item.id) {
    case 'metric':
    case 'line-metric':
      preview = (
        <MetricCard
          title={item.id === 'metric' ? 'Monthly revenue' : 'Active sessions'}
          metric={item.id === 'metric' ? '$148,200' : '24,892'}
          change={item.id === 'metric' ? 12.8 : 8.4}
          value={{
            ...chart,
            kind: item.id === 'metric' ? 'area' : 'line',
            series: [chart.series[0]],
          }}
        />
      )
      break
    case 'charts':
      preview = (
        <div className="ds-block-chart">
          <div className="ds-block-chart-heading">
            <div>
              <span>PERFORMANCE</span>
              <h3>{chart.title}</h3>
              <p>Revenue and costs / sample monthly data</p>
            </div>
            <select
              aria-label="Block chart curve"
              value={chart.curve ?? 'monotone'}
              onChange={(e) =>
                setChart({
                  ...chart,
                  curve: e.target.value as typeof chart.curve,
                })
              }
            >
              <option value="monotone">Smooth curve</option>
              <option value="linear">Linear</option>
              <option value="step">Step</option>
            </select>
          </div>
          <ChartView value={chart} />
        </div>
      )
      break
    case 'forms':
      preview = <FormBuilder value={form} onChange={setForm} />
      break
    case 'scheduler':
      preview = (
        <Scheduler
          value={schedule}
          onChange={setSchedule}
          anchorDate="2026-10-05"
        />
      )
      break
    case 'dashboard':
      preview = (
        <DashboardBuilder
          value={dashboard}
          onChange={setDashboard}
          chart={chart}
        />
      )
      break
    case 'workflow':
      preview = <WorkflowDesigner value={workflow} onChange={setWorkflow} />
      break
    case 'application':
      preview = (
        <ApplicationDesigner value={application} onChange={setApplication} />
      )
      break
    case 'gantt':
      preview = <GanttPlanner value={plan} onChange={setPlan} />
      break
    default:
      preview = <DocumentEditor value={document} onChange={setDocument} />
  }
  return (
    <article
      className={`ds-block-card ${metric ? 'is-metric' : 'is-wide'}`}
      id={`block-${item.id}`}
    >
      <div className="ds-block-card-head">
        <div>
          <span>{item.category}</span>
          <h2>{item.name}</h2>
        </div>
        <a
          href={`/studio?tool=${metric ? 'charts' : item.id}`}
          aria-label={`Open ${item.name} playground`}
        >
          Playground <ArrowUpRight size={13} />
        </a>
      </div>
      <p className="ds-block-description">{item.description}</p>
      <div className="ds-block-controls">
        <div>
          <button
            aria-pressed={tab === 'preview'}
            onClick={() => setTab('preview')}
          >
            Preview
          </button>
          <button aria-pressed={tab === 'code'} onClick={() => setTab('code')}>
            <Code2 size={13} />
            Code
          </button>
        </div>
        <div>
          <button
            aria-label={`${item.name} desktop preview`}
            aria-pressed={!mobile}
            onClick={() => setMobile(false)}
          >
            <Monitor size={14} />
          </button>
          <button
            aria-label={`${item.name} mobile preview`}
            aria-pressed={mobile}
            onClick={() => setMobile(true)}
          >
            <Smartphone size={14} />
          </button>
          <button
            aria-label={`Replay ${item.name}`}
            onClick={() => setReplay(replay + 1)}
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code)
                setCopy('Copied')
              } catch {
                setCopy('Select code to copy')
                setTab('code')
              }
            }}
          >
            {copy === 'Copied' ? <Check size={13} /> : <Copy size={13} />}{' '}
            {copy || 'Copy code'}
          </button>
        </div>
      </div>
      {tab === 'preview' ? (
        <div className="ds-block-preview">
          <div
            key={replay}
            className={`ds-block-preview-content ${mobile ? 'is-mobile' : ''}`}
          >
            {preview}
          </div>
        </div>
      ) : (
        <pre className="ds-block-source" tabIndex={0}>
          <code>{code}</code>
        </pre>
      )}
      <div className="ds-block-footer">
        <code>{component}</code>
        <span>Controlled React / local package</span>
      </div>
    </article>
  )
}
export default function BlocksGallery() {
  const [filter, setFilter] = useState('All'),
    [query, setQuery] = useState('')
  const shown = blockInfo.filter(
    (b) =>
      (filter === 'All' || b.category === filter) &&
      `${b.name} ${b.description} ${b.category}`
        .toLowerCase()
        .includes(query.toLowerCase())
  )
  return (
    <main className="ds-blocks ds-tool">
      <header className="ds-blocks-hero">
        <div className="ds-blocks-eyebrow">
          <Boxes size={14} /> DYNOSTACK COMPONENT LIBRARY
        </div>
        <h1>
          Building blocks.
          <br />
          <span>Ready for your application.</span>
        </h1>
        <p>
          Purposeful interfaces for the work your product needs to do. Explore a
          live block, adjust it in the playground, and take the configuration
          into your React application.
        </p>
        <div className="ds-blocks-hero-actions">
          <a href="/studio?tool=application">
            Open Studio <ArrowUpRight size={14} />
          </a>
          <span>8 modules / 10 live blocks</span>
        </div>
      </header>
      <section className="ds-blocks-library" aria-label="Component blocks">
        <div className="ds-blocks-filter">
          <div>
            {['All', 'Charts', 'Workflows', 'Productivity'].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <label>
            <Search size={14} />
            <input
              aria-label="Search blocks"
              placeholder="Search blocks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <p className="ds-blocks-count">
          {shown.length} blocks / Preview interactions run locally. Build the
          Studio package to use these components.
        </p>
        <div className="ds-blocks-grid">
          {shown.map((item) => (
            <Block item={item} key={item.id} />
          ))}
        </div>
        {!shown.length && (
          <div className="ds-blocks-empty">
            No blocks match this search.
            <button
              onClick={() => {
                setQuery('')
                setFilter('All')
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <aside className="ds-blocks-install">
          <h2>From preview to your product</h2>
          <p>
            Build and pack the local Studio package, install the generated
            archive, and import the module shown in each code tab. Your
            application owns authentication, persistence and data sources.
          </p>
          <code>cd studio &amp;&amp; npm run build &amp;&amp; npm pack</code>
          <a href="/studio?tool=application">
            Explore application architecture <ArrowUpRight size={14} />
          </a>
        </aside>
      </section>
    </main>
  )
}
