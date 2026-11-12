'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Input,
  Toggle,
  PaginatedSelect,
  SelectField,
  TextArea,
  PageLoader,
  type SelectOption,
} from '@/shared/ui'
import { fetchReferencePage } from '@/features/inventory-reference/services/reference.api'
import {
  createMasterProduct,
  updateMasterProduct,
  fetchSupplierOptionsPage,
  fetchManufacturerOptionsPage,
  fetchVariantOptionsPage,
  hasAnyVariantMaster,
} from '../services/master-products.api'
import type {
  IMasterProduct,
  IMasterProductForm,
  IMasterProductSupplier,
  IMasterProductVariant,
} from '../interfaces'
import { CUSTOM_FIELD_COUNT } from '../interfaces'
import {
  BARCODE_OPTIONS,
  MAX_SUPPLIERS,
  PRODUCT_SECTIONS,
  SALES_METHOD_OPTIONS,
  TAX_METHOD_OPTIONS,
  TYPE_OPTIONS,
} from '../utils/constants'
import { emptyForm, toForm } from '../utils/mapping'
import { ImageField, GalleryField } from './ImageField'

interface Props {
  /** The loaded product for edit (already fetched with nested rows), or null to create. */
  product: IMasterProduct | null
  /** True while the edit detail is still loading (edit mode only). */
  loading?: boolean
  onClose: () => void
}

const sectionId = (s: string) => `mpsec-${s.replace(/\s+/g, '-').toLowerCase()}`

/** The custom-field form keys (cf1..cf11) — all map to `string` on the form. */
type CustomFieldKey = 'cf1' | 'cf2' | 'cf3' | 'cf4' | 'cf5' | 'cf6' | 'cf7' | 'cf8' | 'cf9' | 'cf10' | 'cf11'

/** A jump-anchored form section block. */
function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4">
      <h3 className="mb-3 border-b border-notion-line pb-1.5 text-sm font-semibold text-notion-text">
        {title}
      </h3>
      {children}
    </section>
  )
}

/** A section header with an inline enable toggle (for gated sections). */
function GatedBlock({
  id,
  title,
  enabled,
  onToggle,
  children,
}: {
  id: string
  title: string
  enabled: boolean
  onToggle: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <div className="mb-3 flex items-center justify-between border-b border-notion-line pb-1.5">
        <h3 className="text-sm font-semibold text-notion-text">{title}</h3>
        <label className="flex items-center gap-2 text-xs text-notion-sub">
          <Toggle checked={enabled} onChange={onToggle} />
          {enabled ? 'Enabled' : 'Disabled'}
        </label>
      </div>
      {enabled ? children : <p className="text-xs text-notion-faint">Enable to configure this section.</p>}
    </section>
  )
}

function LabelledSelect({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-notion-sub">{label}</label>
      {children}
    </div>
  )
}

const opt = (id: string, label: string): SelectOption | null => (id ? { id, label } : null)

