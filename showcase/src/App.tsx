import { useEffect, useMemo, useState } from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react"
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Copy,
  CodeXml as Github,
  Grid2X2,
  SlidersHorizontal,
  BookOpen,
  RotateCcw,
  Package,
  Command,
  Download,
  Layers,
  MousePointer2,
  Sparkles,
  Sun,
  Moon,
  Activity,
  Pause,
  Play,
} from "lucide-react"
import {
  DataTable,
  themePresets,
  buildPreset,
  type DataTableFeatures,
  type DataTableDensity,
  type DataTableThemeName,
  type DataTableModedTheme,
} from "@dynostack/react-grid"
import { createData, createColumns, type Project } from "./data"
import { BrandMark } from "./Brand"
import { products } from "./products"

const featureNames: Record<keyof DataTableFeatures, string> = {
  search: "Global search",
  refresh: "Refresh data",
  columnVisibility: "Column visibility",
  export: "CSV & Excel export",
  addRow: "Add rows",
  pagination: "Pagination",
  sorting: "Sorting",
  filtering: "Column filters",
  resizing: "Column resizing",
  reordering: "Drag to reorder",
  pinning: "Column pinning",
}
const defaultFeatures = Object.fromEntries(
  Object.keys(featureNames).map((key) => [key, true])
) as Required<DataTableFeatures>
type Config = {
  features: Required<DataTableFeatures>
  density: DataTableDensity
  theme: DataTableThemeName
  selection: boolean
  editing: boolean
  loading: boolean
  actions: boolean
  expansion: boolean
  striped: boolean
  sticky: boolean
  dark: boolean
  count: number
  size: number
  hue: number
  custom: boolean
  isolate: boolean
  translated: boolean
}
const defaults: Config = {
  features: defaultFeatures,
  density: "default",
  theme: "graphite",
  selection: true,
  editing: true,
  loading: false,
  actions: true,
  expansion: false,
  striped: false,
  sticky: true,
  dark: false,
  count: 48,
  size: 10,
  hue: 235,
  custom: false,
  isolate: true,
  translated: false,
}
const repo = "https://github.com/wanted-coder-vijay/wcv-data-grid"
function getRoute() {
  return location.pathname.startsWith("/playground")
    ? "playground"
    : location.pathname.startsWith("/docs")
      ? "docs"
      : "home"
}
function CopyButton({
  text,
  label = "Copy",
}: {
  text: string
  label?: string
}) {
  const [state, setState] = useState("")
  return (
    <button
      className="copy-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setState("Copied")
          setTimeout(() => setState(""), 1800)
        } catch {
          setState("Select the code to copy")
        }
      }}
    >
      {state === "Copied" ? <Check size={14} /> : <Copy size={14} />}{" "}
      {state || label}
    </button>
  )
}
function Code({ text }: { text: string }) {
  return (
    <div className="code-block">
      <CopyButton text={text} />
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  )
}
function Switch({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: () => void
}) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={onChange} />
      <span className="switch-track" aria-hidden="true" />
    </label>
  )
}

function Demo({
  config = defaults,
  small = false,
  resetKey = 0,
  onSelection,
}: {
  config?: Config
  small?: boolean
  resetKey?: number
  onSelection?: (rows: Project[]) => void
}) {
  const [rows, setRows] = useState(() => createData(config.count))
  const [message, setMessage] = useState("")
  useEffect(() => setRows(createData(config.count)), [config.count, resetKey])
  const columns = useMemo(() => createColumns(config.editing), [config.editing])
  const preset: DataTableModedTheme = config.custom
    ? buildPreset(config.hue)
    : themePresets[config.theme]
  const theme = preset
  function notify(text: string) {
    setMessage(text)
    setTimeout(() => setMessage(""), 2400)
  }
  return (
    <div className={`demo-body ${config.dark ? "dark" : ""}`}>
      <DataTable<Project>
        key={`${config.size}-${resetKey}`}
        data={rows}
        isLoading={config.loading}
        columns={columns}
        ariaLabel="Project workspace"
        theme={theme}
        className={config.dark ? "dark" : "light"}
        isolate={config.isolate}
        density={config.density}
        features={
          small
            ? { ...config.features, addRow: false, refresh: false }
            : config.features
        }
        initialPageSize={small ? 5 : config.size}
        pageSizeOptions={[5, 10, 20, 50, 100]}
        striped={config.striped}
        stickyHeader={config.sticky}
        maxHeight={small ? undefined : "520px"}
        enableSelection={config.selection}
        onSelectionChange={onSelection}
        rowActions={
          small || !config.actions
            ? []
            : config.editing
              ? ["view", "edit", "duplicate", "delete"]
              : ["view", "duplicate", "delete"]
        }
        labels={
          config.translated
            ? {
                search: "Rechercher…",
                addRow: "Ajouter",
                columns: "Colonnes",
                export: "Exporter",
                total: "Total",
                noResults: "Aucun résultat.",
              }
            : undefined
        }
        onRefresh={() => {
          setRows(createData(config.count))
          notify("Sample data refreshed")
        }}
        onCellEdit={(row, columnId, value) => {
          setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, [columnId]: value } : r))
          )
          notify("Cell saved")
        }}
        onRowSave={(row, draft) => {
          setRows((prev) =>
            prev.some((r) => r.id === row.id)
              ? prev.map((r) => (r.id === row.id ? { ...r, ...draft } : r))
              : [...prev, { ...row, ...draft }]
          )
          notify("Row saved")
        }}
        onAddRow={() => ({
          id: `PRJ-${crypto.randomUUID().slice(0, 6)}`,
          name: "New project",
          owner: "You",
          status: "Backlog",
          priority: "Medium",
          budget: 0,
          date: "2026-10-20",
          progress: 0,
        })}
        onDelete={(row) => {
          setRows((prev) => prev.filter((r) => r.id !== row.id))
          notify("Project deleted")
        }}
        onBulkDelete={(selected) => {
          const ids = new Set(selected.map((r) => r.id))
          setRows((prev) => prev.filter((r) => !ids.has(r.id)))
          notify(`${ids.size} projects deleted`)
        }}
        onRowAction={(action, row) => {
          if (action === "duplicate") {
            setRows((prev) => [
              ...prev,
              {
                ...row,
                id: `PRJ-${crypto.randomUUID().slice(0, 6)}`,
                name: `${row.name} (copy)`,
              },
            ])
            notify("Project duplicated")
          }
        }}
        renderSubRow={
          config.expansion
            ? (row) => (
                <div className="detail">
                  <strong>{row.name}</strong>
                  <p>
                    Owned by {row.owner}. Budget: ${row.budget.toLocaleString()}
                    . Due {row.date}. Open the row menu to view details or edit
                    the project.
                  </p>
                </div>
              )
            : undefined
        }
        exportFileName="dynostack-projects"
      />
      {message && (
        <div className="toast" role="status">
          <Check size={15} />
          {message}
        </div>
      )}
    </div>
  )
}

