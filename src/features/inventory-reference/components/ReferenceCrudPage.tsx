'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import {
  Button,
  Input,
  Badge,
  PageLoader,
  Toggle,
  DataTable,
  PaginatedSelect,
  type Column,
  type SelectOption,
} from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import {
  listReference,
  fetchReferencePage,
  createReference,
  updateReference,
  deleteReference,
  type IReferenceRow,
} from '../services/reference.api'

/** Declarative config so one component powers all five reference lists. */
export interface ReferenceConfig {
  resource: string // e.g. 'categories'
  title: string
  singular: string // e.g. 'Category'
  withDescription?: boolean
  withRate?: boolean // tax-rates
  withCategory?: boolean // sub-categories (parent dropdown)
}

const LIMIT = 50

interface FormState {
  name: string
  code: string
  description: string
  rate: string
  categoryId: string
  isActive: boolean
}

function emptyForm(): FormState {
  return { name: '', code: '', description: '', rate: '', categoryId: '', isActive: true }
}

export function ReferenceCrudPage({ config }: { config: ReferenceConfig }) {
  const qc = useQueryClient()
  const key = ['inventory', 'reference', config.resource] as const
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<IReferenceRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<IReferenceRow | null>(null)

  const debounced = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debounced])

  const { data, isLoading } = useQuery({
    queryKey: [...key, { search: debounced, page }],
    queryFn: () => listReference(config.resource, { page, limit: LIMIT, search: debounced }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReference(config.resource, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      setConfirmDelete(null)
    },
  })

  const columns: Column<IReferenceRow>[] = [
    { header: 'Name', cell: (r) => r.name, width: 220 },
    { header: 'Code', cell: (r) => r.code ?? '—', width: 120 },
    ...(config.withCategory
      ? [{ header: 'Category', cell: (r: IReferenceRow) => r.category?.name ?? '—', width: 180 }]
      : []),
    ...(config.withRate
      ? [{ header: 'Rate %', cell: (r: IReferenceRow) => (r.rate != null ? String(r.rate) : '—'), width: 100 }]
      : []),
    {
      header: 'Status',
      truncate: false,
      cell: (r) => (
        <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
      width: 110,
    },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title={config.title}
        subtitle={`Canonical ${config.title.toLowerCase()} for the global inventory catalogue`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            + New {config.singular}
          </Button>
        }
      />

      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'item' : 'items'}
          </span>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage={`No ${config.title.toLowerCase()} yet`}
            actions={(r) => (
              <div className="flex gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(r)
                    setShowForm(true)
                  }}
                >
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(r)}>
                  Delete
                </Button>
              </div>
            )}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-notion-sub">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <ReferenceFormModal
          config={config}
          row={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: key })
            setShowForm(false)
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-notion-line bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-notion-text">Remove {config.singular}?</h2>
            <p className="text-sm text-notion-sub">
              Remove <strong>{confirmDelete.name}</strong>? Products already imported are not affected.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMutation.isPending}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(confirmDelete.id)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReferenceFormModal({
  config,
  row,
  onClose,
  onSaved,
}: {
  config: ReferenceConfig
  row: IReferenceRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!row
  const [form, setForm] = useState<FormState>(() => ({
    name: row?.name ?? '',
    code: row?.code ?? '',
    description: row?.description ?? '',
    rate: row?.rate != null ? String(row.rate) : '',
    categoryId: row?.categoryId ?? row?.category?.id ?? '',
    isActive: row?.isActive ?? true,
  }))
  const [formError, setFormError] = useState('')
  const [categoryOpt, setCategoryOpt] = useState<SelectOption | null>(
    row?.category ? { id: row.category.id, label: row.category.name } : null,
  )

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        isActive: form.isActive,
      }
      if (config.withDescription) body.description = form.description.trim() || undefined
      if (config.withRate) body.rate = form.rate.trim() === '' ? 0 : Number(form.rate)
      if (config.withCategory) body.categoryId = categoryOpt?.id
      return isEdit
        ? updateReference(config.resource, row!.id, body)
        : createReference(config.resource, body)
    },
    onSuccess: onSaved,
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('Name is required')
    if (config.withCategory && !categoryOpt) return setFormError('Parent category is required')
    mutation.mutate()
  }

  const busy = mutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
          <h2 className="text-sm font-semibold text-notion-text">
            {isEdit ? `Edit ${config.singular}` : `Create ${config.singular}`}
          </h2>
          <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {config.withCategory && (
            <div>
              <label className="mb-1 block text-xs font-medium text-notion-text">Parent category</label>
              <PaginatedSelect
                queryKey={['inventory', 'reference', 'categories', 'picker']}
                fetchPage={({ page, search, pageSize }) =>
                  fetchReferencePage('categories', { page, search, pageSize })
                }
                value={categoryOpt}
                onChange={setCategoryOpt}
                disabled={busy}
                placeholder="Select a category…"
              />
            </div>
          )}

          <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} disabled={busy} />
          <Input label="Code (optional)" value={form.code} onChange={(e) => set('code', e.target.value)} disabled={busy} />

          {config.withRate && (
            <Input
              label="Rate %"
              type="number"
              value={form.rate}
              onChange={(e) => set('rate', e.target.value)}
              placeholder="12"
              disabled={busy}
            />
          )}

          {config.withDescription && (
            <div>
              <label className="mb-1 block text-xs font-medium text-notion-text">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                disabled={busy}
                className="w-full rounded-md border border-notion-line2 bg-white px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-notion-text">
            <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} />
            Active
          </label>

          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
