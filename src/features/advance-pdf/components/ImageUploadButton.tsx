'use client'

import { useRef, useState } from 'react'
import { uploadImage } from '../services/advance-pdf.api'

/**
 * One-shot image picker for the Advance PDF editor.
 *
 * Renders a button that triggers a hidden file input. On select, the file is
 * turned into a base64 data URI (see `uploadImage`) and returned via
 * `onUploaded` — the URL is pasted back into the parent's `src` / `image`
 * field and resolves in both the preview iframe and the Puppeteer PDF.
 *
 * Errors surface via the `onError` callback so the caller can toast them —
 * keeping this component context-free (no `useToast`) lets it mount anywhere.
 */
export function ImageUploadButton({
  label = 'Upload',
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  onUploaded,
  onError,
  disabled,
}: {
  label?: string
  accept?: string
  onUploaded: (url: string) => void
  onError?: (msg: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const url = await uploadImage(file)
      onUploaded(url)
    } catch (err) {
      onError?.((err as Error)?.message ?? 'Upload failed')
    } finally {
      setBusy(false)
      // Allow re-uploading the same file.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy || disabled}
        className="h-7 px-2 text-[11px] rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 inline-flex items-center gap-1 shrink-0"
      >
        {busy ? '…' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </>
  )
}
