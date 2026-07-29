'use client'

import { DataTable, type Column, type TablePagination } from '@/shared/ui'
import { EyeIcon, TrashIcon } from '@/shared/ui/icons'
import type { ContactSubmissionRow } from '../interfaces'

/** Format an ISO timestamp as a compact, locale-aware date + time. */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ContactUsTableProps {
  rows: ContactSubmissionRow[]
  loading?: boolean
  startIndex: number
  pagination?: TablePagination
  onView: (row: ContactSubmissionRow) => void
  onDelete: (id: string) => void
}

export function ContactUsTable({
  rows,
  loading,
  startIndex,
  pagination,
  onView,
  onDelete,
}: ContactUsTableProps) {
  const columns: Column<ContactSubmissionRow>[] = [
    {
      header: 'S.No.', width: 64, resizable: false, truncate: false, align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span>,
    },
    {
      header: 'Name', width: 190, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span>,
    },
    {
      header: 'Organization', width: 200, tooltip: r => r.organization,
      cell: r => <span className="text-notion-text">{r.organization || '—'}</span>,
    },
    {
      header: 'Mobile', width: 150, tooltip: r => r.mobileNumber,
      cell: r => <span className="text-notion-sub">{r.mobileNumber || '—'}</span>,
    },
    {
      header: 'Email', width: 240, tooltip: r => r.email,
      cell: r => <span className="text-notion-sub">{r.email || '—'}</span>,
    },
    {
      header: 'Created On', width: 170, tooltip: r => formatDateTime(r.createdOn),
      cell: r => <span className="text-notion-sub">{formatDateTime(r.createdOn)}</span>,
    },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={r => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      pagination={pagination}
      emptyMessage="No contact submissions found"
      actions={r => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onView(r)}
            title="View"
            className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"
          >
            <EyeIcon className="h-4 w-4" />
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
