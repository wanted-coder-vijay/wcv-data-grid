import { useId, useState, useRef, useEffect } from 'react'
import type { ChartConfig, ChartKind, SaveProps } from './types'
import { chartCsv, validateChart, chartPath } from './core'
import { Empty, JsonExport, Notice, downloadText } from './shared'
export interface ChartViewProps {
  value: ChartConfig
  hidden?: string[]
  onPointSelect?: (index: number) => void
  onRangeSelect?: (from: number, to: number) => void
  compact?: boolean
  sparkline?: boolean
}
export function ChartView({
  value,
  hidden = [],
  onPointSelect,
  onRangeSelect,
  compact = false,
  sparkline = false,
}: ChartViewProps) {
  const id = useId().replace(/[^a-z0-9]/gi, ''),
    [active, setActive] = useState<number | null>(null),
    [brush, setBrush] = useState<number | null>(null),
    start = useRef<number | null>(null)
  useEffect(() => {
    setActive(null)
    start.current = null
    setBrush(null)
  }, [value.points])
  const visible = value.series.filter((s) => !hidden.includes(s.key)),
    problems = validateChart(value)
  if (problems.length) return <Notice error>{problems.join(' ')}</Notice>
  if (!value.points.length || !visible.length)
    return (
      <Empty>
        {!value.points.length
          ? 'No data in this range.'
          : 'Enable a series to display the chart.'}
      </Empty>
    )
  const width = 900,
    height = sparkline ? 170 : compact ? 250 : 390,
    left = sparkline ? 0 : 60,
    right = sparkline ? 0 : 25,
    top = 20,
    bottom = sparkline ? 0 : 42,
    plotW = width - left - right,
    plotH = height - top - bottom
  const numbers = value.points.flatMap((p) =>
      visible.map((s) => Number(p[s.key]))
    ),
    minimum = Math.min(0, ...numbers),
    maximum = Math.max(0, ...numbers) || (minimum === 0 ? 1 : 0),
    span = maximum - minimum || 1
  const y = (n: number) => top + ((maximum - n) / span) * plotH,
    x = (i: number) =>
      value.kind === 'bar'
        ? left + ((i + 0.5) * plotW) / value.points.length
        : left +
          (value.points.length === 1 ? 0.5 : i / (value.points.length - 1)) *
            plotW
  const nearest = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect(),
      px = ((event.clientX - bounds.left) / bounds.width) * width
    return Math.max(
      0,
      Math.min(
        value.points.length - 1,
        value.kind === 'bar'
          ? Math.floor(((px - left) / plotW) * value.points.length)
          : Math.round(((px - left) / plotW) * (value.points.length - 1))
      )
    )
  }
  const point = active === null ? undefined : value.points[active],
    format = (n: number) =>
      new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n)
  return (
    <div className="ds-chart-view">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={id + 'title'}
        onPointerMove={(e) => {
          const index = nearest(e)
          setActive(index)
          if (start.current !== null) setBrush(index)
        }}
        onPointerLeave={() => {
          if (start.current === null) setActive(null)
        }}
        onPointerDown={(e) => {
          if (!onRangeSelect) return
          start.current = nearest(e)
          setBrush(start.current)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerUp={(e) => {
          if (start.current !== null) {
            const end = nearest(e)
            if (start.current !== end)
              onRangeSelect?.(
                Math.min(start.current, end),
                Math.max(start.current, end)
              )
            else onPointSelect?.(end)
          }
          start.current = null
          setBrush(null)
        }}
        onPointerCancel={() => {
          start.current = null
          setBrush(null)
        }}
      >
        <title id={id + 'title'}>
          {value.title}. {value.points.length} data points. Use period buttons
          to inspect values.
        </title>
        <defs>
          {visible.map((s, i) => (
            <linearGradient
              key={s.key}
              id={id + 'g' + i}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity=".3" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {!sparkline &&
          Array.from({ length: 5 }, (_, i) => maximum - (i / 4) * span).map(
            (tick, i) => (
              <g key={i}>
                <line
                  className="ds-chart-grid"
                  x1={left}
                  x2={width - right}
                  y1={y(tick)}
                  y2={y(tick)}
                />
                <text x={left - 10} y={y(tick) + 4} textAnchor="end">
                  {format(tick)}
                </text>
              </g>
            )
          )}
        {visible.map((s, seriesIndex) => {
          const path = chartPath(
            value.points.map((p, i) => ({ x: x(i), y: y(Number(p[s.key])) })),
            value.curve
          )
          return (
            <g key={s.key}>
              {value.kind === 'bar' ? (
                value.points.map((p, i) => {
                  const bw =
                      ((plotW / value.points.length) * 0.72) / visible.length,
                    n = Number(p[s.key])
                  return (
                    <rect
                      key={i}
                      x={
                        x(i) -
                        (plotW / value.points.length) * 0.36 +
                        seriesIndex * bw
                      }
                      y={Math.min(y(0), y(n))}
                      width={Math.max(1, bw - 2)}
                      height={Math.max(1, Math.abs(y(n) - y(0)))}
                      rx="3"
                      fill={s.color}
                      onClick={() => onPointSelect?.(i)}
                    />
                  )
                })
              ) : (
                <>
                  {value.kind === 'area' && (
                    <path
                      d={`${path} L${x(value.points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`}
                      fill={`url(#${id + 'g' + seriesIndex})`}
                    />
                  )}
                  <path
                    key={path}
                    d={path}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    pathLength="1"
                    className={
                      value.animated === false ? undefined : 'ds-chart-draw'
                    }
                  />
                  {value.points.map(
                    (p, i) =>
                      (value.markers || active === i) && (
                        <circle
                          key={i}
                          cx={x(i)}
                          cy={y(Number(p[s.key]))}
                          r={active === i ? 5 : 3}
                          fill={s.color}
                          stroke="var(--ds-surface)"
                          strokeWidth="2"
                          onClick={() => onPointSelect?.(i)}
                        />
                      )
                  )}
                </>
              )}
            </g>
          )
        })}
        {!sparkline &&
          value.points.map(
            (p, i) =>
              i % Math.max(1, Math.ceil(value.points.length / 10)) === 0 && (
                <text key={i} x={x(i)} y={height - 14} textAnchor="middle">
                  {p.label.length > 12 ? p.label.slice(0, 10) + '...' : p.label}
                </text>
              )
          )}
        {active !== null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={top}
            y2={height - bottom}
            className="ds-chart-cursor"
          />
        )}
        {brush !== null && start.current !== null && (
          <rect
            x={Math.min(x(brush), x(start.current))}
            y={top}
            width={Math.abs(x(brush) - x(start.current))}
            height={plotH}
            fill="var(--ds-accent)"
            opacity=".12"
          />
        )}
      </svg>
      {point && (
        <div
          className="ds-chart-tooltip"
          style={{
            left: `${Math.min(72, Math.max(3, (x(active!) / width) * 100))}%`,
          }}
        >
          <strong>{point.label}</strong>
          {visible.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.label}
              <b>{Number(point[s.key]).toLocaleString()}</b>
            </span>
          ))}
        </div>
      )}
      {!sparkline && (
        <>
          <div className="ds-chart-readout" aria-live="polite">
            {point ? (
              <>
                <strong>{point.label}</strong>
                {visible.map((s) => (
                  <span key={s.key}>
                    <i style={{ background: s.color }} />
                    {s.label}: {Number(point[s.key]).toLocaleString()}
                  </span>
                ))}
              </>
            ) : (
              <span>
                Hover to inspect values. Drag across the chart to select a
                range.
              </span>
            )}
          </div>
          <div className="ds-chart-points" aria-label="Inspect chart data">
            {value.points.map((p, i) => (
              <button
                key={i}
                aria-pressed={active === i}
                onFocus={() => setActive(i)}
                onClick={() => {
                  setActive(i)
                  onPointSelect?.(i)
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
export interface ChartExplorerProps extends SaveProps<ChartConfig> {
  onDrillDown?: (point: ChartConfig['points'][number]) => void
}
export function ChartExplorer({
  value,
  onChange,
  onDrillDown,
}: ChartExplorerProps) {
  const [hidden, setHidden] = useState<string[]>([]),
    [range, setRange] = useState<[number, number]>([
      0,
      Math.max(0, value.points.length - 1),
    ]),
    [selected, setSelected] = useState<number | null>(null)
  const from = Math.min(range[0], Math.max(0, value.points.length - 1)),
    to = Math.max(
      from,
      Math.min(range[1], Math.max(0, value.points.length - 1))
    ),
    displayed = { ...value, points: value.points.slice(from, to + 1) },
    detail = selected === null ? undefined : value.points[selected]
  return (
    <section className="ds-tool ds-charts" aria-label="Chart explorer">
      <div className="ds-toolbar">
        <label className="ds-inline-label">
          Chart type
          <select
            aria-label="Chart type"
            value={value.kind}
            onChange={(e) =>
              onChange({ ...value, kind: e.target.value as ChartKind })
            }
          >
            {['line', 'bar', 'area'].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label className="ds-inline-label">
          Curve
          <select
            aria-label="Chart curve"
            value={value.curve ?? 'monotone'}
            onChange={(e) =>
              onChange({
                ...value,
                curve: e.target.value as ChartConfig['curve'],
              })
            }
          >
            <option value="monotone">Smooth</option>
            <option value="linear">Linear</option>
            <option value="step">Step</option>
          </select>
        </label>
        <label className="ds-inline-label">
          Chart title
          <input
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </label>
        <label className="ds-inline-label">
          Motion
          <input
            type="checkbox"
            aria-label="Animate chart"
            checked={value.animated !== false}
            onChange={(e) => onChange({ ...value, animated: e.target.checked })}
          />
        </label>
        <label className="ds-inline-label">
          Markers
          <input
            type="checkbox"
            aria-label="Show chart markers"
            checked={!!value.markers}
            onChange={(e) => onChange({ ...value, markers: e.target.checked })}
          />
        </label>
        <button
          disabled={!!validateChart(displayed).length}
          onClick={() =>
            downloadText(
              'chart-data.csv',
              chartCsv(displayed),
              'text/csv;charset=utf-8'
            )
          }
        >
          Export visible CSV
        </button>
        <JsonExport value={value} filename="chart" />
      </div>
      <div className="ds-chart-header">
        <div>
          <h2>{value.title}</h2>
          <p>
            Compare series, explore periods, and inspect the underlying values.
          </p>
        </div>
        <div className="ds-legend">
          {value.series.map((s) => (
            <button
              key={s.key}
              aria-pressed={!hidden.includes(s.key)}
              onClick={() =>
                setHidden(
                  hidden.includes(s.key)
                    ? hidden.filter((k) => k !== s.key)
                    : [...hidden, s.key]
                )
              }
            >
              <i style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <ChartView
        value={displayed}
        hidden={hidden}
        onRangeSelect={(a, b) => {
          setRange([from + a, from + b])
          setSelected(null)
        }}
        onPointSelect={(i) => {
          setSelected(i + from)
          onDrillDown?.(value.points[i + from])
        }}
      />
      {value.points.length > 1 && (
        <div className="ds-range">
          <label>
            From {value.points[from]?.label}
            <input
              aria-label="Chart range start"
              type="range"
              min={0}
              max={value.points.length - 1}
              value={from}
              onChange={(e) => {
                const n = Number(e.target.value)
                setRange([n, Math.max(n, to)])
              }}
            />
          </label>
          <label>
            Through {value.points[to]?.label}
            <input
              aria-label="Chart range end"
              type="range"
              min={from}
              max={value.points.length - 1}
              value={to}
              onChange={(e) => setRange([from, Number(e.target.value)])}
            />
          </label>
          <button onClick={() => setRange([0, value.points.length - 1])}>
            Reset range
          </button>
        </div>
      )}
      {detail && (
        <aside className="ds-point-detail">
          <h3>{detail.label}</h3>
          <dl>
            {value.series.map((s) => (
              <div key={s.key}>
                <dt>{s.label}</dt>
                <dd>{Number(detail[s.key]).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          <p>
            {onDrillDown
              ? 'Selection sent to your drill-down handler.'
              : 'Connect onDrillDown to open records for this period.'}
          </p>
        </aside>
      )}
    </section>
  )
}
export function MetricCard({
  title,
  metric,
  change,
  value,
}: {
  title: string
  metric: string
  change: number
  value: ChartConfig
}) {
  return (
    <article className="ds-tool ds-metric-card">
      <div className="ds-metric-top">
        <span>{title}</span>
        <span className={change < 0 ? 'ds-trend negative' : 'ds-trend'}>
          {change >= 0 ? '+' : '-'}
          {Math.abs(change)}%
        </span>
      </div>
      <strong className="ds-metric-number">{metric}</strong>
      <ChartView value={value} sparkline />
      <footer>Sample data / compared with previous period</footer>
    </article>
  )
}
