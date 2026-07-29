'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, Card, CardContent, Input, Label, PageLoader, SelectField } from '@/shared/ui'
import type { FormMode, SupportInfo, SupportStatus, SupportTenantType } from '../interfaces'
import { META_TYPE_SUGGESTIONS, STATUS_OPTIONS, TENANT_TYPE_OPTIONS, emptySupportInfo } from '../utils/constants'
import { fromEntity, toWriteDto, validateSupportInfo } from '../utils/mapping'
import { createSupportInfo, getSupportInfo, updateSupportInfo } from '../services/support-info.api'

// TinyMCE is client-only and pulls in a large browser graph — load it lazily.
const HtmlEditor = dynamic(() => import('@/shared/ui/html-editor').then((m) => m.HtmlEditor), {
  ssr: false,
  loading: () => <p className="p-4 text-xs text-notion-faint">Loading editor…</p>,
})

const BASE_PATH = '/support/support-information'
const QK = ['siteadmin', 'support-info'] as const

/**
 * Two-column create / edit / view page for a Support Information record. Left:
 * the metadata form. Right: the TinyMCE help-content editor. In `create` mode
 * it starts blank; in `edit`/`view` it fetches the record first.
 */
export function SupportInfoForm({ mode, id }: { mode: FormMode; id?: string }) {
  const isNew = mode === 'create'

  const { data: entity, isLoading } = useQuery({
    queryKey: [...QK, 'detail', id],
    queryFn: () => getSupportInfo(id as string),
    enabled: !isNew && Boolean(id),
  })

  if (!isNew && isLoading) {
    return (
      <div className="flex flex-col">
        <AdminHeader title="Support Information" subtitle="Loading…" />
        <main className="flex-1 p-6"><Card><CardContent><PageLoader /></CardContent></Card></main>
      </div>
    )
  }

  const initial = isNew ? emptySupportInfo() : entity ? fromEntity(entity) : null
  if (!initial) {
    return (
      <div className="flex flex-col">
        <AdminHeader title="Support Information" subtitle="Not found" />
        <main className="flex-1 p-6"><p className="text-sm text-notion-sub">This record could not be loaded.</p></main>
      </div>
    )
  }

  // Remount the inner editor form when the loaded record *or the mode* changes, so
  // the TinyMCE editor re-initialises for the current mode (read-only vs editable).
  return <SupportInfoFormInner key={`${initial.id || 'new'}-${mode}`} mode={mode} initial={initial} />
}

function SupportInfoFormInner({ mode, initial }: { mode: FormMode; initial: SupportInfo }) {
  const router = useRouter()
  const qc = useQueryClient()
  const readOnly = mode === 'view'

  const [data, setData] = useState<SupportInfo>(initial)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof SupportInfo>(key: K, value: SupportInfo[K]) =>
    setData((d) => ({ ...d, [key]: value }))

  const back = () => router.push(BASE_PATH)

  const saveMut = useMutation({
    mutationFn: (d: SupportInfo) =>
      mode === 'create' ? createSupportInfo(toWriteDto(d)) : updateSupportInfo(d.id, toWriteDto(d)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK })
      back()
    },
  })

  const submit = () => {
    const err = validateSupportInfo(data)
    if (err) { setError(err); return }
    setError(null)
    saveMut.mutate(data)
  }

  const title = mode === 'create' ? 'Add Support Information' : mode === 'edit' ? 'Edit Support Information' : 'View Support Information'

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title={title}
        subtitle={readOnly ? data.title : 'Fill in the details and author the help content'}
        actions={
          readOnly ? (
            <>
              <Button size="sm" variant="secondary" onClick={back}>Back</Button>
              <Button size="sm" onClick={() => router.push(`${BASE_PATH}/${data.id}`)}>Edit</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={back} disabled={saveMut.isPending}>Cancel</Button>
              <Button size="sm" loading={saveMut.isPending} onClick={submit}>Save</Button>
            </>
          )
        }
      />

      <main className="flex-1 p-6">
        {error && (
          <div className="mb-4 rounded-md border border-notion-red/40 bg-[#fbeceb] px-3 py-2 text-sm text-[#c0392b]">{error}</div>
        )}

        {/* Fields are compact (1/3); the Help Content editor gets the room (2/3). */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left: metadata form ─────────────────────────────────────────── */}
          <Card className="self-start">
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <Input
                  label="Meta Type"
                  list="support-meta-types"
                  placeholder="e.g. FAQ"
                  value={data.metaType}
                  disabled={readOnly}
                  onChange={(e) => set('metaType', e.target.value)}
                />
                <datalist id="support-meta-types">
                  {META_TYPE_SUGGESTIONS.map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>

              <Input label="Code" placeholder="Optional reference code" value={data.code} disabled={readOnly} onChange={(e) => set('code', e.target.value)} />
              <Input label="Title" placeholder="Unique title" value={data.title} disabled={readOnly} onChange={(e) => set('title', e.target.value)} />

              <SelectField
                label="Tenant Type"
                options={TENANT_TYPE_OPTIONS}
                value={data.tenantType}
                disabled={readOnly}
                onChange={(v) => set('tenantType', v as SupportTenantType)}
              />
              <SelectField
                label="Status"
                options={STATUS_OPTIONS}
                value={data.status}
                disabled={readOnly}
                onChange={(v) => set('status', v as SupportStatus)}
              />

              <Input label="Request URL" placeholder="https://… or /path" value={data.requestUrl} disabled={readOnly} onChange={(e) => set('requestUrl', e.target.value)} />
            </CardContent>
          </Card>

          {/* ── Right: help-content editor (spans 2/3) ──────────────────────── */}
          <div className="flex flex-col gap-1 lg:col-span-2">
            <Label>Help Content</Label>
            <HtmlEditor
              value={data.help}
              readOnly={readOnly}
              onChange={(html) => set('help', html)}
              minHeight={600}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