function HeroTable({ dark, animated }: { dark: boolean; animated: boolean }) {
  const prefersReduced = useReducedMotion()
  const reduced = prefersReduced || !animated
  const x = useMotionValue(0),
    y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 120, damping: 20 }),
    sy = useSpring(y, { stiffness: 120, damping: 20 })
  const rotateY = useTransform(sx, [-1, 1], [-3, 3]),
    rotateX = useTransform(sy, [-1, 1], [3, -3])
  return (
    <div
      className="hero-visual"
      onPointerMove={(e) => {
        if (reduced || e.pointerType === "touch") return
        const r = e.currentTarget.getBoundingClientRect()
        x.set(((e.clientX - r.left) / r.width) * 2 - 1)
        y.set(((e.clientY - r.top) / r.height) * 2 - 1)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      <motion.div
        className="hero-table"
        style={{ rotateX, rotateY }}
        initial={reduced ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      >
        <div className="window-bar">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <span>
            <Grid2X2 size={14} /> projects.workspace
          </span>
          <span className="live-dot">Interactive demo</span>
        </div>
        <div className="workspace-title">
          <div>
            <span>Workspace / Projects</span>
            <h3>Your next big thing.</h3>
          </div>
          <div className="avatars">
            <b>OC</b>
            <b>AM</b>
            <b>SP</b>
            <b>+3</b>
          </div>
        </div>
        <Demo small config={{ ...defaults, dark }} />
      </motion.div>
      <motion.div
        className="floating-chip chip-filter"
        drag={!reduced}
        dragConstraints={{ left: -60, right: 60, top: -40, bottom: 40 }}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 200, bounceDamping: 14 }}
        whileDrag={{ scale: 1.05 }}
      >
        <SlidersHorizontal size={16} /> Your data. Your rules.
        <MousePointer2 size={12} />
      </motion.div>
      <div className="floating-chip chip-code">
        <span>{"<DataTable />"}</span>
        <Check size={15} />
        <small>Ready to ship</small>
      </div>
    </div>
  )
}

function SignalField({ animated }: { animated: boolean }) {
  const prefersReduced = useReducedMotion()
  const reduced = prefersReduced || !animated
  return (
    <div className="signal-field" aria-hidden="true">
      <svg viewBox="0 0 800 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="signal" x1="0" x2="1">
            <stop stopColor="#80aaff" stopOpacity="0" />
            <stop offset=".5" stopColor="#8cb8ff" />
            <stop offset="1" stopColor="#76e7cd" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 9 }, (_, i) => (
          <motion.path
            key={i}
            d={`M 0 ${190 + i * 7} C 140 ${210 - i * 9} 190 ${10 + i * 12} 340 ${120 + i * 9} S 540 ${290 - i * 12} 800 ${40 + i * 17}`}
            fill="none"
            stroke="url(#signal)"
            strokeWidth={i === 4 ? 2 : 1}
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: i === 4 ? 0.95 : 0.35,
              d: reduced
                ? `M 0 ${190 + i * 7} C 140 ${210 - i * 9} 190 ${10 + i * 12} 340 ${120 + i * 9} S 540 ${290 - i * 12} 800 ${40 + i * 17}`
                : [
                    `M 0 ${190 + i * 7} C 140 ${210 - i * 9} 190 ${10 + i * 12} 340 ${120 + i * 9} S 540 ${290 - i * 12} 800 ${40 + i * 17}`,
                    `M 0 ${80 + i * 8} C 140 ${30 + i * 9} 190 ${280 - i * 12} 340 ${190 - i * 9} S 540 ${10 + i * 12} 800 ${180 - i * 10}`,
                    `M 0 ${190 + i * 7} C 140 ${210 - i * 9} 190 ${10 + i * 12} 340 ${120 + i * 9} S 540 ${290 - i * 12} 800 ${40 + i * 17}`,
                  ],
            }}
            transition={{
              pathLength: { duration: reduced ? 0 : 1.5, delay: i * 0.055 },
              opacity: { duration: reduced ? 0 : 1.5 },
              d: {
                duration: reduced ? 0 : 10,
                repeat: reduced ? 0 : Infinity,
                ease: "easeInOut",
              },
            }}
          />
        ))}
      </svg>
      <div className="signal-caption">
        <Activity size={13} /> Built for the way data moves.
      </div>
    </div>
  )
}

