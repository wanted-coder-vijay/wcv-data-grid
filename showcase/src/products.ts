/** Add future shipped products here; previews never masquerade as working tools. */
export const products = [
  {
    id: "grid",
    name: "Grid",
    description:
      "A precise, customizable React data table. Search, filter, edit, and export without losing your flow.",
    href: "/playground",
    docs: "/docs",
    status: "available" as const,
  },
  { id: "studio", name: "Studio", description: "Eight working React builders: forms, scheduling, dashboards, workflows, Gantt plans, documents, charts and application architecture. Install the independent Studio package.", href: "/studio", docs: "/studio", status: "available" as const },
]
