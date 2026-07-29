'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Card, CardContent, Input, PageLoader } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { listTenants } from '@/features/businesses/services/businesses.api'
import { listAuditLogs } from '../services/audit.api'
import { AuditTable } from './AuditTable'
import { ACTION_OPTIONS, AUDIT_PAGE_LIMIT, MODULE_OPTIONS } from '../utils/constants'
import {
  DATE_PRESET_OPTIONS,
  presetDateInputs,
  resolveDateRange,
  type DatePresetKey,
} from '../utils/date-presets'
import type { AuditActionValue, AuditModuleValue } from '../interfaces'

const SELECT_CLASS =
  'h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue'

export function AuditPage() {
  const [search, setSearch] = useState('')
  const [module, setModule] = useState<AuditModuleValue | ''>('')
  const [action, setAction] = useState<AuditActionValue | ''>('')
  const [tenantId, setTenantId] = useState('')
  const [datePreset, setDatePreset] = useState<DatePresetKey>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search, 400)

  // Resolve the selected date preset (+ any picked dates) into from/to bounds.
  const { from, to } = useMemo(
    () => resolveDateRange(datePreset, dateFrom, dateTo),
    [datePreset, dateFrom, dateTo],
  )

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, module, action, tenantId, from, to])

  // Business options for the tenant filter (fetched once; up to 100 businesses).
  const { data: businesses } = useQuery({
    queryKey: ['siteadmin', 'audit', 'businesses'],
    queryFn: () => listTenants({ page: 1, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  })
  const businessOptions = useMemo(
    () => [...(businesses?.rows ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [businesses],
  )

  const { data, isLoading } = useQuery({
    queryKey: [
      'siteadmin', 'audit',
      { search: debouncedSearch, module, action, tenantId, from, to, page },
    ],
    queryFn: () =>
      listAuditLogs({
        page, limit: AUDIT_PAGE_LIMIT,
        search: debouncedSearch, module, action, tenantId, from, to,
      }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const dateInputs = presetDateInputs(datePreset)
  const hasFilters =
    !!search || !!module || !!action || !!tenantId || datePreset !== 'ALL'

  function clearFilters() {
    setSearch('')
    setModule('')
    setAction('')
    setTenantId('')
    setDatePreset('ALL')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Audit"
        subtitle="Audit trail across every business on the Kalnostics portal"
      />

      <main className="flex-1 space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search by details…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={module}
            onChange={e => setModule(e.target.value as AuditModuleValue | '')}
            className={SELECT_CLASS}
          >
            <option value="">All Modules</option>
            {MODULE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={action}
            onChange={e => setAction(e.target.value as AuditActionValue | '')}
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

          <select
            value={datePreset}
            onChange={e => {
              setDatePreset(e.target.value as DatePresetKey)
              setDateFrom('')
              setDateTo('')
            }}
            className={SELECT_CLASS}
          >
            {DATE_PRESET_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {dateInputs >= 1 && (
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className={SELECT_CLASS}
              aria-label={datePreset === 'RANGE' ? 'Start date' : 'Date'}
            />
          )}
          {dateInputs === 2 && (
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className={SELECT_CLASS}
              aria-label="End date"
            />
          )}

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
              <AuditTable
                rows={rows}
                startIndex={(page - 1) * AUDIT_PAGE_LIMIT}
                pagination={{
                  page,
                  totalPages,
                  total,
                  limit: AUDIT_PAGE_LIMIT,
                  onPageChange: setPage,
                }}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
