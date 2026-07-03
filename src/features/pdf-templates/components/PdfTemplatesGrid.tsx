'use client'

import { Badge, Toggle, DataTable, type Column } from '@/shared/ui'
import { EyeIcon, PencilIcon, TrashIcon } from '@/shared/ui/icons'
import type { PdfTemplateListRow } from '../interfaces'

/**
 * PDF template listing grid. Columns: S.No., Name, Type, Status, Actions
 * (Preview / Edit / Delete / status Toggle).
 */
export function PdfTemplatesGrid({
  rows,
  startIndex,
  loading,
  typeLabels,
  previewingId,
  onPreview,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  rows: PdfTemplateListRow[]
  startIndex: number
  loading: boolean
  /** type key → human label, for the Type column. */
  typeLabels: Record<string, string>
  /** id currently generating a preview (disables its button). */
  previewingId: string | null
  onPreview: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
}) {
  const typeLabel = (r: PdfTemplateListRow) => typeLabels[r.type] ?? r.type

  const columns: Column<PdfTemplateListRow>[] = [
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
      width: 260,
      tooltip: (r) => r.name,
      cell: (r) => <span className="font-medium text-notion-text">{r.name}</span>,
    },
    {
      header: 'Type',
      width: 200,
      tooltip: typeLabel,
      cell: (r) => <span className="text-notion-sub">{typeLabel(r)}</span>,
    },
    {
      header: 'Status',
      width: 110,
      truncate: false,
      cell: (r) => (
        <Badge variant={r.isActive ? 'success' : 'secondary'}>
          {r.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      emptyMessage="No templates found"
      actions={(r) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPreview(r.id)}
            disabled={previewingId === r.id}
            title="Preview"
            className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(r.id)}
            title="Edit"
            className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(r.id)}
            title="Delete"
            className="rounded p-1.5 text-notion-red hover:bg-notion-hover"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <span className="mx-1 h-4 w-px bg-notion-line" />
          <Toggle
            checked={r.isActive}
            onChange={() => onToggleStatus(r.id)}
            title={r.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
          />
        </div>
      )}
    />
  )
}
