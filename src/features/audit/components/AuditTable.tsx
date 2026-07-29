'use client'

import { Badge, DataTable, type Column, type TablePagination } from '@/shared/ui'
import type { AuditActionValue, AuditRecord } from '../interfaces'
import { MODULE_OPTIONS } from '../utils/constants'

const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  MODULE_OPTIONS.map(o => [o.value, o.label]),
)

const ACTION_VARIANT: Record<AuditActionValue, 'success' | 'info' | 'danger' | 'default'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  LOGIN: 'default',
  LOGOUT: 'default',
  EXPORT: 'default',
  OTHER: 'default',
}

/** Format an ISO timestamp as a compact, locale-aware date + time. */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

interface AuditTableProps {
  rows: AuditRecord[]
  loading?: boolean
  startIndex: number
  pagination?: TablePagination
}

export function AuditTable({ rows, loading, startIndex, pagination }: AuditTableProps) {
  const columns: Column<AuditRecord>[] = [
    {
      header: 'S.No.', width: 64, resizable: false, truncate: false, align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span>,
    },
    {
      header: 'Date & Time', width: 190, tooltip: r => formatDateTime(r.createdAt),
      cell: r => <span className="text-notion-sub">{formatDateTime(r.createdAt)}</span>,
    },
    {
      header: 'Business', width: 180, tooltip: r => r.tenantName ?? '',
      cell: r => <span className="text-notion-text">{r.tenantName || '—'}</span>,
    },
    {
      header: 'Username', width: 190,
      tooltip: r => r.actorUsername ?? r.actorName ?? r.actorRoleLabel ?? '',
      cell: r => (
        <div>
          <span className="truncate font-medium text-notion-text">
            {r.actorUsername || r.actorName || r.actorRoleLabel || '—'}
          </span>
          {r.actorName && r.actorUsername && (
            <p className="truncate text-xs text-notion-faint">{r.actorName}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Action', width: 110, truncate: false,
      cell: r => <Badge variant={ACTION_VARIANT[r.action] ?? 'default'}>{r.action.toLowerCase()}</Badge>,
    },
    {
      header: 'Module', width: 160, tooltip: r => MODULE_LABELS[r.module] ?? r.module,
      cell: r => <span className="text-notion-sub">{MODULE_LABELS[r.module] ?? r.module}</span>,
    },
    {
      header: 'IP Address', width: 140, tooltip: r => r.ipAddress ?? '',
      cell: r => <span className="font-mono text-xs text-notion-sub">{r.ipAddress || '—'}</span>,
    },
    {
      header: 'Details', width: 340, tooltip: r => r.description,
      cell: r => <span className="text-notion-text">{r.description}</span>,
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
      emptyMessage="No audit records found"
    />
  )
}
