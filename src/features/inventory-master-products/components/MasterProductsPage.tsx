'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Input, Badge, PageLoader, DataTable, ActionMenu, type Column } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import {
  listMasterProducts,
  getMasterProduct,
  deleteMasterProduct,
  duplicateMasterProduct,
} from '../services/master-products.api'
import type { IMasterProduct } from '../interfaces'
import { MasterProductFormModal } from './MasterProductFormModal'
import { DrugsModal } from './DrugsModal'

const LIMIT = 20

/** Open the (stubbed) barcode/label print page for a product. */
const printHref = (id: string) => `/inventory-print-barcode?product=${id}`

export function MasterProductsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Form modal state. `editingId` triggers a detail fetch for hydration.
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<IMasterProduct | null>(null)
  const [previewImage, setPreviewImage] = useState<IMasterProduct | null>(null)
  const [drugsProduct, setDrugsProduct] = useState<IMasterProduct | null>(null)

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

  // Detail fetch for edit (hydrates nested variants/suppliers/combo items).
  const detailQuery = useQuery({
    queryKey: ['inventory', 'master-products', 'detail', editingId],
    queryFn: () => getMasterProduct(editingId!),
    enabled: showForm && !!editingId,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMasterProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'master-products'] })
      setConfirmDelete(null)
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: duplicateMasterProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory', 'master-products'] }),
  })

  const money = (v: number | null) => (v == null ? '—' : v.toFixed(2))

  function openCreate() {
    setEditingId(null)
    setShowForm(true)
  }
  function openEdit(r: IMasterProduct) {
    setEditingId(r.id)
    setShowForm(true)
  }
  function closeForm() {
    setShowForm(false)
    setEditingId(null)
  }

  const columns: Column<IMasterProduct>[] = [
    {
      header: 'Image',
      truncate: false,
      width: 64,
      resizable: false,
      cell: (r) =>
        r.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.imageUrl}
            alt={r.name}
            className="h-9 w-9 rounded-md border border-notion-line2 object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-notion-line2 text-[9px] text-notion-faint">
            —
          </div>
        ),
    },
    { header: 'Code', cell: (r) => r.code ?? '—', width: 120 },
    { header: 'Name', cell: (r) => r.name, width: 200 },
    { header: 'Category', cell: (r) => r.categoryName ?? '—', width: 140 },
    { header: 'Cost', align: 'right', cell: (r) => money(r.cost), width: 90 },
    { header: 'Price', align: 'right', cell: (r) => money(r.price), width: 90 },
    { header: 'Unit', cell: (r) => r.unitName ?? '—', width: 90 },
    { header: 'Alert Qty', align: 'right', cell: (r) => (r.alertQuantity == null ? '—' : r.alertQuantity), width: 90 },
    {
      header: 'Import Status',
      truncate: false,
      width: 110,
      cell: (r) => (
        <Badge variant={r.isImportable && r.isActive ? 'success' : 'secondary'}>
          {r.isImportable && r.isActive ? 'Importable' : 'Hidden'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Master Products"
        subtitle="Global inventory catalogue tenants import into their own inventory"
        actions={
          <Button size="sm" onClick={openCreate}>
            + Add product
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
            actionsWidth={120}
            emptyMessage={
              search ? 'No master products match your search' : 'No master products yet'
            }
            actions={(r) => (
              <ActionMenu
                items={[
                  { label: 'Edit', onClick: () => openEdit(r) },
                  { label: 'Drugs', onClick: () => setDrugsProduct(r) },
                  {
                    label: 'Duplicate',
                    onClick: () => duplicateMutation.mutate(r.id),
                  },
                  {
                    label: 'View image',
                    onClick: () => setPreviewImage(r),
                  },
                  {
                    label: 'Print barcode',
                    onClick: () => window.open(printHref(r.id), '_blank'),
                  },
                  {
                    label: 'Print label',
                    onClick: () => window.open(printHref(r.id), '_blank'),
                  },
                  { label: 'Delete', variant: 'danger', onClick: () => setConfirmDelete(r) },
                ]}
              />
            )}
            pagination={{
              page,
              totalPages,
              total,
              limit: LIMIT,
              onPageChange: setPage,
            }}
          />
        )}
      </main>

      {showForm && (
        <MasterProductFormModal
          product={editingId ? detailQuery.data ?? null : null}
          loading={!!editingId && detailQuery.isLoading}
          onClose={closeForm}
        />
      )}

      {drugsProduct && (
        <DrugsModal product={drugsProduct} onClose={() => setDrugsProduct(null)} />
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

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-xl border border-notion-line bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-notion-line px-5 py-3">
              <h2 className="truncate text-sm font-semibold text-notion-text">{previewImage.name}</h2>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-notion-faint hover:text-notion-sub"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 p-5">
              {previewImage.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImage.imageUrl}
                  alt={previewImage.name}
                  className="max-h-[50vh] rounded-md border border-notion-line2 object-contain"
                />
              ) : (
                <p className="py-10 text-sm text-notion-faint">No product image.</p>
              )}
              {previewImage.galleryImageUrls.length > 0 && (
                <div className="flex w-full flex-wrap gap-2">
                  {previewImage.galleryImageUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${url}-${i}`}
                      src={url}
                      alt={`${previewImage.name} ${i + 1}`}
                      className="h-16 w-16 rounded-md border border-notion-line2 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
