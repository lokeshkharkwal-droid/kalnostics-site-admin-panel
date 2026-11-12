'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Input, Badge, PageLoader, DataTable, type Column } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { listSuppliers, deleteSupplier } from '../services/suppliers.api'
import type { ISupplier } from '../interfaces'
import { SupplierFormModal } from './SupplierFormModal'

const LIMIT = 20

export function SuppliersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ISupplier | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ISupplier | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'suppliers', { search: debouncedSearch, page }],
    queryFn: () => listSuppliers({ page, limit: LIMIT, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'suppliers'] })
      setConfirmDelete(null)
    },
  })

  const columns: Column<ISupplier>[] = [
    { header: 'Company', cell: (r) => r.company ?? '—', width: 200 },
    { header: 'Name', cell: (r) => r.name, width: 160 },
    { header: 'Email', cell: (r) => r.email ?? '—', width: 180 },
    { header: 'Phone', cell: (r) => r.phone ?? '—', width: 140 },
    {
      header: 'Status',
      truncate: false,
      cell: (r) => (
        <Badge variant={r.isActive ? 'success' : 'secondary'}>
          {r.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
      width: 100,
    },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Inventory Suppliers"
        subtitle="Global supplier catalogue tenants reference in their inventory"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            + New Supplier
          </Button>
        }
      />

      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Input
              placeholder="Search by company, name or email…"
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
            {total} {total === 1 ? 'supplier' : 'suppliers'}
          </span>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage={search ? 'No suppliers match your search' : 'No suppliers yet'}
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
        <SupplierFormModal supplier={editing} onClose={() => setShowForm(false)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-notion-line bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-notion-text">Remove Supplier?</h2>
            <p className="text-sm text-notion-sub">
              This removes <strong>{confirmDelete.name}</strong> from the global catalogue.
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
