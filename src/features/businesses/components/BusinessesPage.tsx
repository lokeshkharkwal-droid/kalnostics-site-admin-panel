'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Input, Badge, DataTable, ActionMenu, Modal, type Column } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { STATUS_VARIANT, STATUS_LABEL, STATUS_OPTIONS } from '@/entities/tenant'
import { listTenants, suspendTenant, reactivateTenant } from '../services/businesses.api'
import type { ICreatedCredentials } from '../interfaces'
import { CreateBusinessModal } from './CreateBusinessModal'
import { CredentialsCard } from './CredentialsCard'
import { ConfigurationModal } from './ConfigurationModal'
import { SettingsModal } from './SettingsModal'

const LIMIT = 20

export function BusinessesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<ICreatedCredentials | null>(null)
  const [modal, setModal] = useState<{ tenantId: string; kind: 'config' | 'settings' } | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; name: string; action: 'suspend' | 'reactivate' } | null>(null)
  const queryClient = useQueryClient()

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

  // Suspend / reactivate a business, then refresh the list so the status badge
  // and the row's Actions menu (Suspend ↔ Reactivate) update.
  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'suspend' | 'reactivate' }) =>
      action === 'suspend' ? suspendTenant(id) : reactivateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
      setConfirm(null)
    },
  })

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
          actions={t => (
            <ActionMenu
              items={[
                { label: 'Edit', onClick: () => router.push(`/businesses/${t.id}?edit=1`) },
                { label: 'Configuration', onClick: () => setModal({ tenantId: t.id, kind: 'config' }) },
                { label: 'Settings', onClick: () => setModal({ tenantId: t.id, kind: 'settings' }) },
                t.subscriptionStatus === 'suspended'
                  ? { label: 'Reactivate', onClick: () => setConfirm({ id: t.id, name: t.name, action: 'reactivate' }) }
                  : { label: 'Suspend', variant: 'danger', onClick: () => setConfirm({ id: t.id, name: t.name, action: 'suspend' }) },
              ]}
            />
          )}
          actionsWidth={80}
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

      {/* Configuration / Settings modals — opened from a row's Actions menu */}
      {modal?.kind === 'config' && (
        <ConfigurationModal tenantId={modal.tenantId} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'settings' && (
        <SettingsModal tenantId={modal.tenantId} onClose={() => setModal(null)} />
      )}

      {/* Suspend / reactivate confirmation — opened from a row's Actions menu */}
      {confirm && (
        <Modal
          title={confirm.action === 'suspend' ? 'Suspend business?' : 'Reactivate business?'}
          size="sm"
          onClose={() => setConfirm(null)}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirm(null)}
                disabled={statusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={confirm.action === 'suspend' ? 'danger' : 'primary'}
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ id: confirm.id, action: confirm.action })}
              >
                {confirm.action === 'suspend' ? 'Suspend' : 'Reactivate'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-notion-sub">
            {confirm.action === 'suspend' ? (
              <>Suspending <span className="font-medium text-notion-text">{confirm.name}</span> will block access for this business until it is reactivated.</>
            ) : (
              <>Reactivating <span className="font-medium text-notion-text">{confirm.name}</span> will restore access for this business.</>
            )}
          </p>
        </Modal>
      )}
    </div>
  )
}
