'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, Modal, PageLoader } from '@/shared/ui'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import { fetchDepartmentNameMap } from '@/features/departments/services/departments.api'
import type { Category, StatusFilter } from '../interfaces'
import { emptyCategory } from '../utils/constants'
import { fromEntity, toWriteDto } from '../utils/mapping'
import {
  createCategory, deleteCategory, getCategory, listCategories, updateCategory,
} from '../services/categories.api'
import { CategoriesGrid } from './CategoriesGrid'
import { CategoryFormModal, type FormMode } from './CategoryFormModal'

const LIMIT = 20
const QK = ['siteadmin', 'categories'] as const

export function CategoriesPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')

  const [form, setForm] = useState<{ category: Category; mode: FormMode } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => { setPage(1) }, [debouncedSearch, status])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch, status }],
    queryFn: () => listCategories({ page, limit: LIMIT, search: debouncedSearch, status }),
    placeholderData: keepPreviousData,
  })

  // Parent department names for the Department Name column + edit prefill.
  const { data: deptNameMap = {} } = useQuery({
    queryKey: ['siteadmin', 'department-name-map'],
    queryFn: fetchDepartmentNameMap,
    staleTime: 60_000,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const saveMut = useMutation({
    mutationFn: ({ category, mode }: { category: Category; mode: FormMode }) =>
      mode === 'create' ? createCategory(toWriteDto(category)) : updateCategory(category.id, toWriteDto(category)),
    onSuccess: () => { invalidate(); setForm(null) },
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) => updateCategory(id, { isActive: next }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { invalidate(); setConfirmDelete(null) },
  })

  const openForm = async (id: string, mode: 'edit' | 'view') => {
    try {
      const full = await getCategory(id)
      setForm({ category: fromEntity(full, (deptId) => deptNameMap[deptId] ?? deptId), mode })
    } catch { /* error toast handled globally */ }
  }

  const toggleStatus = (id: string) => {
    const row = rows.find((r) => r.id === id)
    if (row) toggleMut.mutate({ id, next: !row.isActive })
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Categories"
        subtitle="Global category templates available to every business"
        actions={
          <Button size="sm" onClick={() => setForm({ category: emptyCategory(), mode: 'create' })}>
            <PlusIcon className="h-3.5 w-3.5" /> Add Category
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
            <Input className="pl-8" placeholder="Search name / code…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {total} {total === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {isLoading ? (
          <Card><CardContent><PageLoader /></CardContent></Card>
        ) : (
          <CategoriesGrid
            rows={rows}
            startIndex={(page - 1) * LIMIT}
            loading={isFetching}
            deptNameMap={deptNameMap}
            onView={(id) => openForm(id, 'view')}
            onEdit={(id) => openForm(id, 'edit')}
            onDelete={(id) => setConfirmDelete(id)}
            onToggleStatus={toggleStatus}
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
        <CategoryFormModal
          category={form.category}
          mode={form.mode}
          saving={saveMut.isPending}
          onSave={(c) => saveMut.mutate({ category: c, mode: form.mode })}
          onClose={() => setForm(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          title="Delete Category?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={<>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMut.isPending}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete)}>Delete</Button>
          </>}
        >
          <p className="text-sm text-notion-sub">This will remove the category template. This action can be reversed only by a developer.</p>
        </Modal>
      )}
    </div>
  )
}
