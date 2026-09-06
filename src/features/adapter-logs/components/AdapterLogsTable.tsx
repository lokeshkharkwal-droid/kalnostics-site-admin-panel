'use client'

import { Badge, Button, DataTable, type Column, type TablePagination } from '@/shared/ui'
import type { AdapterLogRecord } from '../interfaces'
import {
  ACTION_LABELS,
  ACTION_VARIANT,
  formatDateTime,
  statusVariant,
} from '../utils/constants'

interface AdapterLogsTableProps {
  rows: AdapterLogRecord[]
  loading?: boolean
  startIndex: number
  pagination?: TablePagination
  onView: (log: AdapterLogRecord) => void
}

/**
 * Adapter-logs table for the SiteAdmin cross-tenant view. Columns mirror the
 * legacy Kalnostic Kitchen screen (Source IP · Status · Action · Token · Date &
 * Time), prefixed with the owning Business, with a per-row View action.
 */
export function AdapterLogsTable({
  rows,
  loading,
  startIndex,
  pagination,
  onView,
}: AdapterLogsTableProps) {
  const columns: Column<AdapterLogRecord>[] = [
    {
      header: 'S.No.', width: 64, resizable: false, truncate: false,
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span>,
    },
    {
      header: 'Business', width: 180, tooltip: r => r.tenantName ?? '',
      cell: r => <span className="text-notion-text">{r.tenantName || '—'}</span>,
    },
    {
      header: 'Source IP', width: 140, tooltip: r => r.sourceIpAddress ?? '',
      cell: r => (
        <span className="font-mono text-xs text-notion-sub">
          {r.sourceIpAddress || '—'}
        </span>
      ),
    },
    {
      header: 'Status', width: 110, truncate: false,
      cell: r =>
        r.status ? (
          <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
        ) : (
          <span className="text-notion-faint">—</span>
        ),
    },
    {
      header: 'Action', width: 140, truncate: false,
      cell: r => (
        <Badge variant={ACTION_VARIANT[r.action] ?? 'default'}>
          {ACTION_LABELS[r.action] ?? r.action}
        </Badge>
      ),
    },
    {
      header: 'Token', width: 170, tooltip: r => r.token ?? '',
      cell: r => (
        <span className="font-mono text-xs text-notion-sub">{r.token || '—'}</span>
      ),
    },
    {
      header: 'Date & Time', width: 190, tooltip: r => formatDateTime(r.createdAt),
      cell: r => <span className="text-notion-sub">{formatDateTime(r.createdAt)}</span>,
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
      emptyMessage="No adapter logs found"
      actionsWidth={90}
      actions={row => (
        <Button variant="ghost" size="sm" onClick={() => onView(row)}>
          View
        </Button>
      )}
    />
  )
}
