'use client'

/**
 * Listing screen for the Advance PDF Template module (Site Admin).
 *
 * Lists the global block-based templates Site Admin maintains. Data plumbing
 * goes through `services/advance-pdf.api`, which wraps the backend
 * `/siteadmin/pdf-report-templates` endpoints and adapts the entity shape
 * (`isActive` → `status`, `createdAt` → `created_on`, etc.).
 *
 * Built on the shared Site Admin listing architecture (AdminHeader + React Query
 * + DataTable + Modal + PdfPreviewOverlay), matching the other admin listing
 * pages such as PDF Templates.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import {
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  PageLoader,
  PdfPreviewOverlay,
  SelectField,
} from '@/shared/ui'
import { PlusIcon, SearchIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import {
  TEMPLATE_TYPES,
  listTemplates,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
  renderPdf,
  type AdvanceTemplateRow as AdvanceTemplate,
} from '../services/advance-pdf.api'
import { AdvancePdfGrid } from './AdvancePdfGrid'

const LIMIT = 20
const QK = ['siteadmin', 'advance-pdf-templates'] as const
const BASE_PATH = '/advance-pdf-templates'

const TYPE_OPTIONS = Object.entries(TEMPLATE_TYPES).map(([value, label]) => ({ value, label }))

/**
 * SiteAdmin list of block-based Advance PDF templates: search + type + status
 * filters, a paginated grid, and create / edit / duplicate / delete / preview.
 */
export function AdvancePdfTemplatesPage() {
  const qc = useQueryClient()
  const router = useRouter()

  // Filters + paging (client-side: the API returns the full set).
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, type, status])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: QK,
    queryFn: listTemplates,
    placeholderData: keepPreviousData,
  })
  const allRows = useMemo(() => data ?? [], [data])

  // In-memory filter + pagination over the fetched rows.
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return allRows.filter((r) => {
      if (type && r.type !== type) return false
      if (status && String(r.status) !== status) return false
      if (q && !r.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [allRows, debouncedSearch, type, status])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const startIndex = (page - 1) * LIMIT
  const pageRows = filtered.slice(startIndex, startIndex + LIMIT)

  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  // ── Create ────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createType, setCreateType] = useState('lab_report')

  const createMut = useMutation({
    mutationFn: () => createTemplate(createName.trim(), createType),
    onSuccess: (id) => {
      setCreateOpen(false)
      invalidate()
      if (id) router.push(`${BASE_PATH}/${id}`)
    },
  })

  // ── Edit (name + type only) ───────────────────────────────────────
  const [editRow, setEditRow] = useState<AdvanceTemplate | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('lab_report')

  const openEdit = (row: AdvanceTemplate) => {
    setEditRow(row)
    setEditName(row.name)
    setEditType(row.type)
  }

  const editMut = useMutation({
    mutationFn: () => updateTemplate(editRow!.id, editName.trim(), editType),
    onSuccess: () => {
      setEditRow(null)
      invalidate()
    },
  })

  // ── Duplicate ─────────────────────────────────────────────────────
  const duplicateMut = useMutation({
    mutationFn: (id: string) => duplicateTemplate(id),
    onSuccess: (id) => {
      invalidate()
      if (id) router.push(`${BASE_PATH}/${id}`)
    },
  })

  // ── Delete ────────────────────────────────────────────────────────
  const [confirmRow, setConfirmRow] = useState<AdvanceTemplate | null>(null)
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      invalidate()
      setConfirmRow(null)
    },
  })

  // ── Preview overlay (renders the template PDF against sample data) ──
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  // Revoke any outstanding blob URL when the page unmounts.
  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openPreview = async (row: AdvanceTemplate) => {
    setPreviewingId(row.id)
    try {
      const blob = await renderPdf(row.id)
      if (preview?.url) URL.revokeObjectURL(preview.url)
      setPreview({ url: URL.createObjectURL(blob), name: row.name })
    } catch {
      // The api interceptor surfaces the error toast; nothing more to do here.
    } finally {
      setPreviewingId(null)
    }
  }

  const closePreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
  }

  const hasFilters = Boolean(search || type || status)

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Advance PDF Templates"
        subtitle="Block-based PDF templates with full control over header, footer, fonts, colors and layout"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setCreateName('')
              setCreateType('lab_report')
              setCreateOpen(true)
            }}
          >
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
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Statuses</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
          {hasFilters && (
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
          <AdvancePdfGrid
            rows={pageRows}
            startIndex={startIndex}
            loading={isFetching}
            pagination={{ page, totalPages, total, limit: LIMIT, onPageChange: setPage }}
            previewingId={previewingId}
            duplicatingId={duplicateMut.isPending ? (duplicateMut.variables ?? null) : null}
            onPreview={openPreview}
            onOpenEditor={(id) => router.push(`${BASE_PATH}/${id}`)}
            onEdit={openEdit}
            onDuplicate={(id) => duplicateMut.mutate(id)}
            onDelete={(r) => setConfirmRow(r)}
          />
        )}
      </main>

      {/* New template */}
      {createOpen && (
        <Modal
          title="New Advance Template"
          size="sm"
          onClose={() => !createMut.isPending && setCreateOpen(false)}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCreateOpen(false)}
                disabled={createMut.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={createMut.isPending}
                disabled={!createName.trim()}
                onClick={() => createMut.mutate()}
              >
                Create
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Name"
              placeholder="e.g. Smart Health Report"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <SelectField
              label="Type"
              value={createType}
              options={TYPE_OPTIONS}
              onChange={setCreateType}
            />
          </div>
        </Modal>
      )}

      {/* Edit template (name + type only) */}
      {editRow && (
        <Modal
          title="Edit Template"
          size="sm"
          onClose={() => !editMut.isPending && setEditRow(null)}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditRow(null)}
                disabled={editMut.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                loading={editMut.isPending}
                disabled={!editName.trim()}
                onClick={() => editMut.mutate()}
              >
                Save
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Name"
              placeholder="e.g. Smart Health Report"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <SelectField
              label="Type"
              value={editType}
              options={TYPE_OPTIONS}
              onChange={setEditType}
            />
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmRow && (
        <Modal
          title="Delete template?"
          size="sm"
          onClose={() => !deleteMut.isPending && setConfirmRow(null)}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmRow(null)}
                disabled={deleteMut.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate(confirmRow.id)}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-notion-sub">
            &quot;{confirmRow.name}&quot; will be deleted. This action can be reversed only by a
            developer.
          </p>
        </Modal>
      )}

      {/* PDF preview overlay — full-screen viewer against sample data. */}
      {preview && (
        <PdfPreviewOverlay url={preview.url} name={preview.name} onClose={closePreview} />
      )}
    </div>
  )
}
