'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Badge, Button, DataTable, Input, PageLoader, type Column } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import { deleteProforma, listProformas, type IProforma } from '../services/proformas.api'
import { ProformaFormModal } from './ProformaFormModal'
import { ProformaDetailsModal } from './ProformaDetailsModal'

const LIMIT = 20

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

export function ProformasPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<IProforma | null>(null)
  const [viewing, setViewing] = useState<IProforma | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<IProforma | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'proformas', { search: debouncedSearch, page }],
    queryFn: () => listProformas({ page, limit: LIMIT, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: deleteProforma,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'proformas'] })
      setConfirmDelete(null)
    },
  })

  const columns: Column<IProforma>[] = [
    { header: 'Date', cell: (r) => formatDate(r.date), width: 130 },
    { header: 'Name', cell: (r) => r.name, width: 240 },
    { header: 'Items', cell: (r) => r._count?.items ?? r.items?.length ?? 0, width: 90 },
    {
      header: 'Status',
      truncate: false,
      cell: (r) => (
        <Badge variant={r.status === 'ACTIVE' ? 'success' : 'secondary'}>
          {r.status === 'ACTIVE' ? 'Active' : 'Inactive'}
        </Badge>
      ),
      width: 110,
    },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Proformas"
        subtitle="Reusable master proforma line-item templates"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            + New Proforma
          </Button>
        }
      />

      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-notion-faint hover:text-notion-sub">
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'proforma' : 'proformas'}
          </span>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage={search ? 'No proformas match your search' : 'No proformas yet'}
            actions={(r) => (
              // NOTE: EZHT's proforma list also had "Lab Test" and "Branch" row
              // actions. "Lab Test" is already covered by the in-form lab-test
              // line rows, and "Branch" is N/A at the SiteAdmin platform level
              // (platform-level proformas have no branches) — so we intentionally
              // do NOT add those two.
              <div className="flex gap-1.5">
                <Button variant="secondary" size="sm" onClick={() => setViewing(r)}>
                  View
                </Button>
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

      {showForm && <ProformaFormModal proforma={editing} onClose={() => setShowForm(false)} />}

      {viewing && <ProformaDetailsModal proforma={viewing} onClose={() => setViewing(null)} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-notion-line bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-notion-text">Remove Proforma?</h2>
            <p className="text-sm text-notion-sub">
              This removes <strong>{confirmDelete.name}</strong> from the catalogue.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMutation.isPending}>
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
