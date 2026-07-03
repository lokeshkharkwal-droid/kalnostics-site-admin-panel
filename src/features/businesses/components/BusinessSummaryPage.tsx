'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Badge, DataTable, type Column } from '@/shared/ui'
import { getTenant, listTenantBranches } from '../services/businesses.api'
import type { ITenantBranch } from '../interfaces'

const LIMIT = 20

/** Human-readable label for a SCREAMING_SNAKE enum value (e.g. COLLECTION_CENTER → "Collection Center"). */
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

/**
 * Business summary — lists the tenant's branches (opened from the "Summary"
 * action on the businesses list). Personnel/patient counts are future work.
 */
export function BusinessSummaryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [page, setPage] = useState(1)

  const { data: tenant } = useQuery({
    queryKey: ['siteadmin', 'tenant', id],
    queryFn: () => getTenant(id),
    enabled: !!id,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['siteadmin', 'tenant-branches', id, { page }],
    queryFn: () => listTenantBranches(id, { page, limit: LIMIT }),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })

  const branches = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const columns: Column<ITenantBranch>[] = [
    {
      id: 'sno', header: '#', width: 60, resizable: false, truncate: false,
      cell: (_b, index) => <span className="text-notion-faint">{index + 1}</span>,
    },
    {
      header: 'Branch', width: 240, tooltip: b => b.name,
      cell: b => <span className="font-medium text-notion-text">{b.name}</span>,
    },
    {
      header: 'Code', width: 120,
      cell: b => <span className="font-mono text-xs text-notion-faint">{b.code}</span>,
    },
    {
      header: 'Type', width: 160, truncate: false,
      cell: b => <span className="text-notion-sub">{humanize(b.branchType)}</span>,
    },
    {
      header: 'City', width: 160,
      cell: b => <span className="text-notion-sub">{b.city ?? '—'}</span>,
    },
    {
      header: 'Status', width: 140, truncate: false,
      cell: b => (
        <Badge variant={BRANCH_STATUS_VARIANT[b.status] ?? 'default'}>{humanize(b.status)}</Badge>
      ),
    },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title={tenant ? `${tenant.name} · Summary` : 'Business Summary'}
        subtitle="Branches"
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.push('/businesses')}>
            ← Back
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-notion-text">Branches ({total})</h2>
        <DataTable
          rows={branches}
          rowKey={b => b.id}
          columns={columns}
          loading={isLoading}
          emptyMessage="No branches found for this business."
          pagination={{ page, totalPages, total, limit: LIMIT, onPageChange: setPage }}
        />
      </main>
    </div>
  )
}
