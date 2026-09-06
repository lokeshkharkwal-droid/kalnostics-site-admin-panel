'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Card, CardContent, Input, PageLoader } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { listTenants } from '@/features/businesses/services/businesses.api'
import { listAdapterLogs } from '../services/adapter-logs.api'
import { AdapterLogsTable } from './AdapterLogsTable'
import { AdapterLogDetailModal } from './AdapterLogDetailModal'
import { ACTION_OPTIONS, ADAPTER_LOGS_PAGE_LIMIT } from '../utils/constants'
import type { AdapterActionValue, AdapterLogRecord } from '../interfaces'

const SELECT_CLASS =
  'h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue'

/**
 * Adapter Logs — SiteAdmin cross-tenant view of EMI adapter transactions
 * (emi/orders, emi/submitResult) across every business, with a tenant filter and
 * a per-row View detail modal.
 */
export function AdapterLogsPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState<AdapterActionValue | ''>('')
  const [tenantId, setTenantId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdapterLogRecord | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)

  const from = dateFrom || undefined
  const to = dateTo || undefined

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, action, tenantId, from, to])

  // Business options for the tenant filter (fetched once; up to 100 businesses).
  const { data: businesses } = useQuery({
    queryKey: ['siteadmin', 'adapter-logs', 'businesses'],
    queryFn: () => listTenants({ page: 1, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  })
  const businessOptions = useMemo(
    () => [...(businesses?.rows ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [businesses],
  )

  const { data, isLoading } = useQuery({
    queryKey: [
      'siteadmin', 'adapter-logs',
      { search: debouncedSearch, action, tenantId, from, to, page },
    ],
    queryFn: () =>
      listAdapterLogs({
        page, limit: ADAPTER_LOGS_PAGE_LIMIT,
        search: debouncedSearch, action, tenantId, from, to,
      }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const hasFilters = !!search || !!action || !!tenantId || !!dateFrom || !!dateTo

  function clearFilters() {
    setSearch('')
    setAction('')
    setTenantId('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Adapter Logs"
        subtitle="EMI adapter transactions across every business on the Kalnostics portal"
      />

      <main className="flex-1 space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search by token, status, source IP…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={action}
            onChange={e => setAction(e.target.value as AdapterActionValue | '')}
            className={SELECT_CLASS}
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={tenantId}
            onChange={e => setTenantId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">All Businesses</option>
            {businessOptions.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className={SELECT_CLASS}
            aria-label="Start date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className={SELECT_CLASS}
            aria-label="End date"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'record' : 'records'}
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <PageLoader />
            ) : (
              <AdapterLogsTable
                rows={rows}
                startIndex={(page - 1) * ADAPTER_LOGS_PAGE_LIMIT}
                onView={setSelected}
                pagination={{
                  page,
                  totalPages,
                  total,
                  limit: ADAPTER_LOGS_PAGE_LIMIT,
                  onPageChange: setPage,
                }}
              />
            )}
          </CardContent>
        </Card>
      </main>

      {selected && (
        <AdapterLogDetailModal log={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