function Home({
  go,
  dark,
  animated,
}: {
  go: (path: string) => void
  dark: boolean
  animated: boolean
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="release">
            <span /> One stack. More possibilities.
            <span className="release-version">v0.5.1</span>
          </div>
          <h1>Dynostack.</h1>
          <p>
            A growing toolkit for modern interfaces.
            <br className="desktop" /> Start with Grid. More tools will join the
            stack.
          </p>
          <div className="hero-actions">
            <a
              className="primary-button"
              href="/playground"
              onClick={(e) => {
                e.preventDefault()
                go("/playground")
              }}
            >
              Explore Grid <ArrowUpRight size={17} />
            </a>
            <a
              className="secondary-button"
              href="/docs"
              onClick={(e) => {
                e.preventDefault()
                go("/docs")
              }}
            >
              <BookOpen size={17} /> Get started
            </a>
          </div>
          <div className="install-command">
            <span>$</span>
            <code>npm i @dynostack/react-grid</code>
            <CopyButton text="npm i @dynostack/react-grid" label="" />
          </div>
        </div>
        <SignalField animated={animated} />
        <HeroTable dark={dark} animated={animated} />
      </section>
      <section className="products-section" id="products">
        <div className="section-intro">
          <h2>Your next building block.</h2>
          <p>
            One shared design language.
            <br />A platform with room to grow.
          </p>
        </div>
        <div className="product-family">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-heading">
                <BrandMark grid size={46} />
                <span className="product-status">Available now</span>
              </div>
              <h3>
                <span>Dynostack</span> {product.name}
              </h3>
              <p>{product.description}</p>
              <a
                className="secondary-button"
                href={product.href}
                onClick={(e) => {
                  e.preventDefault()
                  go(product.href)
                }}
              >
                Open playground <ArrowUpRight size={15} />
              </a>
            </article>
          ))}
          <article className="product-card next-product">
            <BrandMark size={46} />
            <h3>More in the stack.</h3>
            <p>
              Grid is our first product. This is where future Dynostack tools
              will join the family.
            </p>
            <span className="future-note">Space for what comes next</span>
          </article>
        </div>
      </section>
      <section className="foundation">
        <span>Fits right into your stack</span>
        <div>
          <b>React</b>
          <b>TanStack Table</b>
          <b>Radix UI</b>
          <b>Tailwind CSS</b>
          <b>TypeScript</b>
        </div>
      </section>
      <section className="features-section">
        <div className="section-intro">
          <h2>
            The hard parts,
            <br />
            already handled.
          </h2>
          <p>
            From the first row to the last detail.
            <br />
            One component. A lot of possibilities.
          </p>
        </div>
        <div className="feature-grid">
          {[
            [
              SlidersHorizontal,
              "Find the signal.",
              "Search across your data. Combine precise text, number, date, and set filters.",
            ],
            [
              MousePointer2,
              "Work directly in the table.",
              "Edit cells, add projects, select rows, and run bulk actions without losing your place.",
            ],
            [
              Layers,
              "A layout that moves with you.",
              "Resize, reorder, hide, and pin columns. Pick the density and palette that fit your app.",
            ],
            [
              Download,
              "Take your data with you.",
              "Export visible columns and selected or filtered rows to CSV or an Excel-compatible spreadsheet.",
            ],
          ].map(([Icon, title, desc]) => {
            const I = Icon as typeof Layers
            return (
              <article key={String(title)}>
                <I size={23} />
                <h3>{String(title)}</h3>
                <p>{String(desc)}</p>
              </article>
            )
          })}
        </div>
      </section>
      <section className="gallery-section">
        <div className="section-intro">
          <h2>
            Small details.
            <br />
            Big difference.
          </h2>
          <p>
            Real screenshots from the grid.
            <br />
            Try every interaction in the playground.
          </p>
        </div>
        <div className="gallery">
          <figure>
            <img
              loading="lazy"
              src="/table-images/grid-dark.png"
              alt="Graphite dark table playground with precise controls"
            />
            <figcaption>Graphite. Every detail, in focus.</figcaption>
          </figure>
          <figure>
            <img
              loading="lazy"
              src="/table-images/grid-light.png"
              alt="Light table playground with project data and configuration"
            />
            <figcaption>
              Light. The same precision, a different mood.
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="bottom-cta">
        <Grid2X2 size={36} />
        <h2>Give your data a better home.</h2>
        <p>Start with the defaults. Customize every detail.</p>
        <a
          href="/playground"
          className="primary-button"
          onClick={(e) => {
            e.preventDefault()
            go("/playground")
          }}
        >
          Make it yours <ArrowRight size={16} />
        </a>
      </section>
    </>
  )
}

