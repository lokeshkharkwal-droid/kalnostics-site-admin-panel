'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Label, PaginatedSelect, PasswordInput, PhoneInput, SelectField } from '@/shared/ui'
import {
  fetchAreaOptionsPage,
  fetchCityOptionsPage,
  fetchCountryOptionsPage,
  fetchStateOptionsPage,
} from '@/features/locations/services/locations.api'
import { createTenant } from '../services/businesses.api'
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from '../constants/locale-options'
import type { ICreateBusinessModalProps, ICreateTenantForm } from '../interfaces'

const EMPTY_FORM: ICreateTenantForm = {
  name: '', email: '', phoneCountryCode: '+91', phone: '',
  shortName: '', addressLine: '', pincode: '',
  country: null, state: null, city: null, area: null,
  logoUrl: '', photoUrl: '',
  timezone: 'Asia/Kolkata', currency: 'INR',
  adminFirstName: '', adminMiddleName: '', adminLastName: '', adminPhoneCountryCode: '+91', adminPhone: '', adminEmail: '',
  adminPassword: '',
}

/** Password policy (mirrors backend §5.3): min 8, ≥1 uppercase, ≥1 digit. */
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters long'
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter'
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number'
  return null
}

export function CreateBusinessModal({ onClose, onCreated }: ICreateBusinessModalProps) {
  const qc = useQueryClient()
  const [form, setForm] = useState<ICreateTenantForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  // Once the SiteAdmin edits the login email, stop mirroring the business email.
  const [adminEmailTouched, setAdminEmailTouched] = useState(false)

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
      onCreated({ adminPhone: data.adminPhone, password: form.adminPassword, businessName: data.tenant.name })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create business'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.name.trim()) { setFormError('Business name is required'); return }
    if (!form.email.trim()) { setFormError('Business email is required'); return }
    if (!emailPattern.test(form.email.trim())) { setFormError('Enter a valid business email'); return }
    if (!form.phone.trim()) { setFormError('Business phone is required'); return }
    if (!form.timezone) { setFormError('Time zone is required'); return }
    if (!form.currency) { setFormError('Currency is required'); return }
    if (!form.adminFirstName.trim()) { setFormError('First name is required'); return }
    if (!form.adminLastName.trim()) { setFormError('Last name is required'); return }
    if (!form.adminEmail.trim()) { setFormError('Login email is required'); return }
    if (!emailPattern.test(form.adminEmail.trim())) { setFormError('Enter a valid login email'); return }
    const pwError = validatePassword(form.adminPassword)
    if (pwError) { setFormError(pwError); return }
    createMutation.mutate(form)
  }

  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-notion-line bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4 shrink-0">
          <h2 className="text-sm font-semibold text-notion-text">Create New Business</h2>
          <button
            onClick={onClose}
            className="text-notion-faint hover:text-notion-sub transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 px-5 py-4 overflow-y-auto">
          {/* Business details */}
          <p className="text-xs font-semibold text-notion-sub uppercase tracking-wide">Business Details</p>
          <Input
            label="Business name *"
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="City Diagnostics"
            disabled={createMutation.isPending}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Business email *"
              type="email"
              value={form.email}
              onChange={e => {
                const email = e.target.value
                // Auto-fill the login email until the SiteAdmin edits it themselves.
                setForm(f => ({ ...f, email, adminEmail: adminEmailTouched ? f.adminEmail : email }))
              }}
              placeholder="info@clinic.com"
              disabled={createMutation.isPending}
            />
            <PhoneInput
              label="Business phone *"
              required
              countryCode={form.phoneCountryCode}
              onCountryCodeChange={v => setForm(f => ({ ...f, phoneCountryCode: v }))}
              phone={form.phone}
              onPhoneChange={v => setForm(f => ({ ...f, phone: v }))}
              disabled={createMutation.isPending}
            />
          </div>
          <Input
            label="Short name"
            value={form.shortName}
            onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
            placeholder="CityDx"
            disabled={createMutation.isPending}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Time zone *"
              value={form.timezone}
              onChange={v => setForm(f => ({ ...f, timezone: v }))}
              options={TIMEZONE_OPTIONS}
              disabled={createMutation.isPending}
            />
            <SelectField
              label="Currency *"
              value={form.currency}
              onChange={v => setForm(f => ({ ...f, currency: v }))}
              options={CURRENCY_OPTIONS}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Address */}
          <Input
            label="Address"
            value={form.addressLine}
            onChange={e => setForm(f => ({ ...f, addressLine: e.target.value }))}
            placeholder="12 MG Road"
            disabled={createMutation.isPending}
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
                disabled={createMutation.isPending}
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
                disabled={createMutation.isPending || !form.country}
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
                disabled={createMutation.isPending || !form.state}
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
                disabled={createMutation.isPending || !form.city}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Zip / Pin code"
              value={form.pincode}
              onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
              placeholder="560001"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Logo URL"
              value={form.logoUrl}
              onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://…/logo.png"
              disabled={createMutation.isPending}
            />
            <Input
              label="Photo URL"
              value={form.photoUrl}
              onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))}
              placeholder="https://…/photo.jpg"
              disabled={createMutation.isPending}
            />
          </div>

          {/* Business admin account */}
          <div className="border-t border-notion-line pt-3">
            <p className="text-xs font-semibold text-notion-sub uppercase tracking-wide mb-3">
              Business Admin Account
              <span className="ml-2 font-normal normal-case text-notion-faint">Login email &amp; mobile mirror the business email/phone</span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="First name *"
                value={form.adminFirstName}
                onChange={e => setForm(f => ({ ...f, adminFirstName: e.target.value }))}
                placeholder="Dilip"
                disabled={createMutation.isPending}
              />
              <Input
                label="Middle name"
                value={form.adminMiddleName}
                onChange={e => setForm(f => ({ ...f, adminMiddleName: e.target.value }))}
                placeholder="Raj"
                disabled={createMutation.isPending}
              />
              <Input
                label="Last name *"
                value={form.adminLastName}
                onChange={e => setForm(f => ({ ...f, adminLastName: e.target.value }))}
                placeholder="Kumar"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Input
                label="Mobile (login ID) *"
                value={form.phone}
                readOnly
                disabled
                placeholder="Mirrors business phone"
                hint="Uses the business phone number (10-digit, no country code)"
              />
              <Input
                label="Login email *"
                type="email"
                value={form.adminEmail}
                onChange={e => {
                  setAdminEmailTouched(true)
                  setForm(f => ({ ...f, adminEmail: e.target.value }))
                }}
                placeholder="dilip@clinic.com"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <PasswordInput
                label="Password *"
                value={form.adminPassword}
                onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                placeholder="Set a login password"
                hint="Min 8 characters, 1 uppercase, 1 number"
                autoComplete="new-password"
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          {formError && (
            <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Business
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
