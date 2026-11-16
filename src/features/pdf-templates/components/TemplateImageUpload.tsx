'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui'
import { uploadTemplateImage } from '../services/pdf-templates.api'

/** Image MIME types accepted by the SiteAdmin template upload endpoint. */
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'

/**
 * "Add Image" button: picks a local image, uploads it to S3 via the SiteAdmin
 * upload endpoint, and hands the resolved public URL back to the caller (which
 * registers it in the template and produces a `{{image:<id>}}` token).
 */
export function TemplateImageUpload({
  label = 'Add Image',
  onUploaded,
  disabled,
}: {
  label?: string
  onUploaded: (url: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so re-picking the same file still fires onChange.
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const { url } = await uploadTemplateImage(file)
      onUploaded(url)
      toast.success('Image uploaded')
    } catch {
      /* error toast handled globally by the api interceptor */
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={busy}
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  )
}
