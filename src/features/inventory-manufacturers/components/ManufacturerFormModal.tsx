'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button, Input, Toggle, TextArea } from '@/shared/ui'
import { uploadSiteAdminImage } from '@/shared/services/siteadmin-uploads'
import { createManufacturer, updateManufacturer } from '../services/manufacturers.api'
import type { IManufacturer, IManufacturerForm } from '../interfaces'

interface Props {
  manufacturer?: IManufacturer | null
  onClose: () => void
}

const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml'

function toForm(m?: IManufacturer | null): IManufacturerForm {
  return {
    logoUrl: m?.logoUrl ?? '',
    company: m?.company ?? '',
    name: m?.name ?? '',
    vatNo: m?.vatNo ?? '',
    email: m?.email ?? '',
    phone: m?.phone ?? '',
    address: m?.address ?? '',
    city: m?.city ?? '',
    state: m?.state ?? '',
    postalCode: m?.postalCode ?? '',
    country: m?.country ?? '',
    invoiceFooter: m?.invoiceFooter ?? '',
    cf1: m?.cf1 ?? '',
    cf2: m?.cf2 ?? '',
    cf3: m?.cf3 ?? '',
    cf4: m?.cf4 ?? '',
    cf5: m?.cf5 ?? '',
    cf6: m?.cf6 ?? '',
    isActive: m?.isActive ?? true,
  }
}

export function ManufacturerFormModal({ manufacturer, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = !!manufacturer
  const [form, setForm] = useState<IManufacturerForm>(() => toForm(manufacturer))
  const [formError, setFormError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof IManufacturerForm>(key: K, value: IManufacturerForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const mutation = useMutation({
    mutationFn: (f: IManufacturerForm) =>
      isEdit ? updateManufacturer(manufacturer!.id, f) : createManufacturer(f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'manufacturers'] })
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadSiteAdminImage(file)
      set('logoUrl', url)
      toast.success('Logo uploaded')
    } catch {
      /* error toast handled globally by the api interceptor */
    } finally {
      setUploading(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.company.trim()) return setFormError('Company is required')
    if (!form.name.trim()) return setFormError('Name is required')
    mutation.mutate(form)
  }

  const busy = mutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
          <h2 className="text-sm font-semibold text-notion-text">
            {isEdit ? 'Edit Manufacturer' : 'Create Manufacturer'}
          </h2>
          <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-notion-line2 bg-notion-panel">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-notion-faint">No logo</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-notion-text">Logo</label>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={onPickLogo} />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={uploading}
                  disabled={busy || uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {form.logoUrl ? 'Replace Image' : 'Upload Image'}
                </Button>
                {form.logoUrl && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={busy || uploading}
                    onClick={() => set('logoUrl', '')}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Company" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Acme Diagnostics Pvt Ltd" disabled={busy} />
            <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme" disabled={busy} />
            <Input label="VAT No" value={form.vatNo} onChange={(e) => set('vatNo', e.target.value)} placeholder="VAT123456" disabled={busy} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="sales@acme.com" disabled={busy} />
            <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" disabled={busy} />
            <Input label="Country" value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="India" disabled={busy} />
            <div className="col-span-2">
              <Input label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="221B Baker Street" disabled={busy} />
            </div>
            <Input label="City" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" disabled={busy} />
            <Input label="State" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Maharashtra" disabled={busy} />
            <Input label="Postal Code" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} placeholder="400001" disabled={busy} />
          </div>

          <TextArea
            label="Invoice Footer"
            value={form.invoiceFooter}
            onChange={(e) => set('invoiceFooter', e.target.value)}
            disabled={busy}
            rows={2}
            placeholder="Text shown at the bottom of invoices…"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Manufacturer Custom Field 1" value={form.cf1} onChange={(e) => set('cf1', e.target.value)} disabled={busy} />
            <Input label="Manufacturer Custom Field 2" value={form.cf2} onChange={(e) => set('cf2', e.target.value)} disabled={busy} />
            <Input label="Manufacturer Custom Field 3" value={form.cf3} onChange={(e) => set('cf3', e.target.value)} disabled={busy} />
            <Input label="Manufacturer Custom Field 4" value={form.cf4} onChange={(e) => set('cf4', e.target.value)} disabled={busy} />
            <Input label="Manufacturer Custom Field 5" value={form.cf5} onChange={(e) => set('cf5', e.target.value)} disabled={busy} />
            <Input label="Manufacturer Custom Field 6" value={form.cf6} onChange={(e) => set('cf6', e.target.value)} disabled={busy} />
          </div>

          <label className="flex items-center gap-2 text-sm text-notion-text">
            <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} />
            Active
          </label>

          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} disabled={uploading}>
              {isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
