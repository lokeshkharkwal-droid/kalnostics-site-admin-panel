'use client'

import { Card, CardContent, Button, Input, SelectField } from '@/shared/ui'
import type { IBusinessEditTabProps } from '../interfaces'
import { SectionTitle } from './SectionTitle'
import { ReadField } from './ReadField'
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS, TIME_FORMAT_OPTIONS } from '../constants/locale-options'

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
            <ReadField label="Time Format" value={tenant.settings?.time_format} />
            <ReadField label="Language" value={tenant.settings?.language} />
          </div>
        ) : (
          form && (
            <form onSubmit={onSave} className="space-y-4 max-w-lg">
              <SelectField
                label="Timezone"
                value={form.settings.timezone}
                onChange={v => setForm(f => f && ({ ...f, settings: { ...f.settings, timezone: v } }))}
                options={TIMEZONE_OPTIONS}
                disabled={updating}
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Currency"
                  value={form.settings.currency}
                  onChange={v => setForm(f => f && ({ ...f, settings: { ...f.settings, currency: v } }))}
                  options={CURRENCY_OPTIONS}
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
              <SelectField
                label="Time Format"
                value={form.settings.time_format}
                onChange={v => setForm(f => f && ({ ...f, settings: { ...f.settings, time_format: v } }))}
                options={TIME_FORMAT_OPTIONS}
                disabled={updating}
              />
              <Input
                label="Language"
                value={form.settings.language}
                onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, language: e.target.value } }))}
                placeholder="en"
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
