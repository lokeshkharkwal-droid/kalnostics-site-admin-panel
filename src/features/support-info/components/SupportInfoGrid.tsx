'use client'

import { ActionMenu, Badge, DataTable, type Column } from '@/shared/ui'
import type { SupportInfoListRow } from '../interfaces'

/** Format an ISO timestamp as a short local date; blank on bad input. */
function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Support Information listing grid. Columns: Meta Type, Code, Title, Updated
 * Date, Tenant Type, Status, plus a View / Edit / Delete actions menu.
 */
export function SupportInfoGrid({
  rows, startIndex, loading, onView, onEdit, onDelete,
}: {
  rows: SupportInfoListRow[]
  startIndex: number
  loading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const columns: Column<SupportInfoListRow>[] = [
    { header: 'Meta Type', width: 150, cell: (r) => <span className="font-medium text-notion-text">{r.metaType}</span> },
    { header: 'Code', width: 130, cell: (r) => <span className="font-mono text-xs text-notion-blue">{r.code || '—'}</span> },
    { header: 'Title', width: 260, tooltip: (r) => r.title, cell: (r) => <span className="text-notion-text">{r.title}</span> },
    { header: 'Updated Date', width: 140, cell: (r) => <span className="text-notion-sub">{formatDate(r.updatedAt)}</span> },
    {
      header: 'Tenant Type', width: 130, truncate: false,
      cell: (r) => <Badge variant="info">{r.tenantType === 'BUSINESS' ? 'Business' : 'Branch'}</Badge>,
    },
    {
      header: 'Status', width: 110, truncate: false,
      cell: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'secondary'}>{r.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge>,
    },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      emptyMessage="No support information found"
      actions={(r) => (
        <ActionMenu
          items={[
            { label: 'View', onClick: () => onView(r.id) },
            { label: 'Edit', onClick: () => onEdit(r.id) },
            { label: 'Delete', onClick: () => onDelete(r.id), variant: 'danger' },
          ]}
        />
      )}
    />
  )
}
