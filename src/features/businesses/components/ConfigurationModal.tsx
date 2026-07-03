'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Button, Input, SelectField, Spinner } from '@/shared/ui'
import type { TenantConfiguration } from '@/entities/tenant'
import { getTenantConfiguration, updateTenantConfiguration } from '../services/businesses.api'
import type { IConfigForm } from '../interfaces'

const THEME_OPTIONS = [
  { value: 'LIGHT', label: 'Light' },
  { value: 'DARK', label: 'Dark' },
]

/** Optional-URL validity check — allows empty, otherwise must parse as a URL. */
function isValidOptionalUrl(v: string): boolean {
  if (!v.trim()) return true
  try {
    new URL(v.trim())
    return true
  } catch {
    return false
  }
}

function toForm(c: TenantConfiguration): IConfigForm {
  return {
    siteAdminUrl: c.siteAdminUrl ?? '',
    siteTitle: c.siteTitle ?? '',
    logoPath: c.logoPath ?? '',
    logoLink: c.logoLink ?? '',
    template: c.template ?? '',
    theme: c.theme,
    patientOrderUrl: c.patientOrderUrl ?? '',
    maxOrdersPerDayPerBranch: c.maxOrdersPerDayPerBranch?.toString() ?? '',
    maxUsersAllowed: c.maxUsersAllowed?.toString() ?? '',
  }
}

/**
 * Business Configuration modal — fetches and saves a tenant's configuration.
 * Self-contained so it can be opened from both the businesses list and the
 * business detail page.
 */
export function ConfigurationModal({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<IConfigForm | null>(null)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['siteadmin', 'tenant-configuration', tenantId],
    queryFn: () => getTenantConfiguration(tenantId),
    enabled: !!tenantId,
  })

  useEffect(() => {
    if (data) setForm(toForm(data))
  }, [data])

  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => updateTenantConfiguration(tenantId, body),
    onSuccess: (updated) => {
      qc.setQueryData(['siteadmin', 'tenant-configuration', tenantId], updated)
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save configuration'
      setError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function set<K extends keyof IConfigForm>(key: K, value: IConfigForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  function parsePositiveInt(v: string, label: string): number | null | undefined {
    const trimmed = v.trim()
    if (!trimmed) return null // clears the value
    const n = Number(trimmed)
    if (!Number.isInteger(n) || n < 1) {
      setError(`${label} must be a positive whole number`)
      return undefined // signal invalid
    }
    return n
  }

  function handleSave() {
    if (!form) return
    setError('')

    for (const [value, label] of [
      [form.siteAdminUrl, 'Site Admin URL'],
      [form.logoLink, 'Logo Link'],
      [form.patientOrderUrl, 'Patient Order URL'],
    ] as const) {
      if (!isValidOptionalUrl(value)) {
        setError(`${label} must be a valid URL`)
        return
      }
    }

    const maxOrders = parsePositiveInt(form.maxOrdersPerDayPerBranch, 'Maximum Orders Per Day Per Branch')
    if (maxOrders === undefined) return
    const maxUsers = parsePositiveInt(form.maxUsersAllowed, 'Maximum Users Allowed')
    if (maxUsers === undefined) return

    mutation.mutate({
      siteAdminUrl: form.siteAdminUrl.trim() || undefined,
      siteTitle: form.siteTitle.trim() || undefined,
      logoPath: form.logoPath.trim() || undefined,
      logoLink: form.logoLink.trim() || undefined,
      template: form.template.trim() || undefined,
      theme: form.theme,
      patientOrderUrl: form.patientOrderUrl.trim() || undefined,
      maxOrdersPerDayPerBranch: maxOrders ?? undefined,
      maxUsersAllowed: maxUsers ?? undefined,
    })
  }

  return (
    <Modal
      title="Business Configuration"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button size="sm" loading={mutation.isPending} onClick={handleSave} disabled={!form}>
            Save Configuration
          </Button>
        </>
      }
    >
      {isLoading || !form ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">General Configuration</p>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Site Admin URL" value={form.siteAdminUrl} placeholder="https://admin.example.com"
              onChange={(e) => set('siteAdminUrl', e.target.value)} disabled={mutation.isPending} />
            <Input label="Site Title" value={form.siteTitle}
              onChange={(e) => set('siteTitle', e.target.value)} disabled={mutation.isPending} />
            <Input label="Logo Path" value={form.logoPath} placeholder="/uploads/logo.png"
              onChange={(e) => set('logoPath', e.target.value)} disabled={mutation.isPending} />
            <Input label="Logo Link" value={form.logoLink} placeholder="https://example.com"
              onChange={(e) => set('logoLink', e.target.value)} disabled={mutation.isPending} />
            <Input label="Template" value={form.template}
              onChange={(e) => set('template', e.target.value)} disabled={mutation.isPending} />
            <SelectField label="Theme" options={THEME_OPTIONS} value={form.theme}
              onChange={(v) => set('theme', v as IConfigForm['theme'])} disabled={mutation.isPending} />
            <Input label="Patient Order URL" value={form.patientOrderUrl} placeholder="https://order.example.com"
              onChange={(e) => set('patientOrderUrl', e.target.value)} disabled={mutation.isPending} />
            <Input label="Max Orders Per Day Per Branch" type="number" min={1} value={form.maxOrdersPerDayPerBranch}
              onChange={(e) => set('maxOrdersPerDayPerBranch', e.target.value)} disabled={mutation.isPending} />
            <Input label="Max Users Allowed (Business-wide)" type="number" min={1} value={form.maxUsersAllowed}
              onChange={(e) => set('maxUsersAllowed', e.target.value)} disabled={mutation.isPending} />
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}
    </Modal>
  )
}
