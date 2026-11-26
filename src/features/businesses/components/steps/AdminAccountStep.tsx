'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Input, PasswordInput } from '@/shared/ui'
import type { ICreateTenantForm } from '../../interfaces'

interface Props {
  form: ICreateTenantForm
  setForm: Dispatch<SetStateAction<ICreateTenantForm>>
  /** Marks the login email as hand-edited so it stops mirroring the business email. */
  onAdminEmailChange: (email: string) => void
  disabled: boolean
}

/** Wizard step 2 — the first business-admin account. */
export function AdminAccountStep({ form, setForm, onAdminEmailChange, disabled }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">
        Business Admin Account
        <span className="ml-2 font-normal normal-case text-notion-faint">
          Login mobile mirrors the business phone
        </span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="First name *"
          value={form.adminFirstName}
          onChange={e => setForm(f => ({ ...f, adminFirstName: e.target.value }))}
          placeholder="Dilip"
          disabled={disabled}
        />
        <Input
          label="Middle name"
          value={form.adminMiddleName}
          onChange={e => setForm(f => ({ ...f, adminMiddleName: e.target.value }))}
          placeholder="Raj"
          disabled={disabled}
        />
        <Input
          label="Last name *"
          value={form.adminLastName}
          onChange={e => setForm(f => ({ ...f, adminLastName: e.target.value }))}
          placeholder="Kumar"
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
          onChange={e => onAdminEmailChange(e.target.value)}
          placeholder="dilip@clinic.com"
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PasswordInput
          label="Password *"
          value={form.adminPassword}
          onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
          placeholder="Set a login password"
          hint="Min 8 characters, 1 uppercase, 1 number"
          autoComplete="new-password"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
