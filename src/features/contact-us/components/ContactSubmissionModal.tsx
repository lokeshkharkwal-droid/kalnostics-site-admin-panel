'use client'

import { Button, Modal } from '@/shared/ui'
import type { ContactSubmissionRow } from '../interfaces'

/** A read-only label/value row. */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-notion-faint">{label}</span>
      <span className="text-sm text-notion-text">{value || '—'}</span>
    </div>
  )
}

/** Format an ISO timestamp as a locale-aware date + time. */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface ContactSubmissionModalProps {
  submission: ContactSubmissionRow
  onClose: () => void
}

/**
 * Read-only detail view of a single contact-us submission. Fed the in-hand list
 * row (which already carries the full `message`), so no extra fetch is needed.
 */
export function ContactSubmissionModal({
  submission,
  onClose,
}: ContactSubmissionModalProps) {
  return (
    <Modal
      title="Contact Submission"
      size="lg"
      onClose={onClose}
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" value={submission.name} />
          <Field label="Organization" value={submission.organization} />
          <Field label="Mobile" value={submission.mobileNumber} />
          <Field label="Email" value={submission.email} />
          <Field label="Created On" value={formatDateTime(submission.createdOn)} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-notion-faint">Message</span>
          <p className="whitespace-pre-wrap rounded-md border border-notion-line bg-notion-panel px-3 py-2 text-sm text-notion-text">
            {submission.message || '—'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
