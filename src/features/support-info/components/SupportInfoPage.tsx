'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, Modal, PageLoader } from '@/shared/ui'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import type { StatusFilter } from '../interfaces'
import { deleteSupportInfo, listSupportInfo } from '../services/support-info.api'
import { SupportInfoGrid } from './SupportInfoGrid'

const LIMIT = 20
const QK = ['siteadmin', 'support-info'] as const
const BASE_PATH = '/support/support-information'

/** Support Information listing page (table + filters + row actions). */
export function SupportInfoPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch, status])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch, status }],
    queryFn: () => listSupportInfo({ page, limit: LIMIT, search: debouncedSearch, status }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMut = useMutation({
    mutationFn: deleteSupportInfo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK })
      setConfirmDelete(null)
    },
  })

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Support Information"
        subtitle="Help content shown across business and branch screens"
        actions={
          <Button size="sm" onClick={() => router.push(`${BASE_PATH}/new`)}>
            <PlusIcon className="h-3.5 w-3.5" /> Add Support Info
          </Button>
        }
      />

      <main className="flex-1 space-y-4 p-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-notion-faint">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input className="pl-8" placeholder="Search meta type / code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {(search || status) && (
            <button onClick={() => { setSearch(''); setStatus('') }} className="text-xs text-notion-faint hover:text-notion-sub">
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'record' : 'records'}
          </span>
        </div>

        {isLoading ? (
          <Card><CardContent><PageLoader /></CardContent></Card>
        ) : (
          <SupportInfoGrid
            rows={rows}
            startIndex={(page - 1) * LIMIT}
            loading={isFetching}
            onView={(id) => router.push(`${BASE_PATH}/${id}?mode=view`)}
            onEdit={(id) => router.push(`${BASE_PATH}/${id}`)}
            onDelete={(id) => setConfirmDelete(id)}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-notion-sub">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          title="Delete Support Information?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This will remove the support-information record. This action can be reversed only by a developer.</p>
        </Modal>
      )}
    </div>
  )
}
