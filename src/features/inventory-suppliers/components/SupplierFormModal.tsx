'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Toggle } from '@/shared/ui'
import { createSupplier, updateSupplier } from '../services/suppliers.api'
import type { ISupplier, ISupplierForm } from '../interfaces'

interface Props {
  supplier?: ISupplier | null
  onClose: () => void
}

function toForm(s?: ISupplier | null): ISupplierForm {
  return {
    company: s?.company ?? '',
    name: s?.name ?? '',
    email: s?.email ?? '',
    phone: s?.phone ?? '',
    address: s?.address ?? '',
    city: s?.city ?? '',
    state: s?.state ?? '',
    postalCode: s?.postalCode ?? '',
    country: s?.country ?? '',
    vatNo: s?.vatNo ?? '',
    isActive: s?.isActive ?? true,
  }
}

export function SupplierFormModal({ supplier, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = !!supplier
  const [form, setForm] = useState<ISupplierForm>(() => toForm(supplier))
  const [formError, setFormError] = useState('')

  const set = <K extends keyof ISupplierForm>(key: K, value: ISupplierForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const mutation = useMutation({
    mutationFn: (f: ISupplierForm) =>
      isEdit ? updateSupplier(supplier!.id, f) : createSupplier(f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'suppliers'] })
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('Name is required')
    mutation.mutate(form)
  }

  const busy = mutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
          <h2 className="text-sm font-semibold text-notion-text">
            {isEdit ? 'Edit Supplier' : 'Create Supplier'}
          </h2>
          <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Global Labware Co" disabled={busy} />
            <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="John Doe" disabled={busy} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="orders@supplier.com" disabled={busy} />
            <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" disabled={busy} />
            <div className="col-span-2">
              <Input label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="221B Baker Street" disabled={busy} />
            </div>
            <Input label="City" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" disabled={busy} />
            <Input label="State" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Maharashtra" disabled={busy} />
            <Input label="Postal Code" value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} placeholder="400001" disabled={busy} />
            <Input label="Country" value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="India" disabled={busy} />
            <Input label="VAT No" value={form.vatNo} onChange={(e) => set('vatNo', e.target.value)} placeholder="VAT123456" disabled={busy} />
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
            <Button type="submit" loading={busy}>
              {isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