function configCode(c: Config) {
  return `import { DataTable, ${c.custom ? "buildPreset" : "themePresets"} } from '@dynostack/react-grid'\n\n// Define rows and columns as shown in the Quick start docs.\nconst preset = ${c.custom ? `buildPreset(${c.hue})` : `themePresets.${c.theme}`}\n\n<DataTable\n  data={rows}\n  columns={columns}\n  isLoading={${c.loading}}\n  theme={preset}\n  className="${c.dark ? "dark" : "light"}"\n  density="${c.density}"\n  isolate={${c.isolate}}\n  enableSelection={${c.selection}}\n  striped={${c.striped}}\n  stickyHeader={${c.sticky}}\n  maxHeight="520px"\n  ariaLabel="Project workspace"\n  initialPageSize={${c.size}}\n  pageSizeOptions={[5, 10, 20, 50, 100]}\n  features={${JSON.stringify(c.features, null, 2).replace(/\n/g, "\n  ")}}\n  rowActions={${JSON.stringify(c.actions ? (c.editing ? ["view", "edit", "duplicate", "delete"] : ["view", "duplicate", "delete"]) : [])}}${c.translated ? '\n  labels={{ search: "Rechercher…", addRow: "Ajouter", columns: "Colonnes", export: "Exporter", total: "Total", noResults: "Aucun résultat." }}' : ""}${c.expansion ? "\n  renderSubRow={(row) => <p>{row.name}</p>}" : ""}\n  onSelectionChange={setSelectedRows}${c.editing ? "\n  onCellEdit={(row, key, value) => setRows(previous => previous.map(item => item.id === row.id ? { ...item, [key]: value } : item))}\n  onRowSave={(row, draft) => setRows(previous => previous.some(item => item.id === row.id) ? previous.map(item => item.id === row.id ? { ...item, ...draft } : item) : [...previous, { ...row, ...draft }])}" : ""}\n  onDelete={(row) => setRows(previous => previous.filter(item => item.id !== row.id))}\n  onBulkDelete={(selected) => setRows(previous => previous.filter(item => !selected.some(row => row.id === item.id)))}\n  onRowAction={(action, row) => {\n    if (action === 'duplicate') setRows(previous => [...previous, { ...row, id: crypto.randomUUID() }])\n  }}${c.features.addRow ? '\n  onAddRow={() => ({ id: crypto.randomUUID(), name: "New project" })}' : ""}${c.features.refresh ? "\n  onRefresh={reloadRows}" : ""}\n/>\n\n// Editing is configured per column:\n// meta: { editor: 'text', isEditable: ${c.editing} }`
}
function Playground({ dark }: { dark: boolean }) {
  useEffect(() => {
    setC((p) => ({ ...p, dark }))
  }, [dark])
  const [c, setC] = useState<Config>({ ...defaults, dark })
  const [reset, setReset] = useState(0)
  const [selected, setSelected] = useState<Project[]>([])
  const [tab, setTab] = useState("preview")
  const [notice, setNotice] = useState("")
  useEffect(() => {
    const value = new URLSearchParams(location.search).get("config")
    if (!value) return
    try {
      const parsed = JSON.parse(value)
      const next = { ...defaults }
      for (const key of [
        "selection",
        "editing",
        "loading",
        "actions",
        "expansion",
        "striped",
        "sticky",
        "dark",
        "custom",
        "isolate",
        "translated",
      ] as const)
        if (typeof parsed[key] === "boolean") next[key] = parsed[key]
      if (["compact", "default", "comfortable"].includes(parsed.density))
        next.density = parsed.density
      if (Object.hasOwn(themePresets, parsed.theme)) next.theme = parsed.theme
      if ([48, 250, 1000].includes(parsed.count)) next.count = parsed.count
      if ([5, 10, 20, 50, 100].includes(parsed.size)) next.size = parsed.size
      if (Number.isFinite(parsed.hue))
        next.hue = Math.max(0, Math.min(360, parsed.hue))
      for (const key of Object.keys(
        defaultFeatures
      ) as (keyof DataTableFeatures)[])
        if (typeof parsed.features?.[key] === "boolean")
          next.features = { ...next.features, [key]: parsed.features[key] }
      setC(next)
    } catch {
      setNotice("The shared configuration was invalid. Defaults are loaded.")
    }
  }, [])
  const update = <K extends keyof Config>(key: K, value: Config[K]) =>
    setC((p) => ({ ...p, [key]: value }))
  const code = configCode(c)
  return (
    <main className="playground-page">
      <div className="page-heading">
        <div>
          <span className="breadcrumb">React Grid / Playground</span>
          <h1>Make it your own.</h1>
          <p>Flip a switch. Change a color. See it happen.</p>
        </div>
        <div className="heading-actions">
          <button
            className="secondary-button"
            onClick={() => {
              setC({ ...defaults, dark })
              setReset((p) => p + 1)
              setSelected([])
            }}
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            className="primary-button"
            onClick={async () => {
              try {
                const url = new URL("/playground", location.origin)
                url.searchParams.set("config", JSON.stringify(c))
                await navigator.clipboard.writeText(url.toString())
                setNotice("Configuration link copied")
              } catch {
                setNotice(
                  "Could not copy the link. Use Copy configuration below."
                )
              }
            }}
          >
            Share setup <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <div className="playground-layout">
        <aside className="config-panel">
          <div className="panel-title">
            <SlidersHorizontal size={16} />
            <strong>Configuration</strong>
          </div>
          <section>
            <h3>Appearance</h3>
            <label className="field">
              Color theme
              <select
                value={c.theme}
                onChange={(e) => {
                  update("theme", e.target.value as DataTableThemeName)
                  update("custom", false)
                }}
              >
                {Object.keys(themePresets).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <div className="swatches">
              {[
                ["graphite", "#454b54"],
                ["sky", "#315bea"],
                ["violet", "#8752df"],
                ["emerald", "#169d72"],
                ["amber", "#d89014"],
                ["rose", "#d95572"],
                ["slate", "#667388"],
              ].map(([key, color]) => (
                <button
                  key={key}
                  aria-label={`${key} theme`}
                  aria-pressed={c.theme === key && !c.custom}
                  style={{ background: color }}
                  onClick={() => {
                    update("theme", key as DataTableThemeName)
                    update("custom", false)
                  }}
                >
                  {c.theme === key && !c.custom && <Check size={13} />}
                </button>
              ))}
            </div>
            <Switch
              label="Dark table"
              value={c.dark}
              onChange={() => update("dark", !c.dark)}
            />
            <Switch
              label="Isolate theme"
              value={c.isolate}
              onChange={() => update("isolate", !c.isolate)}
            />
            <Switch
              label="Custom hue"
              value={c.custom}
              onChange={() => update("custom", !c.custom)}
            />
            {c.custom && (
              <label className="field">
                Hue: {c.hue}°
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={c.hue}
                  onChange={(e) => update("hue", Number(e.target.value))}
                />
              </label>
            )}
            <label className="field">
              Row density
              <select
                value={c.density}
                onChange={(e) =>
                  update("density", e.target.value as DataTableDensity)
                }
              >
                <option value="compact">Compact</option>
                <option value="default">Default</option>
                <option value="comfortable">Comfortable</option>
              </select>
            </label>
            <Switch
              label="Striped rows"
              value={c.striped}
              onChange={() => update("striped", !c.striped)}
            />
            <Switch
              label="Sticky header"
              value={c.sticky}
              onChange={() => update("sticky", !c.sticky)}
            />
          </section>
          <section>
            <h3>Table features</h3>
            {Object.entries(featureNames).map(([key, label]) => (
              <Switch
                key={key}
                label={label}
                value={c.features[key as keyof DataTableFeatures]}
                onChange={() =>
                  update("features", {
                    ...c.features,
                    [key]: !c.features[key as keyof DataTableFeatures],
                  })
                }
              />
            ))}
          </section>
          <section>
            <h3>Rows & interactions</h3>
            {(
              [
                ["selection", "Row selection"],
                ["editing", "Inline editing"],
                ["loading", "Loading state"],
                ["actions", "Row action menu"],
                ["expansion", "Expandable details"],
                ["translated", "French toolbar labels"],
              ] as const
            ).map(([key, label]) => (
              <Switch
                key={key}
                label={label}
                value={c[key]}
                onChange={() => update(key, !c[key])}
              />
            ))}
            <label className="field">
              Sample rows
              <select
                value={c.count}
                onChange={(e) => update("count", Number(e.target.value))}
              >
                {[48, 250, 1000].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Initial page size
              <select
                value={c.size}
                onChange={(e) => update("size", Number(e.target.value))}
              >
                {[5, 10, 20, 50, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </section>
        </aside>
        <section className="preview-panel">
          <div className="preview-toolbar">
            <div className="tabs">
              <button
                aria-pressed={tab === "preview"}
                onClick={() => setTab("preview")}
              >
                <Grid2X2 size={15} /> Live preview
              </button>
              <button
                aria-pressed={tab === "code"}
                onClick={() => setTab("code")}
              >
                <Command size={15} /> Code
              </button>
            </div>
            <span className="preview-status">
              <i />
              {selected.length
                ? `${selected.length} selected`
                : "Changes apply instantly"}
            </span>
          </div>
          <div className="preview-content" hidden={tab !== "preview"}>
            <div className="preview-intro">
              <div>
                <h2>Project workspace</h2>
                <p>Sample data. All changes stay in this browser session.</p>
              </div>
              <span className="preview-badge">
                <Sparkles size={14} /> Your configuration
              </span>
            </div>
            <Demo config={c} resetKey={reset} onSelection={setSelected} />
            <div className="preview-hint">
              <MousePointer2 size={15} />
              <span>
                Double-click a cell to edit. Use the header menus to sort,
                filter, and pin. Drag the column grips to reorder.
              </span>
            </div>
          </div>
          {tab === "code" && (
            <div className="code-preview">
              <h2>Your React configuration</h2>
              <p>
                Connect the callbacks to your app state. See the docs for a
                complete example.
              </p>
              <Code text={code} />
            </div>
          )}
          <div className="config-summary">
            <span>{c.density} density</span>
            <span>{c.custom ? `${c.hue}° hue` : c.theme} theme</span>
            <span>
              {Object.values(c.features).filter(Boolean).length} features
              enabled
            </span>
          </div>
          <div className="config-export">
            <strong>Ready for your app?</strong>
            <CopyButton text={code} label="Copy configuration" />
          </div>
        </section>
      </div>
    </main>
  )
}

const quickStart = `import { useState } from 'react'\nimport { DataTable, type DataTableColumn } from '@dynostack/react-grid'\n\ntype Project = { id: string; name: string; budget: number }\nconst columns: DataTableColumn<Project>[] = [\n  { accessorKey: 'name', header: 'Project',\n    meta: { editor: 'text', isEditable: true } },\n  { accessorKey: 'budget', header: 'Budget',\n    meta: { editor: 'currency', filterType: 'number' } },\n]\n\nexport default function Projects() {\n  const [rows, setRows] = useState<Project[]>([\n    { id: '1', name: 'Website redesign', budget: 12000 },\n  ])\n  return <DataTable data={rows} columns={columns}\n    rowActions={['view', 'edit', 'delete']}\n    onCellEdit={(row, key, value) => setRows(previous =>\n      previous.map(item => item.id === row.id\n        ? { ...item, [key]: value } : item))}\n    onRowSave={(row, draft) => setRows(previous =>\n      previous.some(item => item.id === row.id)\n        ? previous.map(item => item.id === row.id ? { ...item, ...draft } : item)\n        : [...previous, { ...row, ...draft }])}\n    onDelete={(row) => setRows(previous => previous.filter(item => item.id !== row.id))}\n    onAddRow={() => ({ id: crypto.randomUUID(), name: '', budget: 0 })}\n  />\n}`
const docsSections = [
  "Installation",
  "Quick start",
  "Columns & editing",
  "Features",
  "Themes & layout",
  "Selection & expansion",
  "Data fetching",
  "Export & security",
  "API reference",
  "Downloads",
]
function Docs() {
  const [active, setActive] = useState("Installation")
  useEffect(() => {
    const sections = docsSections.map((_, i) =>
      document.getElementById(`doc-${i}`)
    )
    let frame = 0
    const updateActive = () => {
      frame = 0
      const readingLine = Math.min(160, window.innerHeight * 0.4)
      let index = 0
      sections.forEach((section, i) => {
        const heading = section?.querySelector("h2")
        if (heading && heading.getBoundingClientRect().top <= readingLine)
          index = i
      })
      // The last heading may never reach the reading line on a tall screen.
      if (
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2
      )
        index = docsSections.length - 1
      setActive(docsSections[index])
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(updateActive)
    }
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    window.addEventListener("hashchange", schedule)
    const observer = new ResizeObserver(schedule)
    const content = document.querySelector(".docs-content")
    if (content) observer.observe(content)
    // The browser may resolve the hash before React renders the sections.
    const initialAnchor = sections.find(
      (section) => section && `#${section.id}` === location.hash
    )
    initialAnchor?.scrollIntoView({ behavior: "instant", block: "start" })
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("hashchange", schedule)
      observer.disconnect()
    }
  }, [])
  return (
    <main className="docs-layout">
      <aside className="docs-nav">
        <span className="breadcrumb">Documentation</span>
        <h3>Build with Grid</h3>
        {docsSections.map((s, i) => (
          <a
            className={active === s ? "active" : ""}
            key={s}
            href={`#doc-${i}`}
            aria-current={active === s ? "location" : undefined}
          >
            {s}
          </a>
        ))}
        <a href={`${repo}#readme`} target="_blank" rel="noreferrer">
          Full package README <ArrowUpRight size={13} />
        </a>
      </aside>
      <article className="docs-content">
        <span className="breadcrumb">React Grid / Documentation</span>
        <h1>
          A great table,
          <br />
          in a few lines.
        </h1>
        <p className="docs-lead">
          Install the package, bring your data, and make it yours. React 18.2 or
          later, with TypeScript support built in.
        </p>
        <section id="doc-0">
          <h2>Installation</h2>
          <p>
            Add the package and Tailwind CSS v4 to your React app. React and
            React DOM are peer dependencies; other runtime dependencies install
            automatically.
          </p>
          <Code text="npm install @dynostack/react-grid\nnpm install -D tailwindcss @tailwindcss/vite" />
          <p>In your Vite configuration, register the Tailwind plugin:</p>
          <Code
            text={`import { defineConfig } from 'vite'\nimport tailwindcss from '@tailwindcss/vite'\nexport default defineConfig({ plugins: [tailwindcss()] })`}
          />
          <p>
            Import the grid styles and scan its distributed JavaScript from your
            global stylesheet. Adjust the relative source path for your CSS
            file.
          </p>
          <Code
            text={
              '@import "tailwindcss";\n@source "../node_modules/@dynostack/react-grid/dist";\n@import "@dynostack/react-grid/styles.css";'
            }
          />
          <p>
            Using Tailwind v3? See the{" "}
            <a href={`${repo}#tailwind-v3`}>v3 setup in the README</a>. Next.js
            components that render the grid should use <code>"use client"</code>
            .
          </p>
        </section>
        <section id="doc-1">
          <h2>Quick start</h2>
          <p>
            Every row needs a unique, stable <code>id</code>. Keep your column
            definitions stable. Your callbacks own persistence; editing a cell
            does not send a request by itself.
          </p>
          <Code text={quickStart} />
        </section>
        <section id="doc-2">
          <h2>Columns & editing</h2>
          <p>
            Use TanStack column definitions with <code>meta</code> to configure
            labels, editors, filters, alignment, and export visibility.
          </p>
          <Code
            text={`{ accessorKey: 'status', header: 'Status',\n  meta: {\n    label: 'Status', editor: 'select', filterType: 'multi-select',\n    selectOptions: [{ value: 'Done', label: 'Done' }],\n    badgeMap: { Done: 'success' },\n    isEditable: (row) => row.status !== 'Archived',\n    exportable: true, align: 'left',\n  }\n}`}
          />
          <p>
            Editors: text, number, currency, date, select, switch, checkbox.
            Filters: text, number, date, select, multi-select, boolean. Use{" "}
            <code>onCellEdit</code> for single edits and <code>onRowSave</code>{" "}
            for row drafts. Read-only flags apply to row edit mode too. Validate
            permissions and values again on your server.
          </p>
        </section>
        <section id="doc-3">
          <h2>Features</h2>
          <p>
            All capabilities are opt-in configurable. Set any flag below to
            false. Refresh and add-row buttons also require their callbacks.
          </p>
          <Code
            text={`<DataTable data={rows} columns={columns}\n  features={{ search: true, refresh: true, columnVisibility: true,\n    export: true, addRow: true, pagination: true, sorting: true,\n    filtering: true, resizing: true, reordering: true, pinning: true }}\n  onRefresh={reloadRows}\n  onAddRow={() => ({ id: crypto.randomUUID() })}\n/>`}
          />
          <p>
            Pagination off displays all matching loaded rows. In server mode,
            only fetched rows are available. Use <code>labels</code> to
            translate toolbar and empty-state text; see the README for the
            supported label keys.
          </p>
        </section>
        <section id="doc-4">
          <h2>Themes & layout</h2>
          <Code
            text={`import { themePresets, buildPreset } from '@dynostack/react-grid'\n\n<DataTable data={rows} columns={columns}\n  theme={themePresets.graphite} isolate\n  density="comfortable" striped stickyHeader maxHeight="480px"\n  initialSorting={[{ id: 'name', desc: false }]}\n  initialColumnPinning={{ left: ['name'], right: [] }}\n  initialColumnVisibility={{ budget: false }}\n  ariaLabel="Project workspace"\n/>\n// Custom color: theme={buildPreset(180)}`}
          />
          <p>
            Presets: graphite, neutral, light, dark, violet, emerald, amber,
            rose, sky, slate. Moded themes follow the OS or a <code>.dark</code>{" "}
            ancestor. For a forced light or dark grid, pass{" "}
            <code>{"theme={{ light: preset.light }}"}</code> or{" "}
            <code>{"theme={{ light: preset.dark }}"}</code>. Density supports
            compact, default, and comfortable.
          </p>
        </section>
        <section id="doc-5">
          <h2>Selection & expansion</h2>
          <Code
            text={`<DataTable data={rows} columns={columns}\n  enableSelection\n  onSelectionChange={setSelectedRows}\n  onBulkDelete={(selected) => deleteProjects(selected.map(row => row.id))}\n  renderSubRow={(row) => <ProjectDetails project={row} />}\n  rowActions={['view', 'edit', 'duplicate', 'delete']}\n  onRowAction={(action, row) => {\n    if (action === 'duplicate') duplicateProject(row)\n  }}\n/>`}
          />
          <p>
            Deletion asks for confirmation by default. View opens a details
            sheet; use <code>viewSheet</code> to customize it. Use{" "}
            <code>getSubRows</code> for nested rows. In server mode, selection
            callbacks and exports contain loaded rows only.
          </p>
        </section>
        <section id="doc-6">
          <h2>Data fetching</h2>
          <p>
            Pass controlled data or a stable <code>dataSource</code>. Client
            mode fetches all rows, then sorts and filters locally. Server mode
            passes the current query to your API.
          </p>
          <Code
            text={`const dataSource = useMemo(() => ({\n  mode: 'server' as const,\n  fetchRows: async ({ pageIndex, pageSize, sorting, columnFilters, globalFilter }) => {\n    const response = await fetch('/api/projects/query', {\n      method: 'POST', headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ pageIndex, pageSize, sorting, columnFilters, globalFilter }),\n    })\n    if (!response.ok) throw new Error('Could not load projects')\n    return response.json() // { rows: Project[], totalRecords: number }\n  },\n}), [])\n<DataTable columns={columns} dataSource={dataSource} />`}
          />
          <p>
            The API must validate page sizes, allowlist sortable and filterable
            columns, and enforce authorization. Avoid putting user-provided
            column identifiers into raw SQL.
          </p>
        </section>
        <section id="doc-7">
          <h2>Export & security</h2>
          <p>
            Exports include visible, exportable columns and selected rows, or
            all filtered loaded rows if nothing is selected. CSV escaping
            protects quotes and line breaks; spreadsheet formula prefixes in
            text are neutralized. Real numeric values stay numeric. Excel export
            is HTML-based <code>.xls</code>, not native XLSX; Excel may show a
            format warning.
          </p>
          <p>
            Set <code>meta.exportable = false</code> for fields that should not
            download. Hidden fields remain in JavaScript, so keep secrets and
            unauthorized records out of the browser entirely. React escapes row
            text. Theme tokens accept CSS values and reject declaration
            breakouts or URL expressions.
          </p>
        </section>
        <section id="doc-8">
          <h2>API reference</h2>
          <div className="api-table">
            <table>
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["data / columns", "Rows and TanStack column definitions"],
                  ["dataSource", "Internal client or server fetcher"],
                  [
                    "features / labels",
                    "Feature switches and supported text overrides",
                  ],
                  ["theme / isolate / density", "Per-instance appearance"],
                  ["onCellEdit / onRowSave", "Persist edits"],
                  [
                    "onAddRow / onDelete / onBulkDelete",
                    "Create and remove records",
                  ],
                  [
                    "rowActions / customRowActions",
                    "Built-in and custom row menus",
                  ],
                  ["initialSorting", "Starting sort order"],
                  ["onSelectionChange", "Selected loaded row objects"],
                  [
                    "striped / stickyHeader / maxHeight",
                    "Row styling and scroll viewport",
                  ],
                  ["ariaLabel", "Accessible table name"],
                ].map(([prop, purpose]) => (
                  <tr key={prop}>
                    <td>
                      <code>{prop}</code>
                    </td>
                    <td>{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            See the{" "}
            <a href={`${repo}#api-reference`}>complete typed API reference</a>{" "}
            for view sheets, delete confirmation, pagination, filters, and
            exported helpers.
          </p>
        </section>
        <section id="doc-9">
          <h2>Downloads</h2>
          <p>
            Install the published package from npm or download a minimal example
            and playground configuration.
          </p>
          <div className="download-links">
            <a
              className="secondary-button"
              href="https://www.npmjs.com/package/@dynostack/react-grid"
            >
              <Package size={16} /> View on npm
            </a>
            <button
              className="secondary-button"
              onClick={() => {
                const blob = new Blob([quickStart], { type: "text/plain" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "Projects.tsx"
                a.click()
                setTimeout(() => URL.revokeObjectURL(url), 1000)
              }}
            >
              <Download size={16} /> Download example
            </button>
            <a className="secondary-button" href={repo}>
              <Github size={16} /> Source code
            </a>
          </div>
          <div className="notice">
            The playground runs the source package in this repository. Install
            the latest npm version to use the same layout controls and export
            protections.
          </div>
        </section>
      </article>
      <aside className="on-this-page">
        <span>On this page</span>
        {docsSections.map((s, i) => (
          <a
            key={s}
            href={`#doc-${i}`}
            className={active === s ? "active" : ""}
            aria-current={active === s ? "location" : undefined}
          >
            {s}
          </a>
        ))}
      </aside>
    </main>
  )
}

export default function App() {
  const reduced = useReducedMotion()
  const [animated, setAnimated] = useState(true)
  const [route, setRoute] = useState(getRoute)
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("dynostack-mode") !== "light"
    } catch {
      return true
    }
  })
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.classList.toggle("light", !dark)
    document.documentElement.dataset.mode = dark ? "dark" : "light"
    try {
      localStorage.setItem("dynostack-mode", dark ? "dark" : "light")
    } catch {
      /* Storage can be disabled. */
    }
  }, [dark])
  useEffect(() => {
    const handle = () => setRoute(getRoute())
    window.addEventListener("popstate", handle)
    return () => window.removeEventListener("popstate", handle)
  }, [])
  function go(path: string) {
    history.pushState({}, "", path)
    setRoute(getRoute())
    window.scrollTo({ top: 0, behavior: "instant" })
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault()
            go("/")
          }}
        >
          <span className="brand-icon">
            <BrandMark size={32} />
          </span>
          dynostack
          {route !== "home" && (
            <>
              <span className="brand-divider" />{" "}
              <span className="brand-product">
                <BrandMark grid size={18} />
                Grid
              </span>
            </>
          )}
        </a>
        <nav aria-label="Main navigation">
          {[
            ["/", "Products", "home"],
            ["/playground", "Playground", "playground"],
            ["/docs", "Documentation", "docs"],
          ].map(([url, title, key]) => (
            <a
              key={key}
              className={route === key ? "active" : ""}
              aria-current={route === key ? "page" : undefined}
              href={url}
              onClick={(e) => {
                e.preventDefault()
                go(url)
              }}
            >
              {title}
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <button
            className="mode-toggle"
            aria-label={animated ? "Pause animations" : "Enable animations"}
            onClick={() => setAnimated(!animated)}
          >
            {animated ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            className="mode-toggle"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a
            className="github-link"
            href={repo}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={17} />
            <span>GitHub</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
      </header>
      <motion.div
        id="main"
        key={route}
        initial={reduced || !animated ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {route === "home" ? (
          <Home go={go} dark={dark} animated={animated} />
        ) : route === "playground" ? (
          <Playground dark={dark} />
        ) : (
          <Docs />
        )}
      </motion.div>
      <footer className="site-footer">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault()
            go("/")
          }}
        >
          <BrandMark size={24} /> dynostack
        </a>
        <span>Built for builders. Apache 2.0 licensed.</span>
        <a href="https://www.npmjs.com/package/@dynostack/react-grid">
          npm <ArrowUpRight size={13} />
        </a>
        <a href={repo}>
          GitHub <ArrowUpRight size={13} />
        </a>
        <a href="/brand.html">
          Brand kit <ArrowUpRight size={13} />
        </a>
      </footer>
    </>
  )
}
