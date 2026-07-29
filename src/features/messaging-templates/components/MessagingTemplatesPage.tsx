'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, Modal, PageLoader } from '@/shared/ui'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from '@/shared/ui/icons'
import { useDebouncedValue } from '@/shared/hooks'
import type { ListTemplatesParams, MessagingChannel } from '../interfaces'
import { deleteTemplate, duplicateTemplate, listTemplates } from '../services/messaging-templates.api'
import { PREFERENCE_OPTIONS } from '../utils/constants'
import { MessagingTemplatesGrid } from './MessagingTemplatesGrid'

const LIMIT = 20
const QK = ['siteadmin', 'messaging-templates'] as const

/**
 * SiteAdmin list of global messaging/notification templates: search + channel +
 * status filters, paginated grid, and create / edit / duplicate / delete.
 */
export function MessagingTemplatesPage() {
  const qc = useQueryClient()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [preference, setPreference] = useState<MessagingChannel | ''>('')
  const [status, setStatus] = useState<ListTemplatesParams['isActive']>('')

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, preference, status])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QK, { page, search: debouncedSearch, preference, status }],
    queryFn: () =>
      listTemplates({ page, limit: LIMIT, search: debouncedSearch, preference, isActive: status }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => qc.invalidateQueries({ queryKey: QK })

  const deleteMut = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      invalidate()
      setConfirmDelete(null)
    },
  })

  const duplicateMut = useMutation({
    mutationFn: duplicateTemplate,
    onSuccess: invalidate,
  })

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Messaging Templates"
        subtitle="Global notification templates available to every business"
        actions={
          <Button size="sm" onClick={() => router.push('/messaging-templates/new')}>
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
              placeholder="Search title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={preference}
            onChange={(e) => setPreference(e.target.value as MessagingChannel | '')}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Channels</option>
            {PREFERENCE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ListTemplatesParams['isActive'])}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          {(search || preference || status) && (
            <button
              onClick={() => {
                setSearch('')
                setPreference('')
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
          <MessagingTemplatesGrid
            rows={rows}
            startIndex={(page - 1) * LIMIT}
            loading={isFetching}
            duplicatingId={duplicateMut.isPending ? (duplicateMut.variables ?? null) : null}
            onEdit={(id) => router.push(`/messaging-templates/${id}`)}
            onDuplicate={(id) => duplicateMut.mutate(id)}
            onDelete={(id) => setConfirmDelete(id)}
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
            This will remove the messaging template. This action can be reversed only by a developer.
          </p>
        </Modal>
      )}
    </div>
  )
}
