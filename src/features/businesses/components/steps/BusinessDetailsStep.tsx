'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Input, Label, PaginatedSelect, PhoneInput, SelectField } from '@/shared/ui'
import {
  fetchAreaOptionsPage,
  fetchCityOptionsPage,
  fetchCountryOptionsPage,
  fetchStateOptionsPage,
} from '@/features/locations/services/locations.api'
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from '../../constants/locale-options'
import type { ICreateTenantForm } from '../../interfaces'

interface Props {
  form: ICreateTenantForm
  setForm: Dispatch<SetStateAction<ICreateTenantForm>>
  /** Business email change also mirrors the login email until the admin edits it. */
  onBusinessEmailChange: (email: string) => void
  disabled: boolean
}

/** Wizard step 1 — business details + registered address. */
export function BusinessDetailsStep({ form, setForm, onBusinessEmailChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">Business Details</p>
      <Input
        label="Business name *"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="City Diagnostics"
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Business email *"
          type="email"
          value={form.email}
          onChange={e => onBusinessEmailChange(e.target.value)}
          placeholder="info@clinic.com"
          disabled={disabled}
        />
        <PhoneInput
          label="Business phone *"
          required
          countryCode={form.phoneCountryCode}
          onCountryCodeChange={v => setForm(f => ({ ...f, phoneCountryCode: v }))}
          phone={form.phone}
          onPhoneChange={v => setForm(f => ({ ...f, phone: v }))}
          disabled={disabled}
        />
      </div>
      <Input
        label="Short name"
        value={form.shortName}
        onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
        placeholder="CityDx"
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Time zone *"
          value={form.timezone}
          onChange={v => setForm(f => ({ ...f, timezone: v }))}
          options={TIMEZONE_OPTIONS}
          disabled={disabled}
        />
        <SelectField
          label="Currency *"
          value={form.currency}
          onChange={v => setForm(f => ({ ...f, currency: v }))}
          options={CURRENCY_OPTIONS}
          disabled={disabled}
        />
      </div>

      <Input
        label="Address"
        value={form.addressLine}
        onChange={e => setForm(f => ({ ...f, addressLine: e.target.value }))}
        placeholder="12 MG Road"
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Country</Label>
          <PaginatedSelect
            value={form.country}
            onChange={opt => setForm(f => ({ ...f, country: opt, state: null, city: null, area: null }))}
            queryKey={['siteadmin', 'country-options']}
            fetchPage={fetchCountryOptionsPage}
            placeholder="Select country"
            emptyText="No countries"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>State</Label>
          <PaginatedSelect
            value={form.state}
            onChange={opt => setForm(f => ({ ...f, state: opt, city: null, area: null }))}
            queryKey={['siteadmin', 'state-options', form.country?.id ?? null]}
            fetchPage={p => fetchStateOptionsPage({ ...p, countryId: form.country?.id })}
            placeholder={form.country ? 'Select state' : 'Select a country first'}
            emptyText="No states"
            disabled={disabled || !form.country}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>City</Label>
          <PaginatedSelect
            value={form.city}
            onChange={opt => setForm(f => ({ ...f, city: opt, area: null }))}
            queryKey={['siteadmin', 'city-options', form.state?.id ?? null]}
            fetchPage={p => fetchCityOptionsPage({ ...p, stateId: form.state?.id, countryId: form.country?.id })}
            placeholder={form.state ? 'Select city' : 'Select a state first'}
            emptyText="No cities"
            disabled={disabled || !form.state}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Locality</Label>
          <PaginatedSelect
            value={form.area}
            onChange={opt => setForm(f => ({ ...f, area: opt }))}
            queryKey={['siteadmin', 'area-options', form.city?.id ?? null]}
            fetchPage={p => fetchAreaOptionsPage({ ...p, cityId: form.city?.id, stateId: form.state?.id, countryId: form.country?.id })}
            placeholder={form.city ? 'Select locality' : 'Select a city first'}
            emptyText="No localities"
            disabled={disabled || !form.city}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Zip / Pin code"
          value={form.pincode}
          onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
          placeholder="560001"
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Logo URL"
          value={form.logoUrl}
          onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
          placeholder="https://…/logo.png"
          disabled={disabled}
        />
        <Input
          label="Photo URL"
          value={form.photoUrl}
          onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))}
          placeholder="https://…/photo.jpg"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
