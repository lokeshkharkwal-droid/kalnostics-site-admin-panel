'use client'

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Badge, DataTable, type Column } from '@/shared/ui'
import { listTenantBranches } from '../services/businesses.api'
import type { ITenantBranch } from '../interfaces'

const LIMIT = 20

/** Human-readable label for a SCREAMING_SNAKE enum value (COLLECTION_CENTER → "Collection Center"). */
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const BRANCH_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  ACTIVE: 'success',
  UNDER_MAINTENANCE: 'warning',
  INACTIVE: 'default',
}

/** Branches panel on the business detail page — lists the tenant's branches. */
export function BranchesTab({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['siteadmin', 'tenant-branches', tenantId, { page }],
    queryFn: () => listTenantBranches(tenantId, { page, limit: LIMIT }),
    enabled: !!tenantId,
    placeholderData: keepPreviousData,
  })

  const branches = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const columns: Column<ITenantBranch>[] = [
    {
      header: 'Branch', width: 220, tooltip: b => b.name,
      cell: b => <span className="font-medium text-notion-text">{b.name}</span>,
    },
    {
      header: 'Code', width: 110,
      cell: b => <span className="font-mono text-xs text-notion-faint">{b.code}</span>,
    },
    {
      header: 'Type', width: 150, truncate: false,
      cell: b => <span className="text-notion-sub">{humanize(b.branchType)}</span>,
    },
    {
      header: 'City', width: 130,
      cell: b => <span className="text-notion-sub">{b.city ?? '—'}</span>,
    },
    {
      header: 'Manager', width: 150,
      cell: b => <span className="text-notion-sub">{b.managerName ?? '—'}</span>,
    },
    {
      header: 'Phone', width: 140,
      cell: b => <span className="text-notion-sub">{b.phone ?? '—'}</span>,
    },
    {
      header: 'Status', width: 130, truncate: false,
      cell: b => <Badge variant={BRANCH_STATUS_VARIANT[b.status] ?? 'default'}>{humanize(b.status)}</Badge>,
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-notion-text">Branches ({total})</h2>
      <DataTable
        rows={branches}
        rowKey={b => b.id}
        columns={columns}
        loading={isLoading}
        emptyMessage="No branches found for this business."
        pagination={{ page, totalPages, total, limit: LIMIT, onPageChange: setPage }}
      />
    </div>
  )
}
