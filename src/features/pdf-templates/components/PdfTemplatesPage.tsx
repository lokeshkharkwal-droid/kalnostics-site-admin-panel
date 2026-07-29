'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, Modal, PageLoader, PdfPreviewOverlay } from '@/shared/ui'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import type { StatusFilter } from '../interfaces'
import {
  deleteTemplate,
  fetchTemplateTypes,
  generatePreview,
  listTemplates,
  updateTemplate,
} from '../services/pdf-templates.api'
import { PdfTemplatesGrid } from './PdfTemplatesGrid'

const LIMIT = 20
const QK = ['siteadmin', 'pdf-templates'] as const

export function PdfTemplatesPage() {
  const qc = useQueryClient()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, type, status])

  // Revoke any outstanding blob URL when the page unmounts.
  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch, type, status }],
    queryFn: () => listTemplates({ page, limit: LIMIT, search: debouncedSearch, type, status }),
    placeholderData: keepPreviousData,
  })

  const { data: typeData } = useQuery({
    queryKey: ['siteadmin', 'pdf-template-types'],
    queryFn: fetchTemplateTypes,
    staleTime: 60_000,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const typeLabels = typeData?.labels ?? {}
  const typeOptions = typeData?.types ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const toggleMut = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      updateTemplate(id, { isActive: next }),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      invalidate()
      setConfirmDelete(null)
    },
  })

  const toggleStatus = (id: string) => {
    const row = rows.find((r) => r.id === id)
    if (row) toggleMut.mutate({ id, next: !row.isActive })
  }

  const openPreview = async (id: string) => {
    const row = rows.find((r) => r.id === id)
    setPreviewingId(id)
    try {
      const blob = await generatePreview(id)
      if (preview?.url) URL.revokeObjectURL(preview.url)
      setPreview({ url: URL.createObjectURL(blob), name: row?.name ?? 'template' })
    } catch {
      /* error toast handled globally */
    } finally {
      setPreviewingId(null)
    }
  }

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="PDF Templates"
        subtitle="Global PDF report templates available to every business"
        actions={
          <Button size="sm" onClick={() => router.push('/pdf-templates/new')}>
            <PlusIcon className="h-3.5 w-3.5" /> New Template
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
            <Input
              className="pl-8"
              placeholder="Search name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {typeLabels[t] ?? t}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {(search || type || status) && (
            <button
              onClick={() => {
                setSearch('')
                setType('')
                setStatus('')
              }}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'template' : 'templates'}
          </span>
        </div>

        {isLoading ? (
          <Card>
            <CardContent>
              <PageLoader />
            </CardContent>
          </Card>
        ) : (
          <PdfTemplatesGrid
            rows={rows}
            startIndex={(page - 1) * LIMIT}
            loading={isFetching}
            typeLabels={typeLabels}
            previewingId={previewingId}
            onPreview={openPreview}
            onEdit={(id) => router.push(`/pdf-templates/${id}`)}
            onDelete={(id) => setConfirmDelete(id)}
            onToggleStatus={toggleStatus}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-notion-sub">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal
          title="Delete Template?"
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMut.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate(confirmDelete)}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-notion-sub">
            This will remove the PDF report template. This action can be reversed only by a
            developer.
          </p>
        </Modal>
      )}

      {/* PDF preview overlay */}
      {preview && (
        <PdfPreviewOverlay url={preview.url} name={preview.name} onClose={closePreview} />
      )}
    </div>
  )
}
