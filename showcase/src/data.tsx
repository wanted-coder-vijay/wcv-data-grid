import type { ColumnDef } from "@tanstack/react-table"
export type Project = {
  id: string
  name: string
  owner: string
  status: string
  priority: string
  budget: number
  date: string
  progress: number
}
const names = [
  "Website redesign",
  "Mobile onboarding",
  "Design system",
  "Analytics dashboard",
  "Payment integration",
  "Customer portal",
  "API documentation",
  "Search experience",
  "Brand refresh",
  "Performance audit",
  "Team workspace",
  "Notification center",
]
const owners = [
  "Olivia Chen",
  "Alex Morgan",
  "Sofia Patel",
  "James Wilson",
  "Emma Davis",
  "Noah Kim",
]
export function createData(count = 48): Project[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `PRJ-${String(i + 1).padStart(3, "0")}`,
    name:
      names[i % names.length] + (i >= 12 ? ` ${Math.floor(i / 12) + 1}` : ""),
    owner: owners[i % owners.length],
    status: ["In progress", "Done", "In review", "Backlog"][i % 4],
    priority: ["High", "Medium", "Low"][i % 3],
    budget: 1200 + ((i * 1739) % 20000),
    date: `2026-10-${String(7 + (i % 22)).padStart(2, "0")}`,
    progress: [68, 100, 84, 12, 42, 100][i % 6],
  }))
}
export function createColumns(editable = true): ColumnDef<Project>[] {
  return [
    {
      accessorKey: "id",
      header: "Project ID",
      size: 108,
      meta: { label: "Project ID", isEditable: false },
    },
    {
      accessorKey: "name",
      header: "Project",
      size: 220,
      meta: { label: "Project", editor: "text", isEditable: editable },
    },
    {
      accessorKey: "owner",
      header: "Owner",
      size: 158,
      meta: { label: "Owner", editor: "text", isEditable: editable },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 148,
      meta: {
        label: "Status",
        editor: "select",
        filterType: "multi-select",
        isEditable: editable,
        selectOptions: ["In progress", "Done", "In review", "Backlog"].map(
          (value) => ({ value, label: value })
        ),
        badgeMap: {
          "In progress": "default",
          Done: "success",
          "In review": "warning",
          Backlog: "secondary",
        },
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      size: 110,
      meta: {
        label: "Priority",
        editor: "select",
        filterType: "select",
        isEditable: editable,
        selectOptions: ["High", "Medium", "Low"].map((value) => ({
          value,
          label: value,
        })),
        badgeMap: { High: "destructive", Medium: "warning", Low: "secondary" },
      },
    },
    {
      accessorKey: "budget",
      header: "Budget",
      size: 115,
      meta: {
        label: "Budget",
        editor: "currency",
        filterType: "number",
        isEditable: editable,
        align: "right",
      },
    },
    {
      accessorKey: "date",
      header: "Due date",
      size: 135,
      meta: {
        label: "Due date",
        editor: "date",
        filterType: "date",
        isEditable: editable,
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      size: 132,
      cell: ({ getValue }) => (
        <div className="progress-cell">
          <span>
            <i style={{ width: `${getValue<number>()}%` }} />
          </span>
          <small>{getValue<number>()}%</small>
        </div>
      ),
      meta: { label: "Progress", filterType: "number", isEditable: false },
    },
  ]
}
