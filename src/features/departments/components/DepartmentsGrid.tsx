'use client'

import { Badge, Toggle, DataTable, type Column } from '@/shared/ui'
import { EyeIcon, PencilIcon, TrashIcon } from '@/shared/ui/icons'
import { formatModules } from '@/shared/constants/branch-modules'
import type { DepartmentListRow } from '@/entities/department'

/**
 * Department listing grid. Single view (no tabs). Columns: S.No., Department
 * Name, Code, Short Name, Modules, Actions (View / Edit / Delete / Status).
 */
export function DepartmentsGrid({
  rows, startIndex, loading, onView, onEdit, onDelete, onToggleStatus,
}: {
  rows: DepartmentListRow[]
  /** Number of rows on previous pages — for the page-aware S.No. */
  startIndex: number
  loading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}) {
  const columns: Column<DepartmentListRow>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false, align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'Department Name', width: 220, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'Code', width: 130,
      cell: r => <span className="font-mono text-xs text-notion-blue">{r.code}</span> },
    { header: 'Short Name', width: 160, cell: r => <span className="text-notion-sub">{r.shortName}</span> },
    { header: 'Modules', width: 260, tooltip: r => formatModules(r.moduleMapping),
      cell: r => <span className="text-notion-sub">{formatModules(r.moduleMapping)}</span> },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={r => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      emptyMessage="No departments found"
      actions={r => (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onView(r.id)} title="View" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><EyeIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => onEdit(r.id)} title="Edit" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><PencilIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(r.id)} title="Delete" className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-4 w-4" /></button>
          <span className="mx-1 h-4 w-px bg-notion-line" />
          <Toggle checked={r.isActive} onChange={() => onToggleStatus(r.id)} title={r.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'} />
          <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
      )}
    />
  )
}
