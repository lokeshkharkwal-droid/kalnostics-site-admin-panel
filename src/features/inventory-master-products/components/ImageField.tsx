'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui'
import { uploadMasterProductImage } from '../services/master-products.api'

/** Image MIME types accepted by the SiteAdmin image upload endpoint. */
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'

/**
 * "Upload image" button: picks a local image, uploads it to S3 via the SiteAdmin
 * upload endpoint (`POST /api/v1/siteadmin/uploads/attachment`, multipart `file`,
 * returns `{ url }`), and hands the resolved public URL back to the caller.
 */
function ImageUploadButton({
  label,
  onUploaded,
  disabled,
}: {
  label: string
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
      const { url } = await uploadMasterProductImage(file)
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

/**
 * Single-image field: shows a thumbnail preview with a Remove action, plus an
 * upload button that uploads to S3 and stores the returned public URL in
 * `imageUrl`.
 */
export function ImageField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-notion-sub">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="h-16 w-16 rounded-md border border-notion-line2 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-notion-line2 text-[10px] text-notion-faint">
            No image
          </div>
        )}
        <div className="flex items-center gap-2">
          <ImageUploadButton
            label={value ? 'Replace' : 'Upload'}
            onUploaded={onChange}
            disabled={disabled}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange('')}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Multi-image gallery field: a grid of thumbnails (each removable) plus an
 * upload button that uploads to S3 and appends the returned public URL to
 * `galleryImageUrls`.
 */
export function GalleryField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-notion-sub">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${label} ${i + 1}`}
              className="h-16 w-16 rounded-md border border-notion-line2 object-cover"
            />
            {!disabled && (
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-notion-line2 bg-white text-notion-faint shadow hover:text-notion-red"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        <div className="flex h-16 items-center">
          <ImageUploadButton
            label="Add image"
            onUploaded={(url) => onChange([...value, url])}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
