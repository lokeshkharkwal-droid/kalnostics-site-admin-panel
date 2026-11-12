'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Input, Badge, PageLoader, DataTable, type Column } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { listManufacturers, deleteManufacturer } from '../services/manufacturers.api'
import type { IManufacturer } from '../interfaces'
import { ManufacturerFormModal } from './ManufacturerFormModal'

const LIMIT = 20

export function ManufacturersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<IManufacturer | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<IManufacturer | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'manufacturers', { search: debouncedSearch, page }],
    queryFn: () => listManufacturers({ page, limit: LIMIT, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: deleteManufacturer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'manufacturers'] })
      setConfirmDelete(null)
    },
  })

  const columns: Column<IManufacturer>[] = [
    {
      header: 'Logo',
      truncate: false,
      cell: (r) =>
        r.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.logoUrl}
            alt={r.company}
            className="h-8 w-8 rounded border border-notion-line2 object-contain"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded border border-notion-line2 bg-notion-panel text-[10px] text-notion-faint">
            —
          </span>
        ),
      width: 70,
    },
    { header: 'Company', cell: (r) => r.company, width: 200 },
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
        title="Inventory Manufacturers"
        subtitle="Global manufacturer catalogue tenants reference in their inventory"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            + New Manufacturer
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
            {total} {total === 1 ? 'manufacturer' : 'manufacturers'}
          </span>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage={search ? 'No manufacturers match your search' : 'No manufacturers yet'}
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
        <ManufacturerFormModal manufacturer={editing} onClose={() => setShowForm(false)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-notion-line bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-notion-text">Remove Manufacturer?</h2>
            <p className="text-sm text-notion-sub">
              This removes <strong>{confirmDelete.company}</strong> from the global catalogue.
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
