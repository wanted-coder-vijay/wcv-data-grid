export const siteUrl = "https://dynostack-react-grid.vercel.app"
export const packageUrl = "https://www.npmjs.com/package/@dynostack/react-grid"
export const repositoryUrl = "https://github.com/wanted-coder-vijay/wcv-data-grid"
export const pages = {
  "/api-playground": {title:"Dynostack API Code Playground",description:"Edit JavaScript API adapters, column definitions and React Grid configuration. Try live API data, grouping, bulk edits, spreadsheet paste and undo history.",name:"API Code Playground"},
  "/blocks": {title:"Dynostack Blocks | Live React Component Library",description:"Explore live React blocks for smooth charts, forms, schedules, dashboards and application architecture. Preview layouts and copy controlled component examples.",name:"Dynostack Blocks"},
  "/studio": {
    title: "Dynostack Studio | React Builders and Live Playgrounds",
    description: "Explore local previews of Dynostack form, scheduler, dashboard, workflow, Gantt, document and chart modules with configurable React demos and integration docs.",
    name: "Dynostack Studio",
  },
  "/": {
    title: "Dynostack | React Grid and UI Tools",
    description: "Dynostack builds open-source tools for modern React interfaces. Explore Dynostack React Grid: editable data tables with filtering, theming and CSV export.",
    name: "Dynostack",
  },
  "/playground": {
    title: "Dynostack React Grid Playground | Live Data Table Demo",
    description: "Try Dynostack React Grid online. Explore column filters, inline editing, sorting, pinning, themes and exports, then copy the configuration into your React app.",
    name: "Dynostack React Grid Playground",
  },
  "/docs": {
    title: "Dynostack React Grid Documentation | React Data Table Setup",
    description: "Install @dynostack/react-grid and build a React data table. Learn Tailwind setup, editable columns, filtering, themes, data fetching and CSV or Excel export.",
    name: "Dynostack React Grid Documentation",
  },
} as const
export type PagePath = keyof typeof pages
export function structuredData(path: PagePath) {
  const page = pages[path]
  const organization = {
    "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "Dynostack",
    url: `${siteUrl}/`, logo: `${siteUrl}/brand/dynostack-mark-light.svg`,
    sameAs: [repositoryUrl, packageUrl],
  }
  const website = {
    "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "Dynostack",
    alternateName: "Dynostack React Grid", url: `${siteUrl}/`,
    publisher: { "@id": `${siteUrl}/#organization` },
  }
  const graph: unknown[] = [
    { "@type": "WebPage", "@id": `${siteUrl}${path}#webpage`,
      url: `${siteUrl}${path}`, name: page.title, description: page.description,
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#grid` } },
  ]
  if (path === "/") graph.unshift(organization, website, {
    "@type": "SoftwareApplication", "@id": `${siteUrl}/#grid`,
    name: "Dynostack React Grid", alternateName: "@dynostack/react-grid",
    applicationCategory: "DeveloperApplication", operatingSystem: "Any",
    description: "An open-source React data grid with filtering, inline editing, column controls, themes and CSV export.",
    url: `${siteUrl}/`, downloadUrl: packageUrl, sameAs: [repositoryUrl, packageUrl],
    license: "https://www.apache.org/licenses/LICENSE-2.0",
    publisher: { "@id": `${siteUrl}/#organization` },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  })
  else graph.push({
    "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Dynostack", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: page.name, item: `${siteUrl}${path}` },
    ],
  })
  return { "@context": "https://schema.org", "@graph": graph }
}
const escape = (value: string) => value.replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!)
export function renderSeoHead(path: PagePath) {
  const page = pages[path]
  const url = `${siteUrl}${path}`
  const image = `${siteUrl}/table-images/grid-dark.png`
  return `<title>${escape(page.title)}</title>
    <meta name="description" content="${escape(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Dynostack" />
    <meta property="og:title" content="${escape(page.title)}" />
    <meta property="og:description" content="${escape(page.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:alt" content="Dynostack React Grid dark theme playground" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escape(page.title)}" />
    <meta name="twitter:description" content="${escape(page.description)}" />
    <meta name="twitter:image" content="${image}" />
    <script id="dynostack-schema" type="application/ld+json">${JSON.stringify(structuredData(path)).replace(/</g, "\\u003c")}</script>`
}
/** Keep metadata accurate after client-side navigation, including Back/Forward. */
export function applyPageSeo(path: PagePath) {
  const template = document.createElement("template")
  template.innerHTML = renderSeoHead(path)
  for (const node of Array.from(template.content.children)) {
    const key = node.tagName === "TITLE" ? "title"
      : node.tagName === "LINK" ? 'link[rel="canonical"]'
      : node.tagName === "SCRIPT" ? "#dynostack-schema"
      : `meta[${node.hasAttribute("property") ? "property" : "name"}="${node.getAttribute("property") ?? node.getAttribute("name")}"]`
    const current = document.head.querySelector(key)
    if (current) current.replaceWith(node)
    else document.head.appendChild(node)
  }
}
