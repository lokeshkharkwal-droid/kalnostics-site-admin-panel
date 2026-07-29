'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, Modal, PageLoader } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import {
  deleteContactSubmission,
  listContactSubmissions,
} from '../services/contact-us.api'
import { CONTACT_PAGE_LIMIT } from '../utils/constants'
import {
  DATE_PRESET_OPTIONS,
  presetDateInputs,
  resolveDateRange,
  type DatePresetKey,
} from '../utils/date-presets'
import type { ContactSubmissionRow } from '../interfaces'
import { ContactUsTable } from './ContactUsTable'
import { ContactSubmissionModal } from './ContactSubmissionModal'

const QK = ['siteadmin', 'contact-us'] as const

const SELECT_CLASS =
  'h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue'

export function ContactUsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [datePreset, setDatePreset] = useState<DatePresetKey>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<ContactSubmissionRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search, 400)

  // Resolve the selected date preset (+ any picked dates) into from/to bounds.
  const { from, to } = useMemo(
    () => resolveDateRange(datePreset, dateFrom, dateTo),
    [datePreset, dateFrom, dateTo],
  )

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, from, to])

  const { data, isLoading } = useQuery({
    queryKey: [...QK, { search: debouncedSearch, from, to, page }],
    queryFn: () =>
      listContactSubmissions({
        page,
        limit: CONTACT_PAGE_LIMIT,
        search: debouncedSearch,
        from,
        to,
      }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMut = useMutation({
    mutationFn: deleteContactSubmission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK })
      setDeletingId(null)
    },
  })

  const dateInputs = presetDateInputs(datePreset)
  const hasFilters = !!search || datePreset !== 'ALL'

  function clearFilters() {
    setSearch('')
    setDatePreset('ALL')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Contact Us"
        subtitle="Contact form submissions from the Kalnostics website"
      />

      <main className="flex-1 space-y-4 p-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-96">
            <Input
              placeholder="Search by Name, Email, or Mobile"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            value={datePreset}
            onChange={e => {
              setDatePreset(e.target.value as DatePresetKey)
              setDateFrom('')
              setDateTo('')
            }}
            className={SELECT_CLASS}
          >
            {DATE_PRESET_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {dateInputs >= 1 && (
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className={SELECT_CLASS}
              aria-label={datePreset === 'RANGE' ? 'Start date' : 'Date'}
            />
          )}
          {dateInputs === 2 && (
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className={SELECT_CLASS}
              aria-label="End date"
            />
          )}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'submission' : 'submissions'}
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <PageLoader />
            ) : (
              <ContactUsTable
                rows={rows}
                startIndex={(page - 1) * CONTACT_PAGE_LIMIT}
                pagination={{
                  page,
                  totalPages,
                  total,
                  limit: CONTACT_PAGE_LIMIT,
                  onPageChange: setPage,
                }}
                onView={setViewing}
                onDelete={setDeletingId}
              />
            )}
          </CardContent>
        </Card>
      </main>

      {/* View detail */}
      {viewing && (
        <ContactSubmissionModal
          submission={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <Modal
          title="Delete Submission?"
          size="sm"
          onClose={() => setDeletingId(null)}
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeletingId(null)}
                disabled={deleteMut.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate(deletingId)}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-notion-sub">
            This contact submission will be removed from the list.
          </p>
        </Modal>
      )}
    </div>
  )
}
