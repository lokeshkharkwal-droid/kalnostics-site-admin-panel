'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Card, CardContent, Button, Input, PageLoader } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { ROLE_LABEL, type SiteAdminRole, type SiteAdminUser } from '@/entities/siteadmin-user'
import { listAdmins, deactivateAdmin, activateAdmin } from '../services/admins.api'
import { AdminsTable } from './AdminsTable'
import { CreateAdminModal } from './CreateAdminModal'
import { ChangePasswordModal } from './ChangePasswordModal'
import { ConfirmDialog } from './ConfirmDialog'

const LIMIT = 20

export function AdminUsersPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [changePasswordFor, setChangePasswordFor] = useState<SiteAdminUser | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<SiteAdminUser | null>(null)
  const [confirmActivate, setConfirmActivate] = useState<SiteAdminUser | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<SiteAdminRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('')
  const [page, setPage] = useState(1)

  // Debounce the free-text search so we fire one request after typing settles,
  // not one per keystroke. Resetting to page 1 keeps results meaningful.
  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['siteadmin', 'users', { search: debouncedSearch, role: roleFilter, status: statusFilter, page }],
    queryFn: () => listAdmins({ page, limit: LIMIT, search: debouncedSearch, role: roleFilter, status: statusFilter }),
    placeholderData: keepPreviousData,
  })

  const admins = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'users'] })
      setConfirmDeactivate(null)
    },
    // Success and failure snackbars are handled globally by the api interceptor.
  })

  const activateMutation = useMutation({
    mutationFn: activateAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'users'] })
      setConfirmActivate(null)
    },
    // Success and failure snackbars are handled globally by the api interceptor.
  })

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Admin Users"
        subtitle="Manage SiteAdmin accounts and their role access"
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + New Admin
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value as SiteAdminRole | ''); setPage(1) }}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Roles</option>
            {(Object.keys(ROLE_LABEL) as SiteAdminRole[]).map(role => (
              <option key={role} value={role}>{ROLE_LABEL[role]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as 'active' | 'inactive' | ''); setPage(1) }}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
          {(search || roleFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setPage(1) }}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'account' : 'accounts'}
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <PageLoader />
            ) : admins.length === 0 ? (
              <div className="py-16 text-center text-sm text-notion-faint">
                {(search || roleFilter || statusFilter) ? 'No accounts match the selected filters' : 'No admin accounts found'}
              </div>
            ) : (
              <AdminsTable
                admins={admins}
                onChangePassword={setChangePasswordFor}
                onDeactivate={setConfirmDeactivate}
                onActivate={setConfirmActivate}
              />
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-notion-line px-5 py-3">
              <p className="text-xs text-notion-sub">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex gap-1.5">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  ← Prev
                </Button>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* Create admin modal */}
      {showCreate && <CreateAdminModal onClose={() => setShowCreate(false)} />}

      {/* Change password modal */}
      {changePasswordFor && (
        <ChangePasswordModal admin={changePasswordFor} onClose={() => setChangePasswordFor(null)} />
      )}

      {/* Deactivate confirmation modal */}
      {confirmDeactivate && (
        <ConfirmDialog
          title="Deactivate Admin Account?"
          message={
            <>
              This will revoke access for{' '}
              <strong>{confirmDeactivate.firstName} {confirmDeactivate.lastName}</strong>{' '}
              ({confirmDeactivate.email}). They will not be able to log in.
            </>
          }
          confirmLabel="Deactivate"
          confirmVariant="danger"
          loading={deactivateMutation.isPending}
          onConfirm={() => deactivateMutation.mutate(confirmDeactivate.id)}
          onCancel={() => setConfirmDeactivate(null)}
        />
      )}

      {/* Activate confirmation modal */}
      {confirmActivate && (
        <ConfirmDialog
          title="Activate Admin Account?"
          message={
            <>
              This will restore access for{' '}
              <strong>{confirmActivate.firstName} {confirmActivate.lastName}</strong>{' '}
              ({confirmActivate.email}). They will be able to log in again.
            </>
          }
          confirmLabel="Activate"
          confirmVariant="primary"
          loading={activateMutation.isPending}
          onConfirm={() => activateMutation.mutate(confirmActivate.id)}
          onCancel={() => setConfirmActivate(null)}
        />
      )}
    </div>
  )
}
