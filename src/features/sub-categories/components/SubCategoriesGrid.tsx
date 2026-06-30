'use client'

import { Badge, Toggle, DataTable, type Column } from '@/shared/ui'
import { EyeIcon, PencilIcon, TrashIcon } from '@/shared/ui/icons'
import { formatModules } from '@/shared/constants/branch-modules'
import type { SubCategoryListRow } from '@/entities/sub-category'
import { SUB_CATEGORY_TYPE_LABELS } from '../interfaces'

/**
 * Sub-Category listing grid. Columns: S.No., Sub Category Name, Code, Short Name,
 * Modules, Type, Department Name, Category Name, Actions (View / Edit / Delete /
 * Status).
 */
export function SubCategoriesGrid({
  rows, startIndex, loading, deptNameMap, catNameMap, onView, onEdit, onDelete, onToggleStatus,
}: {
  rows: SubCategoryListRow[]
  startIndex: number
  loading: boolean
  deptNameMap: Record<string, string>
  catNameMap: Record<string, string>
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}) {
  const deptName = (r: SubCategoryListRow) =>
    r.departmentId ? deptNameMap[r.departmentId] ?? r.departmentId : '—'
  const catName = (r: SubCategoryListRow) =>
    r.categoryId ? catNameMap[r.categoryId] ?? r.categoryId : '—'

  const columns: Column<SubCategoryListRow>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false, align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'Sub Category Name', width: 200, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'Code', width: 120,
      cell: r => <span className="font-mono text-xs text-notion-blue">{r.code}</span> },
    { header: 'Short Name', width: 150, cell: r => <span className="text-notion-sub">{r.shortName}</span> },
    { header: 'Modules', width: 220, tooltip: r => formatModules(r.moduleMapping),
      cell: r => <span className="text-notion-sub">{formatModules(r.moduleMapping)}</span> },
    { header: 'Type', width: 140, tooltip: r => SUB_CATEGORY_TYPE_LABELS[r.subCategoryType],
      cell: r => <span className="text-notion-sub">{SUB_CATEGORY_TYPE_LABELS[r.subCategoryType]}</span> },
    { header: 'Department Name', width: 180, tooltip: deptName,
      cell: r => <span className="text-notion-sub">{deptName(r)}</span> },
    { header: 'Category Name', width: 180, tooltip: catName,
      cell: r => <span className="text-notion-sub">{catName(r)}</span> },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={r => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      emptyMessage="No sub-categories found"
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
