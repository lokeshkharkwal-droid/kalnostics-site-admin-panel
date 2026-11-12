'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, TextArea, Toggle, PageLoader } from '@/shared/ui'
import {
  getMasterProduct,
  updateMasterProductPrescription,
  type IMasterProductPrescription,
} from '../services/master-products.api'
import type { IMasterProduct } from '../interfaces'

/** String-based form mirror of the prescription fields (numbers coerced on save). */
interface DrugsForm {
  hasPrescriptionFields: boolean
  composition: string
  strength: string
  unitType: string
  formulation: string
  route: string
  frequency: string
  numberOfDays: string
  prescriptionQuantity: string
  refills: boolean
  refillTimes: string
  prescriptionNotes: string
}

const s = (v: string | null | undefined): string => v ?? ''
const n = (v: number | null | undefined): string => (v == null ? '' : String(v))
const toStr = (v: string): string | null => (v.trim() === '' ? null : v.trim())
const toNum = (v: string): number | null => (v.trim() === '' ? null : Number(v))

/** Hydrate the drugs form from a loaded product. */
function toDrugsForm(p: IMasterProduct): DrugsForm {
  return {
    hasPrescriptionFields: p.hasPrescriptionFields ?? false,
    composition: s(p.composition),
    strength: s(p.strength),
    unitType: s(p.unitType),
    formulation: s(p.formulation),
    route: s(p.route),
    frequency: s(p.frequency),
    numberOfDays: n(p.numberOfDays),
    prescriptionQuantity: n(p.prescriptionQuantity),
    refills: p.refills ?? false,
    refillTimes: n(p.refillTimes),
    prescriptionNotes: s(p.prescriptionNotes),
  }
}

/** Convert the string-based drugs form into the backend prescription payload. */
function toPayload(form: DrugsForm): IMasterProductPrescription {
  return {
    hasPrescriptionFields: form.hasPrescriptionFields,
    composition: toStr(form.composition),
    strength: toStr(form.strength),
    unitType: toStr(form.unitType),
    formulation: toStr(form.formulation),
    route: toStr(form.route),
    frequency: toStr(form.frequency),
    numberOfDays: toNum(form.numberOfDays),
    prescriptionQuantity: toNum(form.prescriptionQuantity),
    refills: form.refills,
    refillTimes: toNum(form.refillTimes),
    prescriptionNotes: toStr(form.prescriptionNotes),
  }
}

/**
 * The list's "Drugs" quick-edit modal: shows and edits only the PRESCRIPTION
 * fields of a master product. Detail is fetched on open; Save patches just the
 * prescription subset via `updateMasterProductPrescription`.
 */
export function DrugsModal({
  product,
  onClose,
}: {
  product: IMasterProduct
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState<DrugsForm | null>(null)

  const detailQuery = useQuery({
    queryKey: ['inventory', 'master-products', 'detail', product.id],
    queryFn: () => getMasterProduct(product.id),
  })

  // Hydrate the editable form once the detail lands (keep local edits after that).
  if (form === null && detailQuery.data) {
    setForm(toDrugsForm(detailQuery.data))
  }

  const set = <K extends keyof DrugsForm>(key: K, value: DrugsForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  const mutation = useMutation({
    mutationFn: (f: DrugsForm) => updateMasterProductPrescription(product.id, toPayload(f)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'master-products'] })
      onClose()
    },
  })

  const busy = mutation.isPending
  const loading = detailQuery.isLoading || !form

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-notion-line px-5 py-3.5">
          <h2 className="truncate text-sm font-semibold text-notion-text">
            Drugs — {product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-notion-faint transition-colors hover:text-notion-sub"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="py-10">
              <PageLoader />
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-notion-text">
                <Toggle
                  checked={form.hasPrescriptionFields}
                  onChange={(v) => set('hasPrescriptionFields', v)}
                  disabled={busy}
                />
                Has prescription fields
              </label>

              <div className="grid grid-cols-3 gap-3">
                <Input label="Composition" value={form.composition} onChange={(e) => set('composition', e.target.value)} disabled={busy} />
                <Input label="Strength" value={form.strength} onChange={(e) => set('strength', e.target.value)} placeholder="500mg" disabled={busy} />
                <Input label="Unit type" value={form.unitType} onChange={(e) => set('unitType', e.target.value)} disabled={busy} />
                <Input label="Formulation" value={form.formulation} onChange={(e) => set('formulation', e.target.value)} disabled={busy} />
                <Input label="Route" value={form.route} onChange={(e) => set('route', e.target.value)} disabled={busy} />
                <Input label="Frequency" value={form.frequency} onChange={(e) => set('frequency', e.target.value)} disabled={busy} />
                <Input label="Number of days" type="number" value={form.numberOfDays} onChange={(e) => set('numberOfDays', e.target.value)} disabled={busy} />
                <Input label="Prescription quantity" type="number" value={form.prescriptionQuantity} onChange={(e) => set('prescriptionQuantity', e.target.value)} disabled={busy} />
                <Input label="Refill times" type="number" value={form.refillTimes} onChange={(e) => set('refillTimes', e.target.value)} disabled={busy || !form.refills} />
              </div>

              <label className="flex items-center gap-2 text-sm text-notion-text">
                <Toggle checked={form.refills} onChange={(v) => set('refills', v)} disabled={busy} />
                Refills allowed
              </label>

              <TextArea
                label="Prescription notes"
                value={form.prescriptionNotes}
                onChange={(e) => set('prescriptionNotes', e.target.value)}
                rows={2}
                disabled={busy}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-notion-line px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" loading={busy} disabled={loading} onClick={() => form && mutation.mutate(form)}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
