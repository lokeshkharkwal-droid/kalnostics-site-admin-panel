'use client'

import { Card, CardContent, Button, Input, Label, PhoneInput, PaginatedSelect } from '@/shared/ui'
import {
  fetchAreaOptionsPage,
  fetchCityOptionsPage,
  fetchCountryOptionsPage,
  fetchStateOptionsPage,
} from '@/features/locations/services/locations.api'
import type { IBusinessEditTabProps } from '../interfaces'
import { formatBusinessDate } from '../utils'
import { SectionTitle } from './SectionTitle'
import { ReadField } from './ReadField'

export function BusinessInfoTab({
  tenant, editing, form, setForm, updating, saveError, onSave, onCancel,
}: IBusinessEditTabProps) {
  const locationLabel = [tenant.area?.name, tenant.city?.name, tenant.state?.name, tenant.country?.name]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-4">
    <Card>
      <div className="px-5 py-4 border-b border-notion-line flex items-center justify-between">
        <SectionTitle>Business Information</SectionTitle>
        {editing && (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={updating}>
              Cancel
            </Button>
            <Button size="sm" loading={updating} onClick={onSave}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <CardContent className="py-5">
        {!editing ? (
          <div className="grid grid-cols-2 gap-x-10 gap-y-5">
            <ReadField label="Business Name" value={tenant.name} />
            <ReadField label="Slug (subdomain)" value={`${tenant.slug}.kaltros.com`} />
            <ReadField label="Short Name" value={tenant.shortName} />
            <ReadField label="Email" value={tenant.email} />
            <ReadField label="Phone" value={tenant.phone} />
            <ReadField label="Address" value={tenant.addressLine} />
            <ReadField label="Pin code" value={tenant.pincode} />
            <ReadField label="Location" value={locationLabel || null} />
            <ReadField label="Logo URL" value={tenant.logoUrl} />
            <ReadField label="Photo URL" value={tenant.photoUrl} />
          </div>
        ) : (
          form && (
            <form onSubmit={onSave} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Business Name"
                  value={form.name}
                  onChange={e => setForm(f => f && ({ ...f, name: e.target.value }))}
                  disabled={updating}
                />
                <Input
                  label="Short Name"
                  value={form.shortName}
                  onChange={e => setForm(f => f && ({ ...f, shortName: e.target.value }))}
                  disabled={updating}
                />
              </div>

              <div>
                <p className="text-xs text-notion-sub mb-1">Slug (immutable)</p>
                <p className="text-sm text-notion-sub font-mono bg-notion-panel border border-notion-line rounded-md px-3 py-2">
                  {tenant.slug}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => f && ({ ...f, email: e.target.value }))}
                  disabled={updating}
                />
                <PhoneInput
                  label="Phone"
                  countryCode={form.phoneCountryCode}
                  onCountryCodeChange={v => setForm(f => f && ({ ...f, phoneCountryCode: v }))}
                  phone={form.phone}
                  onPhoneChange={v => setForm(f => f && ({ ...f, phone: v }))}
                  disabled={updating}
                />
              </div>

              <Input
                label="Address"
                value={form.addressLine}
                onChange={e => setForm(f => f && ({ ...f, addressLine: e.target.value }))}
                placeholder="12 MG Road"
                disabled={updating}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label>Country</Label>
                  <PaginatedSelect
                    value={form.country}
                    onChange={opt => setForm(f => f && ({ ...f, country: opt, state: null, city: null, area: null }))}
                    queryKey={['siteadmin', 'country-options']}
                    fetchPage={fetchCountryOptionsPage}
                    placeholder="Select country"
                    emptyText="No countries"
                    disabled={updating}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>State</Label>
                  <PaginatedSelect
                    value={form.state}
                    onChange={opt => setForm(f => f && ({ ...f, state: opt, city: null, area: null }))}
                    queryKey={['siteadmin', 'state-options', form.country?.id ?? null]}
                    fetchPage={p => fetchStateOptionsPage({ ...p, countryId: form.country?.id })}
                    placeholder={form.country ? 'Select state' : 'Select a country first'}
                    emptyText="No states"
                    disabled={updating || !form.country}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label>City</Label>
                  <PaginatedSelect
                    value={form.city}
                    onChange={opt => setForm(f => f && ({ ...f, city: opt, area: null }))}
                    queryKey={['siteadmin', 'city-options', form.state?.id ?? null]}
                    fetchPage={p => fetchCityOptionsPage({ ...p, stateId: form.state?.id, countryId: form.country?.id })}
                    placeholder={form.state ? 'Select city' : 'Select a state first'}
                    emptyText="No cities"
                    disabled={updating || !form.state}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Locality</Label>
                  <PaginatedSelect
                    value={form.area}
                    onChange={opt => setForm(f => f && ({ ...f, area: opt }))}
                    queryKey={['siteadmin', 'area-options', form.city?.id ?? null]}
                    fetchPage={p => fetchAreaOptionsPage({ ...p, cityId: form.city?.id, stateId: form.state?.id, countryId: form.country?.id })}
                    placeholder={form.city ? 'Select locality' : 'Select a city first'}
                    emptyText="No localities"
                    disabled={updating || !form.city}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Pin code"
                  value={form.pincode}
                  onChange={e => setForm(f => f && ({ ...f, pincode: e.target.value }))}
                  placeholder="560001"
                  disabled={updating}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Logo URL"
                  value={form.logoUrl}
                  onChange={e => setForm(f => f && ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://…/logo.png"
                  disabled={updating}
                />
                <Input
                  label="Photo URL"
                  value={form.photoUrl}
                  onChange={e => setForm(f => f && ({ ...f, photoUrl: e.target.value }))}
                  placeholder="https://…/photo.jpg"
                  disabled={updating}
                />
              </div>

              {saveError && (
                <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {saveError}
                </p>
              )}
            </form>
          )
        )}
      </CardContent>
    </Card>

    <Card>
      <div className="px-5 py-4 border-b border-notion-line">
        <SectionTitle>Audit Information</SectionTitle>
      </div>
      <CardContent className="py-5">
        <div className="grid grid-cols-2 gap-x-10 gap-y-5">
          <ReadField label="Created By" value={tenant.createdByName} />
          <ReadField label="Created On" value={tenant.createdAt ? formatBusinessDate(tenant.createdAt) : null} />
          <ReadField label="Updated By" value={tenant.updatedByName} />
          <ReadField label="Updated On" value={tenant.updatedAt ? formatBusinessDate(tenant.updatedAt) : null} />
        </div>
      </CardContent>
    </Card>
    </div>
  )
}
