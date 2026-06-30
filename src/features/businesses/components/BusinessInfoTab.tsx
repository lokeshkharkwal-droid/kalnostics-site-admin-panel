'use client'

import { Card, CardContent, Button, Input, PhoneInput } from '@/shared/ui'
import type { IBusinessEditTabProps } from '../interfaces'
import { SectionTitle } from './SectionTitle'
import { ReadField } from './ReadField'

export function BusinessInfoTab({
  tenant, editing, form, setForm, updating, saveError, onSave, onCancel,
}: IBusinessEditTabProps) {
  return (
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
            <ReadField label="Email" value={tenant.email} />
            <ReadField label="Phone" value={tenant.phone} />
            <ReadField label="Custom Domain" value={tenant.customDomain} />
            <ReadField label="MRN Prefix" value={tenant.mrnPrefix} />
          </div>
        ) : (
          form && (
            <form onSubmit={onSave} className="space-y-4 max-w-lg">
              <Input
                label="Business Name"
                value={form.name}
                onChange={e => setForm(f => f && ({ ...f, name: e.target.value }))}
                disabled={updating}
              />
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
                label="MRN Prefix"
                value={form.mrnPrefix}
                onChange={e => setForm(f => f && ({ ...f, mrnPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                placeholder="CD"
                hint="Prefix for patient MRNs (e.g. CD → CD-00001). Cannot exceed 10 chars."
                disabled={updating}
              />

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
  )
}
