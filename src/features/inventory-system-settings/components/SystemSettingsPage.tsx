'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Input, PageLoader, PaginatedSelect, SelectField, type SelectOption } from '@/shared/ui'
import { fetchReferencePage } from '@/features/inventory-reference/services/reference.api'
import { getSettings, saveSettings } from '../services/system-settings.api'
import { SETTINGS_GROUPS, type SettingField } from './settings-schema'

/** The legacy "Invoice Tax" dropdown prepends a Disable (0) option before the
 *  tax-rates table; replicate that here so clearing maps to '0', not empty. */
const TAX_DISABLE_OPTION: SelectOption = { id: '0', label: 'Disable' }

export function SystemSettingsPage() {
  const qc = useQueryClient()
  const [values, setValues] = useState<Record<string, unknown>>({})
  // Labels captured when a paginated option is picked, so the trigger renders a
  // name rather than the bare stored id after save / reload.
  const [optionLabels, setOptionLabels] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'master-settings'],
    queryFn: getSettings,
  })

  // Hydrate the local form from the loaded blob (once it arrives).
  useEffect(() => {
    if (data) setValues(data)
  }, [data])

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'master-settings'] })
    },
  })

  function set(key: string, value: unknown) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSave() {
    // The backend shallow-merges, so posting the full working set is safe and
    // keeps any keys we don't surface in the UI intact (they were loaded in).
    mutation.mutate(values)
  }

  function renderField(f: SettingField) {
    const raw = values[f.key]

    if (f.type === 'select') {
      return (
        <SelectField
          key={f.key}
          label={f.label}
          value={raw == null ? '' : String(raw)}
          onChange={(v) => set(f.key, v)}
          options={f.options ?? []}
          placeholder="Select…"
        />
      )
    }

    if (f.type === 'paginated-select') {
      const id = raw == null ? '' : String(raw)
      const selected: SelectOption | null =
        id === '' ? null : id === '0' ? TAX_DISABLE_OPTION : { id, label: optionLabels[id] ?? id }
      return (
        <div key={f.key} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-notion-sub">{f.label}</label>
          <PaginatedSelect
            value={selected}
            onChange={(opt) => {
              set(f.key, opt?.id ?? '')
              if (opt) setOptionLabels((m) => ({ ...m, [opt.id]: opt.label }))
            }}
            queryKey={['inventory', 'master-reference', f.resource ?? '']}
            fetchPage={async (p) => {
              const res = await fetchReferencePage(f.resource ?? '', p)
              // Inject the legacy Disable (0) option on the first page.
              if (p.page === 1 && !p.search) {
                return { ...res, data: [{ id: '0', name: 'Disable' }, ...res.data] }
              }
              return res
            }}
            placeholder="Select…"
          />
        </div>
      )
    }

    return (
      <Input
        key={f.key}
        label={f.label}
        type={f.type === 'number' ? 'number' : 'text'}
        value={raw == null ? '' : String(raw)}
        onChange={(e) =>
          set(f.key, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)
        }
        placeholder={f.placeholder}
      />
    )
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="System Settings"
        subtitle="Inventory module configuration"
        actions={
          <Button size="sm" loading={mutation.isPending} onClick={handleSave} disabled={isLoading}>
            Save Changes
          </Button>
        }
      />

      <main className="flex-1 space-y-5 p-6">
        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {SETTINGS_GROUPS.map((group) => (
              <section key={group.title} className="space-y-3 rounded-xl border border-notion-line bg-white p-4">
                <div>
                  <h2 className="text-sm font-semibold text-notion-text">{group.title}</h2>
                  {group.description && (
                    <p className="mt-0.5 text-xs text-notion-faint">{group.description}</p>
                  )}
                </div>
                <div className="space-y-3">{group.fields.map(renderField)}</div>
              </section>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="flex justify-end">
            <Button loading={mutation.isPending} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
