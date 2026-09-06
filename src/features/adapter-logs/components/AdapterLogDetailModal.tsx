'use client'

import { Badge, Modal } from '@/shared/ui'
import type { AdapterLogRecord } from '../interfaces'
import {
  ACTION_LABELS,
  ACTION_VARIANT,
  formatPayload,
  statusVariant,
} from '../utils/constants'

interface AdapterLogDetailModalProps {
  log: AdapterLogRecord
  onClose: () => void
}

/**
 * Detail modal for a single adapter-log entry. Fields mirror the legacy
 * Kalnostic Kitchen screen: Request, Response, Action, Status Code and Source
 * IP Address.
 */
export function AdapterLogDetailModal({ log, onClose }: AdapterLogDetailModalProps) {
  return (
    <Modal title="Adapter Log Detail" onClose={onClose} size="lg">
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={ACTION_VARIANT[log.action] ?? 'default'}>
            {ACTION_LABELS[log.action] ?? log.action}
          </Badge>
          {log.status && (
            <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Action" value={ACTION_LABELS[log.action] ?? log.action} />
          <Field
            label="Status Code"
            value={log.statusCode != null ? String(log.statusCode) : '—'}
          />
          <Field label="Source IP Address" value={log.sourceIpAddress || '—'} />
          {log.tenantName && <Field label="Business" value={log.tenantName} />}
        </div>

        <div className="border-t border-notion-line pt-3">
          <p className="mb-1 text-xs text-notion-faint">Request</p>
          <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all rounded bg-notion-hover p-2 text-xs text-notion-sub">
            {formatPayload(log.request)}
          </pre>
        </div>
        <div>
          <p className="mb-1 text-xs text-notion-faint">Response</p>
          <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all rounded bg-notion-hover p-2 text-xs text-notion-sub">
            {formatPayload(log.response)}
          </pre>
        </div>
      </div>
    </Modal>
  )
}

/** A single labelled read-only field in the detail grid. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-notion-faint">{label}</p>
      <p className="mt-0.5 break-all font-medium text-notion-text">{value}</p>
    </div>
  )
}
