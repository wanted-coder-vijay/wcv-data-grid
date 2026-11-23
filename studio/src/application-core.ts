import type {
  ApplicationDiagram,
  ApplicationConnector,
  ApplicationNode,
} from './types'
export const applicationNodeKinds = [
  'client',
  'service',
  'database',
  'cache',
  'queue',
  'auth',
  'storage',
  'external',
] as const
export const connectorKinds = [
  'https',
  'query',
  'event',
  'auth',
  'storage',
] as const
export function parseApplicationDiagram(source: string): ApplicationDiagram {
  if (source.length > 500000)
    throw new Error('Diagram is too large (500 KB maximum).')
  const value = JSON.parse(source)
  if (
    !value ||
    value.version !== 1 ||
    typeof value.title !== 'string' ||
    value.title.length > 200 ||
    typeof value.description !== 'string' ||
    typeof value.notes !== 'string' ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.connectors) ||
    value.nodes.length > 100 ||
    value.connectors.length > 300
  )
    throw new Error(
      'Expected a version 1 diagram with a title, description, notes, up to 100 nodes and 300 connectors.'
    )
  const ids = new Set<string>(),
    edgeIds = new Set<string>()
  for (const node of value.nodes) {
    if (
      !node ||
      typeof node.id !== 'string' ||
      !node.id ||
      node.id.length > 100 ||
      ids.has(node.id) ||
      !applicationNodeKinds.includes(node.kind) ||
      typeof node.label !== 'string' ||
      node.label.length > 200 ||
      typeof node.description !== 'string' ||
      node.description.length > 10000 ||
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y) ||
      Math.abs(node.x) > 10000 ||
      Math.abs(node.y) > 10000
    )
      throw new Error(
        'Invalid or duplicate node. Use finite coordinates, supported kinds and unique IDs.'
      )
    ids.add(node.id)
  }
  for (const edge of value.connectors) {
    if (
      !edge ||
      typeof edge.id !== 'string' ||
      !edge.id ||
      edge.id.length > 100 ||
      edgeIds.has(edge.id) ||
      !ids.has(edge.source) ||
      !ids.has(edge.target) ||
      edge.source === edge.target ||
      !connectorKinds.includes(edge.kind) ||
      !['curve', 'straight', 'elbow'].includes(edge.style) ||
      typeof edge.label !== 'string' ||
      edge.label.length > 200
    )
      throw new Error(
        'Invalid connector. Connect two existing distinct nodes and use unique connector IDs.'
      )
    edgeIds.add(edge.id)
  }
  // Project only known properties. JSON never becomes executable code or HTML.
  return {
    version: 1,
    title: value.title,
    description: value.description,
    notes: value.notes,
    nodes: value.nodes.map((n: ApplicationNode) => ({
      id: n.id,
      label: n.label,
      kind: n.kind,
      x: n.x,
      y: n.y,
      description: n.description,
    })),
    connectors: value.connectors.map((e: ApplicationConnector) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      kind: e.kind,
      style: e.style,
    })),
  }
}
export function connectorPath(
  edge: ApplicationConnector,
  nodes: ApplicationNode[]
): string {
  const a = nodes.find((n) => n.id === edge.source),
    b = nodes.find((n) => n.id === edge.target)
  if (!a || !b) return ''
  const vertical = Math.abs(b.x - a.x) < Math.abs(b.y - a.y)
  if (vertical) {
    const down = b.y >= a.y,
      x1 = a.x + 90,
      x2 = b.x + 90,
      y1 = a.y + (down ? 80 : 0),
      y2 = b.y + (down ? 0 : 80)
    if (edge.style === 'straight') return `M${x1},${y1} L${x2},${y2}`
    if (edge.style === 'elbow')
      return `M${x1},${y1} V${(y1 + y2) / 2} H${x2} V${y2}`
    const bend = Math.max(40, Math.abs(y2 - y1) * 0.45) * (down ? 1 : -1)
    return `M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}`
  }
  const right = b.x >= a.x,
    x1 = a.x + (right ? 180 : 0),
    y1 = a.y + 40,
    x2 = b.x + (right ? 0 : 180),
    y2 = b.y + 40
  if (edge.style === 'straight') return `M${x1},${y1} L${x2},${y2}`
  if (edge.style === 'elbow')
    return `M${x1},${y1} H${(x1 + x2) / 2} V${y2} H${x2}`
  const bend = Math.max(55, Math.abs(x2 - x1) * 0.45) * (right ? 1 : -1)
  return `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!
  )
export function applicationSvg(value: ApplicationDiagram): string {
  const minX = Math.min(0, ...value.nodes.map((n) => n.x)) - 40,
    minY = Math.min(0, ...value.nodes.map((n) => n.y)) - 40,
    maxX = Math.max(900, ...value.nodes.map((n) => n.x + 180)) + 40,
    maxY = Math.max(520, ...value.nodes.map((n) => n.y + 80)) + 40
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}"><title>${escape(value.title)}</title><rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="#090a0b"/><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#9298a1"/></marker></defs>${value.connectors
    .map((e) => {
      const a = value.nodes.find((n) => n.id === e.source)!,
        b = value.nodes.find((n) => n.id === e.target)!
      return `<path d="${connectorPath(e, value.nodes)}" fill="none" stroke="#9298a1" stroke-width="1.5" marker-end="url(#arrow)"/><text x="${(a.x + b.x + 180) / 2}" y="${(a.y + b.y) / 2 + 25}" fill="#9298a1" text-anchor="middle" font-family="sans-serif" font-size="11">${escape(e.label)}</text>`
    })
    .join(
      ''
    )}${value.nodes.map((n) => `<rect x="${n.x}" y="${n.y}" width="180" height="80" rx="10" fill="#101112" stroke="#26292d"/><text x="${n.x + 16}" y="${n.y + 26}" fill="#9298a1" font-size="11" font-family="sans-serif">${escape(n.kind.toUpperCase())}</text><text x="${n.x + 16}" y="${n.y + 53}" fill="#f1f2f4" font-size="14" font-family="sans-serif">${escape(n.label)}</text>`).join('')}</svg>`
}
export function applicationMarkdown(value: ApplicationDiagram): string {
  return `# ${value.title}\n\n${value.description}\n\n## Components\n\n${value.nodes.map((n) => `- **${n.label}** (${n.kind}): ${n.description}`).join('\n')}\n\n## Connectors\n\n${value.connectors.map((e) => `- ${value.nodes.find((n) => n.id === e.source)?.label} -> ${value.nodes.find((n) => n.id === e.target)?.label}: ${e.label} (${e.kind})`).join('\n')}\n\n## Notes\n\n${value.notes}\n`
}
