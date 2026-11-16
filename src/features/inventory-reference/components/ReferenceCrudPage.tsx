'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AdminHeader } from '@/widgets/AdminHeader'
import {
  Button,
  Input,
  Badge,
  PageLoader,
  Toggle,
  Modal,
  DataTable,
  PaginatedSelect,
  SelectField,
  TextArea,
  type Column,
  type SelectOption,
} from '@/shared/ui'
import { useDebouncedValue } from '@/shared/hooks'
import {
  listReference,
  fetchReferencePage,
  createReference,
  updateReference,
  deleteReference,
  uploadReferenceImage,
  type IReferenceRow,
} from '../services/reference.api'
import { PrintBarcodeModal } from './PrintBarcodeModal'

/**
 * A single editable field in a reference form. One declarative shape drives
 * every variant of the reference CRUD modal, so each list page only describes
 * *which* fields it has — not how to render or submit them.
 */
export interface ReferenceField {
  /** Payload key sent to the backend AND read back off the row. */
  key: string
  label: string
  kind: 'text' | 'number' | 'textarea' | 'image' | 'select' | 'reference'
  required?: boolean
  placeholder?: string
  /** `select` only — the static options to choose from. */
  options?: { value: string; label: string }[]
  /** `select` only — default value for a new record (e.g. tax type "percentage"). */
  defaultValue?: string
  /** `reference` only — the resource to page through (e.g. 'categories', 'tax-rates'). */
  referenceResource?: string
  /**
   * `reference` only — where the already-selected option lives on the row, so an
   * edit can pre-fill the picker. Defaults to `{ key: category }` / `{ key }Id`.
   */
  referenceRelationKey?: string
}

/** Declarative config: one component powers every reference list. */
export interface ReferenceConfig {
  resource: string // e.g. 'categories'
  title: string
  singular: string // e.g. 'Category'
  /** Form fields in display order. */
  fields: ReferenceField[]
  /** Extra list columns beyond the always-present Name/Status. */
  columns?: Column<IReferenceRow>[]
  /**
   * When `true`, each row gets a "Print Barcode" action that previews and prints
   * a barcode of the row's `code` (falling back to its name). Used by Categories.
   */
  printBarcode?: boolean
}

const LIMIT = 20

type FieldValue = string
type FormState = Record<string, FieldValue>

export function ReferenceCrudPage({ config }: { config: ReferenceConfig }) {
  const qc = useQueryClient()
  const key = ['inventory', 'reference', config.resource] as const
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<IReferenceRow | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<IReferenceRow | null>(null)
  const [barcodeRow, setBarcodeRow] = useState<IReferenceRow | null>(null)

  const debounced = useDebouncedValue(search, 400)
  useEffect(() => {
    setPage(1)
  }, [debounced])

  const { data, isLoading } = useQuery({
    queryKey: [...key, { search: debounced, page }],
    queryFn: () => listReference(config.resource, { page, limit: LIMIT, search: debounced }),
    placeholderData: keepPreviousData,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReference(config.resource, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      setConfirmDelete(null)
    },
  })

  const columns: Column<IReferenceRow>[] = [
    { header: 'Name', cell: (r) => r.name, width: 220 },
    ...(config.columns ?? []),
    {
      header: 'Status',
      truncate: false,
      cell: (r) => (
        <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
      width: 110,
    },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title={config.title}
        subtitle={`Canonical ${config.title.toLowerCase()} for the global inventory catalogue`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            + New {config.singular}
          </Button>
        }
      />

      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="ml-auto text-xs text-notion-faint">
            {total} {total === 1 ? 'item' : 'items'}
          </span>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            emptyMessage={`No ${config.title.toLowerCase()} yet`}
            actions={(r) => (
              <div className="flex gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(r)
                    setShowForm(true)
                  }}
                >
                  Edit
                </Button>
                {config.printBarcode && (
                  <Button variant="secondary" size="sm" onClick={() => setBarcodeRow(r)}>
                    Print Barcode
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(r)}>
                  Delete
                </Button>
              </div>
            )}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-notion-sub">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <ReferenceFormModal
          config={config}
          row={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: key })
            setShowForm(false)
          }}
        />
      )}

      {barcodeRow && (
        <PrintBarcodeModal row={barcodeRow} onClose={() => setBarcodeRow(null)} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-xl border border-notion-line bg-white p-6 shadow-xl">
            <h2 className="text-sm font-semibold text-notion-text">Remove {config.singular}?</h2>
            <p className="text-sm text-notion-sub">
              Remove <strong>{confirmDelete.name}</strong>? Products already imported are not affected.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)} disabled={deleteMutation.isPending}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(confirmDelete.id)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Read a field's initial string value off an existing row (for editing). */
