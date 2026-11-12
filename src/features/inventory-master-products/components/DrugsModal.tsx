'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, PageLoader } from '@/shared/ui'
import {
  listProductDrugs,
  addProductDrug,
  deleteProductDrug,
} from '../services/master-products.api'
import type { IMasterProduct } from '../interfaces'

/**
 * The list's "Drugs" modal (EZ Health Track parity): manages a master product's
 * drug-composition list — each row is a drug name + unit value + unit. Rows are
 * added and removed immediately via the product's `/drugs` sub-resource.
 */
export function DrugsModal({
  product,
  onClose,
}: {
  product: IMasterProduct
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [unitValue, setUnitValue] = useState('')
  const [unit, setUnit] = useState('')

  const drugsQuery = useQuery({
    queryKey: ['inventory', 'master-products', 'drugs', product.id],
    queryFn: () => listProductDrugs(product.id),
  })

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['inventory', 'master-products', 'drugs', product.id] })

  const addMutation = useMutation({
    mutationFn: () =>
      addProductDrug(product.id, {
        name: name.trim(),
        unitValue: unitValue.trim() || undefined,
        unit: unit.trim() || undefined,
      }),
    onSuccess: () => {
      setName('')
      setUnitValue('')
      setUnit('')
      invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (drugId: string) => deleteProductDrug(product.id, drugId),
    onSuccess: invalidate,
  })

  const busy = addMutation.isPending || deleteMutation.isPending
  const drugs = drugsQuery.data ?? []
  const canAdd = name.trim() !== '' && !busy

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
          {/* Add row */}
          <div className="grid grid-cols-[1fr_140px_140px_auto] items-end gap-2">
            <Input
              label="Drug"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Paracetamol"
              disabled={busy}
            />
            <Input
              label="Unit value"
              value={unitValue}
              onChange={(e) => setUnitValue(e.target.value)}
              placeholder="500"
              disabled={busy}
            />
            <Input
              label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="mg"
              disabled={busy}
            />
            <Button
              size="sm"
              onClick={() => addMutation.mutate()}
              loading={addMutation.isPending}
              disabled={!canAdd}
            >
              Add
            </Button>
          </div>

          {/* List */}
          <div className="mt-5">
            {drugsQuery.isLoading ? (
              <div className="py-8">
                <PageLoader />
              </div>
            ) : drugs.length === 0 ? (
              <p className="py-6 text-center text-sm text-notion-faint">No drugs added yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-notion-line text-left text-[11px] font-semibold uppercase text-notion-faint">
                    <th className="py-2">Drug</th>
                    <th className="py-2">Unit</th>
                    <th className="w-16 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map((d) => (
                    <tr key={d.id} className="border-b border-notion-line/60">
                      <td className="py-2 text-notion-text">{d.name}</td>
                      <td className="py-2 text-notion-sub">
                        {[d.unitValue, d.unit].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          aria-label="Delete drug"
                          onClick={() => deleteMutation.mutate(d.id)}
                          disabled={busy}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-notion-faint hover:bg-notion-hover hover:text-notion-red disabled:opacity-40"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-notion-line px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
