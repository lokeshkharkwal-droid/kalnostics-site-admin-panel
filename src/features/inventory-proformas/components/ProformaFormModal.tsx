'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Input,
  SelectField,
  TextArea,
  Toggle,
  PaginatedSelect,
  type SelectOption,
} from '@/shared/ui'
import { fetchProductPage } from '@/features/inventory-print-barcode/services/print-barcode.api'
import {
  createProforma,
  getProforma,
  updateProforma,
  fetchLabTestPage,
  fetchProformaLabelMaps,
  type IProforma,
  type IProformaPayload,
} from '../services/proformas.api'

interface Props {
  proforma?: IProforma | null
  onClose: () => void
}

/** A line being edited in the form — either a master product or a lab test. */
interface LineRow {
  key: string
  type: 'PRODUCT' | 'LABTEST'
  option: SelectOption | null
  quantity: number
}

/** Today in `YYYY-MM-DD` for the default date. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

let lineSeq = 0
const newLine = (): LineRow => ({
  key: `line-${lineSeq++}`,
  type: 'PRODUCT',
  option: null,
  quantity: 1,
})

export function ProformaFormModal({ proforma, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = !!proforma

  const [name, setName] = useState(proforma?.name ?? '')
  const [date, setDate] = useState(proforma?.date ? proforma.date.slice(0, 10) : todayIso())
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(proforma?.status ?? 'ACTIVE')
  const [lines, setLines] = useState<LineRow[]>([])
  const [showMore, setShowMore] = useState(!!proforma?.notes)
  const [notes, setNotes] = useState(proforma?.notes ?? '')
  const [formError, setFormError] = useState('')

  // On edit, hydrate items (incl. product labels) from the detail endpoint.
  const detail = useQuery({
    queryKey: ['inventory', 'proformas', 'detail', proforma?.id],
    queryFn: () => getProforma(proforma!.id),
    enabled: isEdit,
  })

  // Items store only ids; resolve display names from these id→name maps.
  const labelMaps = useQuery({
    queryKey: ['inventory', 'proformas', 'labelMaps'],
    queryFn: fetchProformaLabelMaps,
    enabled: isEdit,
  })

  useEffect(() => {
    if (!detail.data) return
    const products = labelMaps.data?.products
    const labTests = labelMaps.data?.labTests
    const items = detail.data.items ?? []
    const rows = items
      .filter((it) => it.masterProductId || it.labTestId)
      .map<LineRow>((it) => {
        const id = (it.labTestId ?? it.masterProductId) as string
        const label = (it.labTestId ? labTests?.get(id) : products?.get(id)) ?? id
        return {
          key: `line-${lineSeq++}`,
          type: it.labTestId ? 'LABTEST' : 'PRODUCT',
          option: { id, label },
          quantity: it.quantity,
        }
      })
    setLines(rows.length ? rows : [newLine()])
    if (detail.data.notes) {
      setNotes(detail.data.notes)
      setShowMore(true)
    }
  }, [detail.data, labelMaps.data])

  // Fresh form starts with one empty line.
  useEffect(() => {
    if (!isEdit) setLines([newLine()])
  }, [isEdit])

  function addLine() {
    setLines((ls) => [...ls, newLine()])
  }
  function removeLine(key: string) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls))
  }
  function setLineProduct(key: string, opt: SelectOption | null) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, option: opt } : l)))
  }
  function setLineType(key: string, type: 'PRODUCT' | 'LABTEST') {
    // Switching the line kind clears the previous selection.
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, type, option: null } : l)))
  }
  function setLineQty(key: string, qty: number) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, qty || 1) } : l)))
  }

  const mutation = useMutation({
    mutationFn: (payload: IProformaPayload) =>
      isEdit ? updateProforma(proforma!.id, payload) : createProforma(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'proformas'] })
      onClose()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string }; message?: string | string[] } } }
      const raw = e?.response?.data?.error?.message ?? e?.response?.data?.message ?? 'Failed to save'
      setFormError(Array.isArray(raw) ? raw[0] : String(raw))
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!name.trim()) return setFormError('Name is required')
    const items = lines
      .filter((l) => l.option)
      .map((l) =>
        l.type === 'LABTEST'
          ? { labTestId: l.option!.id, quantity: l.quantity }
          : { masterProductId: l.option!.id, quantity: l.quantity },
      )
    mutation.mutate({
      name: name.trim(),
      date: date || undefined,
      status,
      notes: showMore ? notes.trim() || undefined : undefined,
      items,
    })
  }

  const busy = mutation.isPending || (isEdit && detail.isLoading)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
          <h2 className="text-sm font-semibold text-notion-text">
            {isEdit ? 'Edit Proforma' : 'Create Proforma'}
          </h2>
          <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly reagent pack" disabled={busy} />
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={busy} />
          </div>

          <div className="w-48">
            <SelectField
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as 'ACTIVE' | 'INACTIVE')}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              disabled={busy}
            />
          </div>

          {/* ── Products ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-notion-text">Add Products / Lab Tests</label>
              <Button type="button" variant="secondary" size="sm" onClick={addLine} disabled={busy}>
                + Add row
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.key} className="flex items-center gap-2">
                  <div className="w-32">
                    <SelectField
                      value={l.type}
                      onChange={(v) => setLineType(l.key, v as 'PRODUCT' | 'LABTEST')}
                      options={[
                        { value: 'PRODUCT', label: 'Product' },
                        { value: 'LABTEST', label: 'Lab Test' },
                      ]}
                      disabled={busy}
                    />
                  </div>
                  <div className="flex-1">
                    <PaginatedSelect
                      queryKey={['inventory', 'proformas', l.type, l.key]}
                      fetchPage={l.type === 'LABTEST' ? fetchLabTestPage : fetchProductPage}
                      value={l.option}
                      onChange={(opt) => setLineProduct(l.key, opt)}
                      placeholder={l.type === 'LABTEST' ? 'Select a lab test…' : 'Select a master product…'}
                      disabled={busy}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min={1}
                      value={String(l.quantity)}
                      onChange={(e) => setLineQty(l.key, Number(e.target.value))}
                      disabled={busy}
                      placeholder="Qty"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(l.key)}
                    disabled={lines.length <= 1 || busy}
                    className="text-notion-faint transition-colors hover:text-notion-red disabled:opacity-30"
                    title="Remove row"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── More options ── */}
          <label className="flex items-center gap-2 text-sm text-notion-text">
            <Toggle checked={showMore} onChange={setShowMore} disabled={busy} />
            More Options
          </label>
          {showMore && (
            <TextArea
              label="Notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={busy}
              placeholder="Any additional notes…"
            />
          )}

          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending} disabled={busy}>
              {isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
