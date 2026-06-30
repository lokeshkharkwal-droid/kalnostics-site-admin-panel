'use client'

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Input, Badge, DataTable, type Column } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { STATUS_VARIANT, STATUS_LABEL, STATUS_OPTIONS } from '@/entities/tenant'
import { listTenants } from '../services/businesses.api'
import type { ICreatedCredentials } from '../interfaces'
import { CreateBusinessModal } from './CreateBusinessModal'
import { CredentialsCard } from './CredentialsCard'

const LIMIT = 20

export function BusinessesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<ICreatedCredentials | null>(null)

  // Debounce the free-text search so we fire one request after typing settles,
  // not one per keystroke. Resetting to page 1 keeps results meaningful.
  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch])

  // `keepPreviousData` keeps the current page visible while the next one loads.
  const { data, isLoading } = useQuery({
    queryKey: ['siteadmin', 'tenants', { search: debouncedSearch, status: statusFilter, page }],
    queryFn: () => listTenants({ page, limit: LIMIT, search: debouncedSearch, status: statusFilter }),
    placeholderData: keepPreviousData,
  })

  const tenants = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  function handleStatusChange(val: string) {
    setStatusFilter(val)
    setPage(1)
  }

  const columns: Column<(typeof tenants)[number]>[] = [
    {
      header: 'Business', width: 240, tooltip: t => `${t.name} · ${t.slug}`,
      cell: t => (
        <div>
          <p className="truncate font-medium text-notion-text">{t.name}</p>
          <p className="truncate font-mono text-xs text-notion-faint">{t.slug}</p>
        </div>
      ),
    },
    {
      header: 'Contact', width: 220, tooltip: t => `${t.email ?? '—'} ${t.phone ?? ''}`.trim(),
      cell: t => (
        <div>
          <p className="truncate text-notion-sub">{t.email ?? '—'}</p>
          <p className="truncate text-xs text-notion-faint">{t.phone ?? ''}</p>
        </div>
      ),
    },
    {
      header: 'Status', width: 140, truncate: false,
      cell: t => (
        <Badge variant={STATUS_VARIANT[t.subscriptionStatus] ?? 'default'}>
          {STATUS_LABEL[t.subscriptionStatus] ?? t.subscriptionStatus}
        </Badge>
      ),
    },
    {
      header: 'Joined', width: 130,
      cell: t => <span className="text-notion-sub">{new Date(t.createdAt).toLocaleDateString('en-IN')}</span>,
    },
    {
      id: 'view', header: '', width: 80, resizable: false, truncate: false, align: 'right',
      cell: () => <span className="text-xs text-notion-blue">View →</span>,
    },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Businesses"
        subtitle={`${total} total businesses on the platform`}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + New Business
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Input
              placeholder="Search by name, slug or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => handleStatusChange(e.target.value)}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <DataTable
          rows={tenants}
          rowKey={t => t.id}
          columns={columns}
          loading={isLoading}
          emptyMessage={(search || statusFilter) ? 'No businesses match the selected filters' : 'No businesses yet. Create the first one.'}
          onRowClick={t => router.push(`/businesses/${t.id}`)}
          pagination={{ page, totalPages, total, limit: LIMIT, onPageChange: setPage }}
        />
      </main>

      {/* Create business modal */}
      {showCreate && (
        <CreateBusinessModal
          onClose={() => setShowCreate(false)}
          onCreated={creds => { setShowCreate(false); setCreatedCreds(creds) }}
        />
      )}

      {/* Credentials card — shown once after business creation */}
      {createdCreds && (
        <CredentialsCard creds={createdCreds} onDone={() => setCreatedCreds(null)} />
      )}
    </div>
  )
}
