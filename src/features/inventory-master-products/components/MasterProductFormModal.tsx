'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, Toggle, PaginatedSelect, type SelectOption } from '@/shared/ui'
import { createMasterProduct, updateMasterProduct } from '../services/master-products.api'
import { fetchReferencePage } from '@/features/inventory-reference/services/reference.api'
import type { IMasterProduct, IMasterProductForm } from '../interfaces'

interface Props {
  product?: IMasterProduct | null
  onClose: () => void
}

function toForm(p?: IMasterProduct | null): IMasterProductForm {
  return {
    name: p?.name ?? '',
    code: p?.code ?? '',
    category: p?.category ?? '',
    subCategory: p?.subCategory ?? '',
    unit: p?.unit ?? '',
    brand: p?.brand ?? '',
    price: p?.price != null ? String(p.price) : '',
    cost: p?.cost != null ? String(p.cost) : '',
    hsnCode: p?.hsnCode ?? '',
    taxName: p?.taxName ?? '',
    taxRate: p?.taxRate != null ? String(p.taxRate) : '',
    description: p?.description ?? '',
    genericName: p?.genericName ?? '',
    strength: p?.strength ?? '',
    isImportable: p?.isImportable ?? true,
    isActive: p?.isActive ?? true,
  }
}

/** Build a SelectOption from a stored name (id doesn't matter for name-only fields). */
const nameOpt = (name: string): SelectOption | null => (name ? { id: name, label: name } : null)

function LabelledSelect({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-notion-text">{label}</label>
      {children}
    </div>
  )
}

export function MasterProductFormModal({ product, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = !!product
  const [form, setForm] = useState<IMasterProductForm>(() => toForm(product))
  const [categoryOpt, setCategoryOpt] = useState<SelectOption | null>(
    product?.category ? { id: '', label: product.category } : null,
  )
  const [formError, setFormError] = useState('')

  const set = <K extends keyof IMasterProductForm>(key: K, value: IMasterProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // On edit, resolve the stored category NAME back to its id so sub-categories filter.
  const catResolve = useQuery({
    queryKey: ['inventory', 'reference', 'cat-resolve', product?.category ?? ''],
    queryFn: () =>
      fetchReferencePage('categories', { page: 1, search: product?.category ?? '', pageSize: 20 }),
    enabled: isEdit && !!product?.category && !categoryOpt?.id,
  })
  useEffect(() => {
    if (categoryOpt?.id) return
    const match = catResolve.data?.data.find(
      (d) => d.name.toLowerCase() === (product?.category ?? '').toLowerCase(),
    )
    if (match) setCategoryOpt({ id: match.id, label: match.name })
  }, [catResolve.data, categoryOpt, product])

  const mutation = useMutation({
    mutationFn: (f: IMasterProductForm) =>
      isEdit ? updateMasterProduct(product!.id, f) : createMasterProduct(f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'master-products'] })
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('Name is required')
    mutation.mutate(form)
  }

  const busy = mutation.isPending
  const catId = categoryOpt?.id ?? ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
          <h2 className="text-sm font-semibold text-notion-text">
            {isEdit ? 'Edit Master Product' : 'Create Master Product'}
          </h2>
          <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Paracetamol 500mg" disabled={busy} />
            <Input label="Code" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="MP-PARA500" disabled={busy} />

            <LabelledSelect label="Category">
              <PaginatedSelect
                queryKey={['inventory', 'reference', 'categories', 'mp']}
                fetchPage={({ page, search, pageSize }) => fetchReferencePage('categories', { page, search, pageSize })}
                value={categoryOpt}
                onChange={(opt) => {
                  setCategoryOpt(opt)
                  set('category', opt?.label ?? '')
                  set('subCategory', '')
                }}
                disabled={busy}
              />
            </LabelledSelect>
            <LabelledSelect label="Sub-category">
              <PaginatedSelect
                queryKey={['inventory', 'reference', 'sub-categories', 'mp', catId]}
                fetchPage={({ page, search, pageSize }) =>
                  fetchReferencePage('sub-categories', { page, search, pageSize, categoryId: catId })
                }
                value={nameOpt(form.subCategory)}
                onChange={(opt) => set('subCategory', opt?.label ?? '')}
                disabled={busy || !catId}
                placeholder={catId ? 'Select…' : 'Pick a category first'}
              />
            </LabelledSelect>
            <LabelledSelect label="Unit">
              <PaginatedSelect
                queryKey={['inventory', 'reference', 'units', 'mp']}
                fetchPage={({ page, search, pageSize }) => fetchReferencePage('units', { page, search, pageSize })}
                value={nameOpt(form.unit)}
                onChange={(opt) => set('unit', opt?.label ?? '')}
                disabled={busy}
              />
            </LabelledSelect>
            <LabelledSelect label="Brand">
              <PaginatedSelect
                queryKey={['inventory', 'reference', 'brands', 'mp']}
                fetchPage={({ page, search, pageSize }) => fetchReferencePage('brands', { page, search, pageSize })}
                value={nameOpt(form.brand)}
                onChange={(opt) => set('brand', opt?.label ?? '')}
                disabled={busy}
              />
            </LabelledSelect>

            <Input label="Cost" type="number" value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="14" disabled={busy} />
            <Input label="Price" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="25" disabled={busy} />
            <Input label="HSN code" value={form.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} placeholder="3004" disabled={busy} />
            <LabelledSelect label="Tax rate">
              <PaginatedSelect
                queryKey={['inventory', 'reference', 'tax-rates', 'mp']}
                fetchPage={({ page, search, pageSize }) => fetchReferencePage('tax-rates', { page, search, pageSize })}
                value={nameOpt(form.taxName)}
                onChange={(opt) => set('taxName', opt?.label ?? '')}
                disabled={busy}
              />
            </LabelledSelect>
            <Input label="Generic name" value={form.genericName} onChange={(e) => set('genericName', e.target.value)} placeholder="Paracetamol" disabled={busy} />
            <Input label="Strength" value={form.strength} onChange={(e) => set('strength', e.target.value)} placeholder="500mg" disabled={busy} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-notion-text">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              disabled={busy}
              rows={2}
              className="w-full rounded-md border border-notion-line2 bg-white px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-notion-text">
              <Toggle checked={form.isImportable} onChange={(v) => set('isImportable', v)} />
              Importable by tenants
            </label>
            <label className="flex items-center gap-2 text-sm text-notion-text">
              <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} />
              Active
            </label>
          </div>

          {formError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {isEdit ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
