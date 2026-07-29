'use client'

import { Badge, DataTable, type Column } from '@/shared/ui'
import { CopyIcon, PencilIcon, TrashIcon } from '@/shared/ui/icons'
import type { MessagingTemplate } from '../interfaces'
import { FEATURE_LABELS, PREFERENCE_LABELS } from '../utils/constants'

/** Title shown for a row — the display title, falling back to the feature label. */
function rowTitle(r: MessagingTemplate): string {
  return r.displayTitle?.trim() || FEATURE_LABELS[r.feature] || r.feature
}

/**
 * Messaging template listing grid. Columns: S.No., Title, Channel, Feature,
 * Message Type, Level, Default, Status, Actions (Edit / Duplicate / Delete).
 */
export function MessagingTemplatesGrid({
  rows,
  startIndex,
  loading,
  duplicatingId,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  rows: MessagingTemplate[]
  startIndex: number
  loading: boolean
  /** id currently being duplicated (disables its button). */
  duplicatingId: string | null
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}) {
  const columns: Column<MessagingTemplate>[] = [
    {
      header: 'S.No.',
      width: 64,
      resizable: false,
      truncate: false,
      align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span>,
    },
    {
      header: 'Title',
      width: 260,
      tooltip: (r) => rowTitle(r),
      cell: (r) => <span className="font-medium text-notion-text">{rowTitle(r)}</span>,
    },
    {
      header: 'Channel',
      width: 130,
      truncate: false,
      cell: (r) => <span className="text-notion-sub">{PREFERENCE_LABELS[r.preference] ?? r.preference}</span>,
    },
    {
      header: 'Feature',
      width: 220,
      tooltip: (r) => FEATURE_LABELS[r.feature] ?? r.feature,
      cell: (r) => <span className="text-notion-sub">{FEATURE_LABELS[r.feature] ?? r.feature}</span>,
    },
    {
      header: 'Message Type',
      width: 130,
      truncate: false,
      cell: (r) => <span className="text-notion-sub">{r.messageType ?? '—'}</span>,
    },
    {
      header: 'Level',
      width: 100,
      truncate: false,
      cell: (r) => <span className="text-notion-sub">{r.level}</span>,
    },
    {
      header: 'Default',
      width: 90,
      truncate: false,
      cell: (r) => (r.isDefault ? <Badge variant="secondary">Default</Badge> : <span className="text-notion-faint">—</span>),
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
            onClick={() => onEdit(r.id)}
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
            onClick={() => onDelete(r.id)}
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
