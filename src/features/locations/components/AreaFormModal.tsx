'use client'

import { useState } from 'react'
import { Button, Input, Label, Modal, PaginatedSelect, Toggle } from '@/shared/ui'
import type { Area, FormMode } from '../interfaces'
import { validateArea } from '../utils/mapping'
import {
  fetchCityOptionsPage,
  fetchCountryOptionsPage,
  fetchStateOptionsPage,
} from '../services/locations.api'

/** Add / edit / view modal for an area. Country → State → City cascade: each
 *  parent change clears the deeper selections so only matching options show. */
export function AreaFormModal({
  area, mode, saving, onSave, onClose,
}: {
  area: Area
  mode: FormMode
  saving: boolean
  onSave: (a: Area) => void
  onClose: () => void
}) {
  const [data, setData] = useState<Area>({ ...area })
  const [error, setError] = useState<string | null>(null)
  const readOnly = mode === 'view'

  const set = <K extends keyof Area>(field: K, val: Area[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  const submit = () => {
    const err = validateArea(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  const title = mode === 'create' ? 'Add Area' : mode === 'edit' ? 'Edit Area' : 'Area Details'

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
            onChange={(opt) => setData((prev) => ({ ...prev, country: opt, state: null, city: null }))}
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
            onChange={(opt) => setData((prev) => ({ ...prev, state: opt, city: null }))}
            queryKey={['siteadmin', 'state-options', data.country?.id ?? null]}
            fetchPage={(p) => fetchStateOptionsPage({ ...p, countryId: data.country?.id })}
            placeholder={data.country ? 'Select state' : 'Select a country first'}
            emptyText="No states"
            disabled={readOnly || !data.country}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>City *</Label>
          <PaginatedSelect
            value={data.city}
            onChange={(opt) => set('city', opt)}
            queryKey={['siteadmin', 'city-options', data.state?.id ?? null]}
            fetchPage={(p) => fetchCityOptionsPage({ ...p, stateId: data.state?.id, countryId: data.country?.id })}
            placeholder={data.state ? 'Select city' : 'Select a state first'}
            emptyText="No cities"
            disabled={readOnly || !data.state}
          />
        </div>
        <Input label="Area Name *" value={data.name} disabled={readOnly} onChange={(e) => set('name', e.target.value)} />
        <Input label="Locality Name *" value={data.locality} disabled={readOnly} onChange={(e) => set('locality', e.target.value)} />

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