export function MasterProductFormModal({ product, loading, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = !!product
  const [form, setForm] = useState<IMasterProductForm>(() => (product ? toForm(product) : emptyForm()))
  const [formError, setFormError] = useState('')

  const set = <K extends keyof IMasterProductForm>(key: K, value: IMasterProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  // Variant rows pick their name from the SiteAdmin Variant Master. When the
  // master is empty we fall back to a free-text name input so authoring isn't
  // blocked before any variants have been defined.
  const variantMasterQuery = useQuery({
    queryKey: ['inventory', 'master-reference', 'variants', 'has-any'],
    queryFn: hasAnyVariantMaster,
  })
  const useVariantMaster = variantMasterQuery.data !== false

  const mutation = useMutation({
    mutationFn: (f: IMasterProductForm) =>
      isEdit ? updateMasterProduct(product!.id, f) : createMasterProduct(f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory', 'master-products'] })
      onClose()
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function submit() {
    setFormError('')
    if (!form.name.trim()) return setFormError('Name is required')
    if (form.cost.trim() === '') return setFormError('Unit Cost is required')
    if (form.price.trim() === '') return setFormError('Unit MRP is required')
    mutation.mutate(form)
  }

  const scrollTo = (s: string) =>
    document.getElementById(sectionId(s))?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const busy = mutation.isPending

  /* ── variant row helpers ───────────────────────────────────────────────── */
  const addVariant = () =>
    set('variants', [...form.variants, { name: '', cost: null, price: null }])
  const updateVariant = (i: number, patch: Partial<IMasterProductVariant>) =>
    set(
      'variants',
      form.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)),
    )
  const removeVariant = (i: number) =>
    set('variants', form.variants.filter((_, idx) => idx !== i))

  /* ── supplier row helpers ──────────────────────────────────────────────── */
  const addSupplier = () =>
    set('suppliers', [
      ...form.suppliers,
      { supplierId: '', supplierName: '', partNumber: '', price: null },
    ])
  const updateSupplier = (i: number, patch: Partial<IMasterProductSupplier>) =>
    set(
      'suppliers',
      form.suppliers.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    )
  const removeSupplier = (i: number) =>
    set('suppliers', form.suppliers.filter((_, idx) => idx !== i))

  const customFields = Array.from(
    { length: CUSTOM_FIELD_COUNT },
    (_, i) => `cf${i + 1}` as CustomFieldKey,
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-notion-line bg-white shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-notion-line px-6 py-3.5">
          <h2 className="text-sm font-semibold text-notion-text">
            {isEdit ? 'Edit Product' : 'Add Product'}
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

        {loading ? (
          <div className="flex-1 p-10">
            <PageLoader />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            {/* Jump nav */}
            <aside className="w-44 shrink-0 overflow-y-auto border-r border-notion-line bg-notion-sidebar px-2 py-3">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase text-notion-faint">Jump to</p>
              <nav className="space-y-0.5">
                {PRODUCT_SECTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => scrollTo(s)}
                    className="block w-full rounded px-2 py-1.5 text-left text-xs text-notion-sub hover:bg-notion-hover hover:text-notion-text"
                  >
                    {s}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Sections */}
            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-4">
              {/* ───────────────────────── BASIC ───────────────────────── */}
              <Block id={sectionId('Basic')} title="Basic">
                <div className="grid grid-cols-3 gap-3">
                  <SelectField
                    label="Type"
                    value={form.type}
                    onChange={(v) => set('type', v as IMasterProductForm['type'])}
                    options={TYPE_OPTIONS}
                    disabled={busy}
                  />
                  <Input
                    label="Name *"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Paracetamol 500mg"
                    disabled={busy}
                  />
                  <Input
                    label="Code"
                    value={form.code}
                    onChange={(e) => set('code', e.target.value)}
                    placeholder="MP-PARA500"
                    disabled={busy}
                  />

                  <SelectField
                    label="Barcode symbology"
                    value={form.barcodeSymbology}
                    onChange={(v) => set('barcodeSymbology', v as IMasterProductForm['barcodeSymbology'])}
                    options={BARCODE_OPTIONS}
                    disabled={busy}
                  />
                  <LabelledSelect label="Category">
                    <PaginatedSelect
                      queryKey={['inventory', 'reference', 'categories', 'mp']}
                      fetchPage={({ page, search, pageSize }) =>
                        fetchReferencePage('categories', { page, search, pageSize })
                      }
                      value={opt(form.categoryId, form.categoryName)}
                      onChange={(o) => {
                        set('categoryId', o?.id ?? '')
                        set('categoryName', o?.label ?? '')
                        set('subCategoryId', '')
                        set('subCategoryName', '')
                      }}
                      disabled={busy}
                    />
                  </LabelledSelect>
                  <LabelledSelect label="Sub-category">
                    <PaginatedSelect
                      queryKey={['inventory', 'reference', 'sub-categories', 'mp', form.categoryId]}
                      fetchPage={({ page, search, pageSize }) =>
                        fetchReferencePage('sub-categories', {
                          page,
                          search,
                          pageSize,
                          categoryId: form.categoryId,
                        })
                      }
                      value={opt(form.subCategoryId, form.subCategoryName)}
                      onChange={(o) => {
                        set('subCategoryId', o?.id ?? '')
                        set('subCategoryName', o?.label ?? '')
                      }}
                      disabled={busy || !form.categoryId}
                      placeholder={form.categoryId ? 'Select…' : 'Pick a category first'}
                    />
                  </LabelledSelect>

                  <LabelledSelect label="Unit">
                    <PaginatedSelect
                      queryKey={['inventory', 'reference', 'units', 'mp']}
                      fetchPage={({ page, search, pageSize }) =>
                        fetchReferencePage('units', { page, search, pageSize })
                      }
                      value={opt(form.unitId, form.unitName)}
                      onChange={(o) => {
                        set('unitId', o?.id ?? '')
                        set('unitName', o?.label ?? '')
                      }}
                      disabled={busy}
                    />
                  </LabelledSelect>
                  <Input
                    label="Pack size"
                    type="number"
                    value={form.packSize}
                    onChange={(e) => set('packSize', e.target.value)}
                    disabled={busy}
                  />
                  <SelectField
                    label="Sales method"
                    value={form.salesMethod}
                    onChange={(v) => set('salesMethod', v as IMasterProductForm['salesMethod'])}
                    options={SALES_METHOD_OPTIONS}
                    disabled={busy}
                  />

                  <Input
                    label="Pack cost"
                    type="number"
                    value={form.packCost}
                    onChange={(e) => set('packCost', e.target.value)}
                    disabled={busy}
                  />
                  <Input
                    label="Unit Cost *"
                    type="number"
                    value={form.cost}
                    onChange={(e) => set('cost', e.target.value)}
                    disabled={busy}
                  />
                  <Input
                    label="Pack MRP"
                    type="number"
                    value={form.packMrp}
                    onChange={(e) => set('packMrp', e.target.value)}
                    disabled={busy}
                  />

                  <Input
                    label="Unit MRP *"
                    type="number"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    disabled={busy}
                  />
                  <LabelledSelect label="Tax rate">
                    <PaginatedSelect
                      queryKey={['inventory', 'reference', 'tax-rates', 'mp']}
                      fetchPage={({ page, search, pageSize }) =>
                        fetchReferencePage('tax-rates', { page, search, pageSize })
                      }
                      value={opt(form.taxRateId, form.taxRateName)}
                      onChange={(o) => {
                        set('taxRateId', o?.id ?? '')
                        set('taxRateName', o?.label ?? '')
                      }}
                      disabled={busy}
                    />
                  </LabelledSelect>
                  <Input
                    label="HSN code"
                    value={form.hsnCode}
                    onChange={(e) => set('hsnCode', e.target.value)}
                    placeholder="3004"
                    disabled={busy}
                  />

                  <SelectField
                    label="Tax method (sales)"
                    value={form.taxMethod}
                    onChange={(v) => set('taxMethod', v as IMasterProductForm['taxMethod'])}
                    options={TAX_METHOD_OPTIONS}
                    disabled={busy}
                  />
                  <SelectField
                    label="Tax method (purchase)"
                    value={form.taxMethodPurchase}
                    onChange={(v) =>
                      set('taxMethodPurchase', v as IMasterProductForm['taxMethodPurchase'])
                    }
                    options={TAX_METHOD_OPTIONS}
                    disabled={busy}
                  />
                  <Input
                    label="Alert quantity"
                    type="number"
                    value={form.alertQuantity}
                    onChange={(e) => set('alertQuantity', e.target.value)}
                    disabled={busy}
                  />

                  <LabelledSelect label="Brand">
                    <PaginatedSelect
                      queryKey={['inventory', 'reference', 'brands', 'mp']}
                      fetchPage={({ page, search, pageSize }) =>
                        fetchReferencePage('brands', { page, search, pageSize })
                      }
                      value={opt(form.brandId, form.brandName)}
                      onChange={(o) => {
                        set('brandId', o?.id ?? '')
                        set('brandName', o?.label ?? '')
                      }}
                      disabled={busy}
                    />
                  </LabelledSelect>
                  <LabelledSelect label="Manufacturer">
                    <PaginatedSelect
                      queryKey={['inventory', 'manufacturers', 'mp']}
                      fetchPage={fetchManufacturerOptionsPage}
                      value={opt(form.manufacturerId, form.manufacturerName)}
                      onChange={(o) => {
                        set('manufacturerId', o?.id ?? '')
                        set('manufacturerName', o?.label ?? '')
                      }}
                      disabled={busy}
                    />
                  </LabelledSelect>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-6">
                  <ImageField
                    label="Product image"
                    value={form.imageUrl}
                    onChange={(url) => set('imageUrl', url)}
                    disabled={busy}
                  />
                  <GalleryField
                    label="Gallery images"
                    value={form.galleryImageUrls}
                    onChange={(urls) => set('galleryImageUrls', urls)}
                    disabled={busy}
                  />
                </div>

                <div className="mt-4 flex items-center gap-8">
                  <label className="flex items-center gap-2 text-sm text-notion-text">
                    <Toggle
                      checked={form.isTrackQuantity}
                      onChange={(v) => set('isTrackQuantity', v)}
                      disabled={busy}
                    />
                    Track quantity
                  </label>
                  <label className="flex items-center gap-2 text-sm text-notion-text">
                    <Toggle
                      checked={form.isImportable}
                      onChange={(v) => set('isImportable', v)}
                      disabled={busy}
                    />
                    Importable by tenants
                  </label>
                  <label className="flex items-center gap-2 text-sm text-notion-text">
                    <Toggle
                      checked={form.isActive}
                      onChange={(v) => set('isActive', v)}
                      disabled={busy}
                    />
                    Active
                  </label>
                </div>
              </Block>

              {/* ─────────────────── PRESCRIPTION FIELDS ─────────────────── */}
              <GatedBlock
                id={sectionId('Prescription Fields')}
                title="Prescription Fields"
                enabled={form.hasPrescriptionFields}
                onToggle={(v) => set('hasPrescriptionFields', v)}
              >
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
                <div className="mt-3 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-notion-text">
                    <Toggle checked={form.refills} onChange={(v) => set('refills', v)} disabled={busy} />
                    Refills allowed
                  </label>
                </div>
                <div className="mt-3">
                  <TextArea
                    label="Prescription notes"
                    value={form.prescriptionNotes}
                    onChange={(e) => set('prescriptionNotes', e.target.value)}
                    rows={2}
                    disabled={busy}
                  />
                </div>
              </GatedBlock>

              {/* ────────────────────── CUSTOM FIELDS ────────────────────── */}
              <GatedBlock
                id={sectionId('Custom Fields')}
                title="Custom Fields"
                enabled={form.hasCustomFields}
                onToggle={(v) => set('hasCustomFields', v)}
              >
                <div className="grid grid-cols-3 gap-3">
                  {customFields.map((key, i) => (
                    <Input
                      key={key}
                      label={`Custom field ${i + 1}`}
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      disabled={busy}
                    />
                  ))}
                </div>
              </GatedBlock>

              {/* ───────────────────────── VARIANTS ───────────────────────── */}
              <Block id={sectionId('Variants')} title="Variants">
                <label className="mb-3 flex items-center gap-2 text-sm text-notion-text">
                  <Toggle
                    checked={form.hasVariants}
                    onChange={(v) => {
                      set('hasVariants', v)
                      if (v && form.variants.length === 0) addVariant()
                    }}
                    disabled={busy}
                  />
                  This product has multiple variants
                </label>

                {form.hasVariants && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_120px_120px_32px] gap-2 px-1 text-[11px] font-semibold uppercase text-notion-faint">
                      <span>Variant name</span>
                      <span>Cost</span>
                      <span>Price</span>
                      <span />
                    </div>
                    {form.variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-[1fr_120px_120px_32px] items-center gap-2">
                        {useVariantMaster ? (
                          <PaginatedSelect
                            queryKey={['inventory', 'master-reference', 'variants', 'mp']}
                            fetchPage={fetchVariantOptionsPage}
                            value={opt(v.name, v.name)}
                            onChange={(o) => updateVariant(i, { name: o?.label ?? '' })}
                            disabled={busy}
                            placeholder="Select variant…"
                          />
                        ) : (
                          <Input
                            value={v.name}
                            onChange={(e) => updateVariant(i, { name: e.target.value })}
                            placeholder="e.g. 250mg"
                            disabled={busy}
                          />
                        )}
                        <Input
                          type="number"
                          value={v.cost == null ? '' : String(v.cost)}
                          onChange={(e) =>
                            updateVariant(i, { cost: e.target.value === '' ? null : Number(e.target.value) })
                          }
                          disabled={busy}
                        />
                        <Input
                          type="number"
                          value={v.price == null ? '' : String(v.price)}
                          onChange={(e) =>
                            updateVariant(i, { price: e.target.value === '' ? null : Number(e.target.value) })
                          }
                          disabled={busy}
                        />
                        <button
                          type="button"
                          aria-label="Remove variant"
                          onClick={() => removeVariant(i)}
                          disabled={busy}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-notion-faint hover:bg-notion-hover hover:text-notion-red"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" size="sm" onClick={addVariant} disabled={busy}>
                      + Add variant
                    </Button>
                  </div>
                )}
              </Block>

              {/* ───────────────────────── SUPPLIERS ───────────────────────── */}
              <Block id={sectionId('Suppliers')} title="Suppliers">
                <div className="space-y-2">
                  {form.suppliers.length > 0 && (
                    <div className="grid grid-cols-[1fr_1fr_120px_32px] gap-2 px-1 text-[11px] font-semibold uppercase text-notion-faint">
                      <span>Supplier</span>
                      <span>Part number</span>
                      <span>Price</span>
                      <span />
                    </div>
                  )}
                  {form.suppliers.map((s, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_120px_32px] items-center gap-2">
                      <PaginatedSelect
                        queryKey={['inventory', 'suppliers', 'options']}
                        fetchPage={fetchSupplierOptionsPage}
                        value={opt(s.supplierId, s.supplierName ?? '')}
                        onChange={(o) =>
                          updateSupplier(i, { supplierId: o?.id ?? '', supplierName: o?.label ?? '' })
                        }
                        disabled={busy}
                        placeholder="Select supplier…"
                      />
                      <Input
                        value={s.partNumber ?? ''}
                        onChange={(e) => updateSupplier(i, { partNumber: e.target.value })}
                        placeholder="Part #"
                        disabled={busy}
                      />
                      <Input
                        type="number"
                        value={s.price == null ? '' : String(s.price)}
                        onChange={(e) =>
                          updateSupplier(i, { price: e.target.value === '' ? null : Number(e.target.value) })
                        }
                        disabled={busy}
                      />
                      <button
                        type="button"
                        aria-label="Remove supplier"
                        onClick={() => removeSupplier(i)}
                        disabled={busy}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-notion-faint hover:bg-notion-hover hover:text-notion-red"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addSupplier}
                    disabled={busy || form.suppliers.length >= MAX_SUPPLIERS}
                  >
                    + Add supplier
                  </Button>
                  {form.suppliers.length >= MAX_SUPPLIERS && (
                    <p className="text-xs text-notion-faint">Maximum of {MAX_SUPPLIERS} suppliers.</p>
                  )}
                </div>
              </Block>

              {/* ───────────────────────── OTHER ───────────────────────── */}
              <Block id={sectionId('Other')} title="Other">
                <div className="grid grid-cols-1 gap-3">
                  <TextArea
                    label="Product Details"
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    disabled={busy}
                  />
                  <TextArea
                    label="Product Details for Invoice"
                    value={form.invoiceDetails}
                    onChange={(e) => set('invoiceDetails', e.target.value)}
                    rows={3}
                    disabled={busy}
                  />
                </div>
              </Block>

              {formError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-notion-red">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-notion-line pb-2 pt-3">
                <Button variant="secondary" onClick={onClose} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={submit} loading={busy}>
                  {isEdit ? 'Save Changes' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
