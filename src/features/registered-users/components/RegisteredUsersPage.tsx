'use client'

import { useState, useEffect } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Card, CardContent, Button, Input, PageLoader } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { listRegisteredUsers } from '../services/registered-users.api'
import { RegisteredUsersTable } from './RegisteredUsersTable'
import { UserDetailsModal } from './UserDetailsModal'

const LIMIT = 20

export function RegisteredUsersPage() {
  const [viewId, setViewId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['siteadmin', 'registered-users', { search: debouncedSearch, status: statusFilter, page }],
    queryFn: () => listRegisteredUsers({ page, limit: LIMIT, search: debouncedSearch, status: statusFilter }),
    placeholderData: keepPreviousData,
  })

  const users = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Registered Users"
        subtitle="Every person registered across the Kalnostics portal"
      />

      <main className="flex-1 space-y-4 p-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search by username or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as 'active' | 'inactive' | ''); setPage(1) }}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'user' : 'users'}
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <PageLoader />
            ) : users.length === 0 ? (
              <div className="py-16 text-center text-sm text-notion-faint">
                {(search || statusFilter) ? 'No users match the selected filters' : 'No users found'}
              </div>
            ) : (
              <RegisteredUsersTable
                users={users}
                onView={user => setViewId(user.id)}
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

      {viewId && (
        <UserDetailsModal userId={viewId} onClose={() => setViewId(null)} />
      )}
    </div>
  )
}
