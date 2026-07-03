'use client'

import { useState } from 'react'
import { Button, Input, Label, Modal, Toggle } from '@/shared/ui'
import type { Country, FormMode } from '../interfaces'
import { validateCountry } from '../utils/mapping'

/** Add / edit / view modal for a country. */
export function CountryFormModal({
  country, mode, saving, onSave, onClose,
}: {
  country: Country
  mode: FormMode
  saving: boolean
  onSave: (c: Country) => void
  onClose: () => void
}) {
  const [data, setData] = useState<Country>({ ...country })
  const [error, setError] = useState<string | null>(null)
  const readOnly = mode === 'view'

  const set = <K extends keyof Country>(field: K, val: Country[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  const submit = () => {
    const err = validateCountry(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  const title = mode === 'create' ? 'Add Country' : mode === 'edit' ? 'Edit Country' : 'Country Details'

  return (
    <Modal
      title={title}
      size="md"
      onClose={onClose}
      footer={readOnly ? (
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      ) : (
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={submit}>Save</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <Input label="Country Name *" value={data.name} disabled={readOnly} onChange={(e) => set('name', e.target.value)} />
        <Input label="Country Code *" value={data.code} disabled={readOnly} placeholder="e.g. IN" onChange={(e) => set('code', e.target.value)} />

        <div className="flex items-center gap-2">
          <Label>Status</Label>
          <Toggle checked={data.isActive} disabled={readOnly} onChange={(v) => set('isActive', v)} />
          <span className="text-xs text-notion-sub">{data.isActive ? 'Active' : 'Inactive'}</span>
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-notion-red">{error}</p>
        )}
      </div>
    </Modal>
  )
}
