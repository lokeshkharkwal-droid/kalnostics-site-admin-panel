'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, Modal, PageLoader } from '@/shared/ui'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import type { TestGroup } from '../interfaces'
import { emptyTestGroup } from '../utils/constants'
import { fromEntity, toWriteDto } from '../utils/mapping'
import {
  createTestGroup, deleteTestGroup, getTestGroup, listTestGroups, updateTestGroup,
} from '../services/test-groups.api'
import { TestGroupsGrid } from './TestGroupsGrid'
import { TestGroupFormModal, type FormMode } from './TestGroupFormModal'

const LIMIT = 20
const QK = ['siteadmin', 'test-groups'] as const

export function TestGroupsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState<{ testGroup: TestGroup; mode: FormMode } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch }],
    queryFn: () => listTestGroups({ page, limit: LIMIT, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const saveMut = useMutation({
    mutationFn: ({ testGroup, mode }: { testGroup: TestGroup; mode: FormMode }) =>
      mode === 'create' ? createTestGroup(toWriteDto(testGroup)) : updateTestGroup(testGroup.id, toWriteDto(testGroup)),
    onSuccess: () => { invalidate(); setForm(null) },
  })

  const deleteMut = useMutation({
    mutationFn: deleteTestGroup,
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const openForm = async (id: string, mode: 'edit' | 'view') => {
    try {
      const full = await getTestGroup(id)
      setForm({ testGroup: fromEntity(full), mode })
    } catch { /* error toast handled globally */ }
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Test Groups"
        subtitle="Global bundles of Site Admin lab tests"
        actions={
          <Button size="sm" onClick={() => setForm({ testGroup: emptyTestGroup(), mode: 'create' })}>
            <PlusIcon className="h-3.5 w-3.5" /> Add Test Group
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
            <Input className="pl-8" placeholder="Search group name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-notion-faint hover:text-notion-sub">
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'test group' : 'test groups'}
          </span>
        </div>

        {isLoading ? (
          <Card><CardContent><PageLoader /></CardContent></Card>
        ) : (
          <TestGroupsGrid
            rows={rows}
            startIndex={(page - 1) * LIMIT}
            loading={isFetching}
            onView={(id) => openForm(id, 'view')}
            onEdit={(id) => openForm(id, 'edit')}
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

      {/* Add / Edit / View form */}
      {form && (
        <TestGroupFormModal
          testGroup={form.testGroup}
          mode={form.mode}
          saving={saveMut.isPending}
          onSave={(g) => saveMut.mutate({ testGroup: g, mode: form.mode })}
          onClose={() => setForm(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          title="Delete Test Group?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This will remove the test group and all its lab-test mappings.</p>
        </Modal>
      )}
    </div>
  )
}
