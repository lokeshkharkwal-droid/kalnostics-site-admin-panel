'use client'

import { Badge, Toggle, DataTable, type Column } from '@/shared/ui'
import { EyeIcon, PencilIcon, TrashIcon } from '@/shared/ui/icons'
import { formatModules } from '@/shared/constants/branch-modules'
import type { CategoryListRow } from '@/entities/category'
import { CATEGORY_TYPE_LABELS } from '../interfaces'

/**
 * Category listing grid. Columns: S.No., Category Name, Code, Short Name,
 * Modules, Type, Department Name, Actions (View / Edit / Delete / Status).
 */
export function CategoriesGrid({
  rows, startIndex, loading, deptNameMap, onView, onEdit, onDelete, onToggleStatus,
}: {
  rows: CategoryListRow[]
  startIndex: number
  loading: boolean
  /** departmentId → name, for the Department Name column. */
  deptNameMap: Record<string, string>
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}) {
  const deptName = (r: CategoryListRow) =>
    r.departmentId ? deptNameMap[r.departmentId] ?? r.departmentId : '—'

  const columns: Column<CategoryListRow>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false, align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'Category Name', width: 200, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'Code', width: 120,
      cell: r => <span className="font-mono text-xs text-notion-blue">{r.code}</span> },
    { header: 'Short Name', width: 150, cell: r => <span className="text-notion-sub">{r.shortName}</span> },
    { header: 'Modules', width: 220, tooltip: r => formatModules(r.moduleMapping),
      cell: r => <span className="text-notion-sub">{formatModules(r.moduleMapping)}</span> },
    { header: 'Type', width: 140, tooltip: r => CATEGORY_TYPE_LABELS[r.categoryType],
      cell: r => <span className="text-notion-sub">{CATEGORY_TYPE_LABELS[r.categoryType]}</span> },
    { header: 'Department Name', width: 200, tooltip: deptName,
      cell: r => <span className="text-notion-sub">{deptName(r)}</span> },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={r => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      emptyMessage="No categories found"
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
