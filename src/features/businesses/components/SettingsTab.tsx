'use client'

import { Card, CardContent, Button, Input } from '@/shared/ui'
import type { IBusinessEditTabProps } from '../interfaces'
import { SectionTitle } from './SectionTitle'
import { ReadField } from './ReadField'

export function SettingsTab({
  tenant, editing, form, setForm, updating, saveError, onSave, onCancel,
}: IBusinessEditTabProps) {
  return (
    <Card>
      <div className="px-5 py-4 border-b border-notion-line flex items-center justify-between">
        <SectionTitle>Locale & Branding</SectionTitle>
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
            <ReadField label="Timezone" value={tenant.settings?.timezone} />
            <ReadField label="Currency" value={tenant.settings?.currency} />
            <ReadField label="Date Format" value={tenant.settings?.date_format} />
            <ReadField label="Language" value={tenant.settings?.language} />
            <ReadField label="App Name (white-label)" value={tenant.settings?.app_name} />
          </div>
        ) : (
          form && (
            <form onSubmit={onSave} className="space-y-4 max-w-lg">
              <Input
                label="Timezone"
                value={form.settings.timezone}
                onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, timezone: e.target.value } }))}
                placeholder="Asia/Kolkata"
                disabled={updating}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Currency"
                  value={form.settings.currency}
                  onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, currency: e.target.value } }))}
                  placeholder="INR"
                  disabled={updating}
                />
                <Input
                  label="Date Format"
                  value={form.settings.date_format}
                  onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, date_format: e.target.value } }))}
                  placeholder="DD/MM/YYYY"
                  disabled={updating}
                />
              </div>
              <Input
                label="Language"
                value={form.settings.language}
                onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, language: e.target.value } }))}
                placeholder="en"
                disabled={updating}
              />
              <Input
                label="App Name (white-label)"
                value={form.settings.app_name}
                onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, app_name: e.target.value } }))}
                placeholder="Custom name shown in the business's UI"
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
