'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Input, Badge, PageLoader, DataTable, type Column } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import {
  listMasterProducts,
  deleteMasterProduct,
} from '../services/master-products.api'
import type { IMasterProduct } from '../interfaces'
import { MasterProductFormModal } from './MasterProductFormModal'

const LIMIT = 20

export function MasterProductsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<IMasterProduct | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<IMasterProduct | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'master-products', { search: debouncedSearch, page }],
    queryFn: () => listMasterProducts({ page, limit: LIMIT, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: deleteMasterProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'master-products'] })
      setConfirmDelete(null)
    },
  })

  const money = (v: number | null) => (v == null ? '—' : v.toFixed(2))

  const columns: Column<IMasterProduct>[] = [
    { header: 'Code', cell: (r) => r.code ?? '—', width: 120 },
    { header: 'Name', cell: (r) => r.name, width: 200 },
    { header: 'Category', cell: (r) => r.category ?? '—', width: 130 },
    { header: 'Sub-cat', cell: (r) => r.subCategory ?? '—', width: 120 },
    { header: 'Unit', cell: (r) => r.unit ?? '—', width: 90 },
    { header: 'Brand', cell: (r) => r.brand ?? '—', width: 110 },
    { header: 'Cost', cell: (r) => money(r.cost), width: 80 },
    { header: 'Price', cell: (r) => money(r.price), width: 80 },
    { header: 'Tax', cell: (r) => (r.taxName ? `${r.taxName}` : '—'), width: 100 },
    {
      header: 'Importable',
      truncate: false,
      cell: (r) => (
        <Badge variant={r.isImportable && r.isActive ? 'success' : 'secondary'}>
          {r.isImportable && r.isActive ? 'Yes' : 'No'}
        </Badge>
      ),
      width: 100,
    },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Inventory Master Products"
        subtitle="Global catalogue tenants import into their own inventory"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            + New Master Product
          </Button>
        }
      />

      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Input
              placeholder="Search by name, code or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'product' : 'products'}
          </span>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage={search ? 'No master products match your search' : 'No master products yet'}
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
        <MasterProductFormModal product={editing} onClose={() => setShowForm(false)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-notion-line bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-notion-text">Remove Master Product?</h2>
            <p className="text-sm text-notion-sub">
              This removes <strong>{confirmDelete.name}</strong> from the global catalogue. Products
              tenants already imported are not affected.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
