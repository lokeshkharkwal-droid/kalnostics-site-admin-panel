'use client'

import { useState } from 'react'
import { Button, Input, Label, Modal, PaginatedSelect, Toggle } from '@/shared/ui'
import type { City, FormMode } from '../interfaces'
import { validateCity } from '../utils/mapping'
import { fetchCountryOptionsPage, fetchStateOptionsPage } from '../services/locations.api'

/** Add / edit / view modal for a city. Country → State cascade (choosing a
 *  country clears the state so only that country's states are selectable). */
export function CityFormModal({
  city, mode, saving, onSave, onClose,
}: {
  city: City
  mode: FormMode
  saving: boolean
  onSave: (c: City) => void
  onClose: () => void
}) {
  const [data, setData] = useState<City>({ ...city })
  const [error, setError] = useState<string | null>(null)
  const readOnly = mode === 'view'

  const set = <K extends keyof City>(field: K, val: City[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  const submit = () => {
    const err = validateCity(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  const title = mode === 'create' ? 'Add City' : mode === 'edit' ? 'Edit City' : 'City Details'

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
            onChange={(opt) => setData((prev) => ({ ...prev, country: opt, state: null }))}
            queryKey={['siteadmin', 'country-options']}
            fetchPage={fetchCountryOptionsPage}
            placeholder="Select country"
            emptyText="No countries"
            disabled={readOnly}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>State *</Label>
          <PaginatedSelect
            value={data.state}
            onChange={(opt) => set('state', opt)}
            queryKey={['siteadmin', 'state-options', data.country?.id ?? null]}
            fetchPage={(p) => fetchStateOptionsPage({ ...p, countryId: data.country?.id })}
            placeholder={data.country ? 'Select state' : 'Select a country first'}
            emptyText="No states"
            disabled={readOnly || !data.country}
          />
        </div>
        <Input label="City Name *" value={data.name} disabled={readOnly} onChange={(e) => set('name', e.target.value)} />
        <Input
          label="PIN Code *"
          value={data.pinCode}
          disabled={readOnly}
          placeholder="6 digits"
          inputMode="numeric"
          maxLength={6}
          onChange={(e) => set('pinCode', e.target.value.replace(/\D/g, ''))}
        />

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
