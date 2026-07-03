'use client'

import { useState } from 'react'
import { Button, Input, Label, Modal, PaginatedSelect, Toggle } from '@/shared/ui'
import type { FormMode, State } from '../interfaces'
import { validateState } from '../utils/mapping'
import { fetchCountryOptionsPage } from '../services/locations.api'

/** Add / edit / view modal for a state (parent Country via PaginatedSelect). */
export function StateFormModal({
  state, mode, saving, onSave, onClose,
}: {
  state: State
  mode: FormMode
  saving: boolean
  onSave: (s: State) => void
  onClose: () => void
}) {
  const [data, setData] = useState<State>({ ...state })
  const [error, setError] = useState<string | null>(null)
  const readOnly = mode === 'view'

  const set = <K extends keyof State>(field: K, val: State[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  const submit = () => {
    const err = validateState(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  const title = mode === 'create' ? 'Add State' : mode === 'edit' ? 'Edit State' : 'State Details'

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
        <div className="flex flex-col gap-1">
          <Label>Country *</Label>
          <PaginatedSelect
            value={data.country}
            onChange={(opt) => set('country', opt)}
            queryKey={['siteadmin', 'country-options']}
            fetchPage={fetchCountryOptionsPage}
            placeholder="Select country"
            emptyText="No countries"
            disabled={readOnly}
          />
        </div>
        <Input label="State Name *" value={data.name} disabled={readOnly} onChange={(e) => set('name', e.target.value)} />
        <Input label="State Code *" value={data.code} disabled={readOnly} placeholder="e.g. MH" onChange={(e) => set('code', e.target.value)} />

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
