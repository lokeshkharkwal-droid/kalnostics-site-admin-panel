'use client'

import { Button } from '@/shared/ui'
import type { IConfirmDialogProps } from '../interfaces'

/** Generic confirm modal used for activate / deactivate actions. */
export function ConfirmDialog({
  title, message, confirmLabel, confirmVariant = 'primary', loading, onConfirm, onCancel,
}: IConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-notion-line bg-white shadow-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-notion-text">{title}</h2>
        <p className="text-sm text-notion-sub">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} size="sm" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
