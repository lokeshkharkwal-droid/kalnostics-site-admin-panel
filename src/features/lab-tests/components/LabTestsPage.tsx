'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, PageLoader } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import type { LabTestListView } from '@/entities/lab-test'
import type { LabTest, StatusFilter } from '../interfaces'
import { emptyTest } from '../utils/constants'
import { fromEntity, toWriteDto } from '../utils/mapping'
import {
  createLabTest, deleteLabTest, getLabTest, listLabTests, updateLabTest,
} from '../services/lab-tests.api'
import { LabTestViewGrid } from './LabTestViewGrid'
import { LabTestFormModal } from './LabTestFormModal'
import { Modal } from './Modal'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from './icons'

const LIMIT = 20
const QK = ['siteadmin', 'lab-tests'] as const

export function LabTestsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [view, setView] = useState<LabTestListView>('DEFAULT')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')

  const [form, setForm] = useState<{ test: LabTest; isCreate: boolean } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch, status, view])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { view, page, search: debouncedSearch, status }],
    queryFn: () => listLabTests({ view, page, limit: LIMIT, search: debouncedSearch, status }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const dataView = data?.view ?? view
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const saveMut = useMutation({
    mutationFn: ({ test, isCreate }: { test: LabTest; isCreate: boolean }) =>
      isCreate ? createLabTest(toWriteDto(test)) : updateLabTest(test.id, toWriteDto(test)),
    onSuccess: () => { invalidate(); setForm(null) },
  })

  const toggleMut = useMutation({
    mutationFn: async (id: string) => {
      const full = await getLabTest(id)
      return updateLabTest(id, { isActive: !full.isActive })
    },
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: deleteLabTest,
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const openEdit = async (id: string) => {
    try {
      const full = await getLabTest(id)
      setForm({ test: fromEntity(full), isCreate: false })
    } catch { /* error toast handled globally */ }
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Lab Tests"
        subtitle="Global lab test templates available to every business"
        actions={
          <Button size="sm" onClick={() => setForm({ test: emptyTest(), isCreate: true })}>
            <PlusIcon className="h-3.5 w-3.5" /> Create Lab Test
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
            <Input className="pl-8" placeholder="Search test / code…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as StatusFilter)}
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
            {total} {total === 1 ? 'test' : 'tests'}
          </span>
        </div>

        {isLoading ? (
          <Card><CardContent><PageLoader /></CardContent></Card>
        ) : (
          <LabTestViewGrid
            view={view}
            dataView={dataView}
            onViewChange={setView}
            rows={rows}
            loading={isFetching}
            onEdit={openEdit}
            onToggleStatus={id => toggleMut.mutate(id)}
            onDelete={id => setConfirmDelete(id)}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-notion-sub">Page {page} of {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Add / Edit form */}
      {form && (
        <LabTestFormModal
          test={form.test}
          isCreate={form.isCreate}
          saving={saveMut.isPending}
          onSave={t => saveMut.mutate({ test: t, isCreate: form.isCreate })}
          onClose={() => setForm(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          title="Delete Lab Test?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This will remove the lab test template. This action can be reversed only by a developer.</p>
        </Modal>
      )}
    </div>
  )
}
