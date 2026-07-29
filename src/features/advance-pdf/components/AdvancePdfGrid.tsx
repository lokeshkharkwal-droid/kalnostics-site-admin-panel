'use client'

import { Badge, DataTable, type Column, type TablePagination } from '@/shared/ui'
import { CopyIcon, EyeIcon, PencilIcon, TrashIcon } from '@/shared/ui/icons'
import { TEMPLATE_TYPES, type AdvanceTemplateRow } from '../services/advance-pdf.api'

/** Format an ISO date as `dd Mon yyyy` (or an em-dash when absent/invalid). */
export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Advance PDF template listing grid. Columns: S.No., Name, Type, Status,
 * Updated, Actions (Preview / Edit / Duplicate / Delete). Built on the shared
 * DataTable, mirroring the other Site Admin listing grids.
 */
export function AdvancePdfGrid({
  rows,
  startIndex,
  loading,
  pagination,
  previewingId,
  duplicatingId,
  onPreview,
  onOpenEditor,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  rows: AdvanceTemplateRow[]
  startIndex: number
  loading: boolean
  pagination?: TablePagination
  /** id whose PDF preview is currently rendering (disables its button). */
  previewingId: string | null
  /** id currently being duplicated (disables its button). */
  duplicatingId: string | null
  onPreview: (row: AdvanceTemplateRow) => void
  /** Open the full block editor (triggered by the name link). */
  onOpenEditor: (id: string) => void
  /** Open the edit-metadata (name + type) form for a row. */
  onEdit: (row: AdvanceTemplateRow) => void
  onDuplicate: (id: string) => void
  onDelete: (row: AdvanceTemplateRow) => void
}) {
  const columns: Column<AdvanceTemplateRow>[] = [
    {
      header: 'S.No.',
      width: 64,
      resizable: false,
      truncate: false,
      align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span>,
    },
    {
      header: 'Name',
      width: 280,
      tooltip: (r) => r.name,
      cell: (r) => (
        <button
          type="button"
          onClick={() => onOpenEditor(r.id)}
          title="Open editor"
          className="max-w-full truncate text-left font-medium text-[#91BEEB] hover:underline"
        >
          {r.name}
        </button>
      ),
    },
    {
      header: 'Type',
      width: 200,
      tooltip: (r) => TEMPLATE_TYPES[r.type] ?? r.type,
      cell: (r) => <span className="text-notion-sub">{TEMPLATE_TYPES[r.type] ?? r.type}</span>,
    },
    {
      header: 'Status',
      width: 110,
      truncate: false,
      cell: (r) => (
        <Badge variant={r.status === 1 ? 'success' : 'secondary'}>
          {r.status === 1 ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Updated',
      width: 150,
      truncate: false,
      cell: (r) => <span className="text-notion-sub">{fmtDate(r.updated_on ?? r.created_on)}</span>,
    },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      pagination={pagination}
      emptyMessage="No advance templates yet — click New Template to start."
      actionsWidth={170}
      actions={(r) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPreview(r)}
            disabled={previewingId != null}
            title="Preview"
            className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(r)}
            title="Edit"
            className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(r.id)}
            disabled={duplicatingId === r.id}
            title="Duplicate"
            className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CopyIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(r)}
            title="Delete"
            className="rounded p-1.5 text-notion-red hover:bg-notion-hover"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    />
  )
}
