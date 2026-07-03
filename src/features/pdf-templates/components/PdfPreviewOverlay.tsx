'use client'

import { Button } from '@/shared/ui'

/**
 * Full-screen PDF preview overlay. Renders a blob URL in an `<embed>` with a
 * Download link and a close button. The blob URL lifecycle (create / revoke) is
 * owned by the caller — this component is purely presentational.
 */
export function PdfPreviewOverlay({
  url,
  name,
  onClose,
}: {
  url: string
  name: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[1100] flex flex-col bg-black/70">
      <div className="flex items-center justify-between gap-3 bg-notion-text px-4 py-2.5 text-white">
        <span className="truncate text-sm font-medium">Preview — {name || 'Untitled'}</span>
        <div className="flex items-center gap-2">
          <a
            href={url}
            download={`${name || 'template'}.pdf`}
            className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25"
          >
            Download
          </a>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      <embed src={url} type="application/pdf" className="min-h-0 flex-1" />
    </div>
  )
}