function initialValue(field: ReferenceField, row: IReferenceRow | null): string {
  if (!row) return field.kind === 'select' ? field.defaultValue ?? '' : ''
  const raw = (row as unknown as Record<string, unknown>)[field.key]
  if (raw == null) return field.kind === 'select' ? field.defaultValue ?? '' : ''
  return String(raw)
}

function ReferenceFormModal({
  config,
  row,
  onClose,
  onSaved,
}: {
  config: ReferenceConfig
  row: IReferenceRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!row
  const [form, setForm] = useState<FormState>(() => {
    const state: FormState = { isActive: row ? String(row.isActive) : 'true' }
    for (const f of config.fields) state[f.key] = initialValue(f, row)
    return state
  })
  const [formError, setFormError] = useState('')

  // Selected option objects for every `reference` field, keyed by field key.
  const [refOptions, setRefOptions] = useState<Record<string, SelectOption | null>>(() => {
    const init: Record<string, SelectOption | null> = {}
    for (const f of config.fields) {
      if (f.kind !== 'reference') continue
      const relation = (row as Record<string, unknown> | null)?.[f.referenceRelationKey ?? f.key.replace(/Id$/, '')] as
        | { id: string; name: string }
        | null
        | undefined
      init[f.key] = relation ? { id: relation.id, label: relation.name } : null
    }
    return init
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const isActive = form.isActive === 'true'

  const mutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = { isActive }
      for (const f of config.fields) {
        if (f.kind === 'reference') {
          body[f.key] = refOptions[f.key]?.id ?? null
          continue
        }
        const v = form[f.key]?.trim() ?? ''
        if (f.kind === 'number') {
          body[f.key] = v === '' ? (f.required ? 0 : null) : Number(v)
        } else {
          body[f.key] = v === '' ? null : v
        }
      }
      return isEdit
        ? updateReference(config.resource, row!.id, body)
        : createReference(config.resource, body)
    },
    onSuccess: onSaved,
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    for (const f of config.fields) {
      if (!f.required) continue
      const missing = f.kind === 'reference' ? !refOptions[f.key] : !(form[f.key]?.trim())
      if (missing) return setFormError(`${f.label} is required`)
    }
    mutation.mutate()
  }

  const busy = mutation.isPending

  return (
    <Modal
      title={isEdit ? `Edit ${config.singular}` : `Create ${config.singular}`}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="reference-form" loading={busy}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="reference-form" onSubmit={submit} className="space-y-4">
        {config.fields.map((f) => (
          <FieldControl
            key={f.key}
            field={f}
            value={form[f.key] ?? ''}
            onChange={(v) => set(f.key, v)}
            refOption={refOptions[f.key] ?? null}
            onRefChange={(opt) => setRefOptions((prev) => ({ ...prev, [f.key]: opt }))}
            disabled={busy}
          />
        ))}

        <label className="flex items-center gap-2 text-sm text-notion-text">
          <Toggle checked={isActive} onChange={(v) => set('isActive', String(v))} />
          Active
        </label>

        {formError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
        )}
      </form>
    </Modal>
  )
}

function FieldControl({
  field,
  value,
  onChange,
  refOption,
  onRefChange,
  disabled,
}: {
  field: ReferenceField
  value: string
  onChange: (v: string) => void
  refOption: SelectOption | null
  onRefChange: (opt: SelectOption | null) => void
  disabled: boolean
}) {
  const label = field.required ? field.label : `${field.label} (optional)`

  switch (field.kind) {
    case 'textarea':
      return (
        <TextArea
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          disabled={disabled}
          placeholder={field.placeholder}
        />
      )
    case 'select':
      return (
        <SelectField
          label={label}
          options={field.options ?? []}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      )
    case 'reference':
      return (
        <div>
          <label className="mb-1 block text-xs font-medium text-notion-sub">{label}</label>
          <PaginatedSelect
            queryKey={['inventory', 'reference', field.referenceResource ?? '', 'picker']}
            fetchPage={({ page, search, pageSize }) =>
              fetchReferencePage(field.referenceResource ?? '', { page, search, pageSize })
            }
            value={refOption}
            onChange={onRefChange}
            disabled={disabled}
            placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}…`}
          />
        </div>
      )
    case 'image':
      return <ImageField label={label} value={value} onChange={onChange} disabled={disabled} />
    case 'number':
      return (
        <Input
          label={label}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )
    default:
      return (
        <Input
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )
  }
}

/** Image upload + preview field (uploads to S3, stores the resolved URL). */
function ImageField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const { url } = await uploadReferenceImage(file)
      onChange(url)
      toast.success('Image uploaded')
    } catch {
      /* error toast handled globally by the api interceptor */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-notion-sub">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-14 w-14 rounded-md border border-notion-line object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-notion-line2 text-[10px] text-notion-faint">
            No image
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={busy}
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {value ? 'Replace' : 'Upload'}
          </Button>
          {value && (
            <Button type="button" variant="danger" size="sm" disabled={disabled || busy} onClick={() => onChange('')}>
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
