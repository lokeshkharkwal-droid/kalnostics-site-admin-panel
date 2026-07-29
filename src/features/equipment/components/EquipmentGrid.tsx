'use client'

import { DataTable, type Column } from '@/shared/ui'
import { EyeIcon, PencilIcon, TrashIcon } from '@/shared/ui/icons'
import type { EquipmentListRow } from '@/entities/equipment'

/**
 * Equipment listing grid. Columns: S.No., Name, Code, Lab Tests (count),
 * Actions (View / Edit / Delete).
 */
export function EquipmentGrid({
  rows, startIndex, loading, onView, onEdit, onDelete,
}: {
  rows: EquipmentListRow[]
  /** Number of rows on previous pages — for the page-aware S.No. */
  startIndex: number
  loading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const columns: Column<EquipmentListRow>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false, align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'Name', width: 300, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'Code', width: 200, tooltip: r => r.code ?? '',
      cell: r => r.code
        ? <span className="font-mono text-xs text-notion-blue">{r.code}</span>
        : <span className="text-notion-faint">—</span> },
    { header: 'Lab Tests', width: 120, align: 'left',
      cell: r => <span className="text-notion-sub">{r.labTestsCount}</span> },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={r => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      emptyMessage="No equipment found"
      actions={r => (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onView(r.id)} title="View" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><EyeIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => onEdit(r.id)} title="Edit" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><PencilIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(r.id)} title="Delete" className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-4 w-4" /></button>
        </div>
      )}
    />
  )
}
