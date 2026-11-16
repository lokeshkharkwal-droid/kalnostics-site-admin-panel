'use client'

import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import {
  Button,
  Input,
  PaginatedSelect,
  SelectField,
  Toggle,
  type SelectOption,
} from '@/shared/ui'
import { fetchProductPage, getProduct, type IPrintProduct } from '../services/print-barcode.api'
import { BarcodeSvg } from './BarcodeSvg'

/** A product row added to the label batch, with its print quantity. */
interface BatchRow {
  key: string
  option: SelectOption
  quantity: number
}

/** The visible fields that can be toggled on/off for each label. */
interface LabelFields {
  siteName: boolean
  productName: boolean
  price: boolean
  currencies: boolean
  units: boolean
  category: boolean
  variants: boolean
  productImage: boolean
}

const DEFAULT_FIELDS: LabelFields = {
  siteName: true,
  productName: true,
  price: true,
  currencies: false,
  units: false,
  category: false,
  variants: false,
  productImage: false,
}

const LABEL_STYLES = [
  { value: '40', label: '40 per sheet' },
  { value: '30', label: '30 per sheet' },
  { value: '24', label: '24 per sheet' },
  { value: '20', label: '20 per sheet' },
  { value: '18', label: '18 per sheet' },
  { value: '14', label: '14 per sheet' },
  { value: '12', label: '12 per sheet' },
  { value: '10', label: '10 per sheet' },
  { value: 'continuous', label: 'Continuous Feed' },
]

/** Columns-per-row for each sheet style (used to lay the preview out in a grid). */
const COLUMNS_FOR_STYLE: Record<string, number> = {
  '40': 5,
  '30': 5,
  '24': 4,
  '20': 4,
  '18': 3,
  '14': 2,
  '12': 3,
  '10': 2,
}

const FIELD_LABELS: { key: keyof LabelFields; label: string }[] = [
  { key: 'siteName', label: 'Site Name' },
  { key: 'productName', label: 'Product Name' },
  { key: 'price', label: 'Price' },
  { key: 'currencies', label: 'Currencies' },
  { key: 'units', label: 'Units' },
  { key: 'category', label: 'Category' },
  { key: 'variants', label: 'Variants' },
  { key: 'productImage', label: 'Product Image' },
]

const SITE_NAME = 'Kalnostics'
const CURRENCY = 'INR'

export function PrintBarcodePage() {
  const [rows, setRows] = useState<BatchRow[]>([])
  const [picker, setPicker] = useState<SelectOption | null>(null)
  const [labelStyle, setLabelStyle] = useState('30')
  const [fields, setFields] = useState<LabelFields>(DEFAULT_FIELDS)
  const [contWidth, setContWidth] = useState('50')
  const [contHeight, setContHeight] = useState('25')
  const [contOrientation, setContOrientation] = useState('portrait')
  const [preview, setPreview] = useState<{ products: IPrintProduct[]; quantities: number[]; fields: LabelFields; style: string } | null>(null)

  const isContinuous = labelStyle === 'continuous'

  function addRow() {
    if (!picker) return
    if (rows.some((r) => r.option.id === picker.id)) return
    setRows((rs) => [...rs, { key: picker.id, option: picker, quantity: 1 }])
    setPicker(null)
  }

  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key))
  }

  function setQty(key: string, qty: number) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, quantity: Math.max(1, qty || 1) } : r)))
  }

  function toggleField(key: keyof LabelFields) {
    setFields((f) => ({ ...f, [key]: !f[key] }))
  }

  // Fetch full product detail for every selected row (price/category/unit/image).
  const detailQueries = useQueries({
    queries: rows.map((r) => ({
      queryKey: ['inventory', 'print-barcode', 'product', r.option.id],
      queryFn: () => getProduct(r.option.id),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const allLoaded = detailQueries.every((q) => q.data || q.isError)

  function buildPreview() {
    const products: IPrintProduct[] = []
    const quantities: number[] = []
    rows.forEach((r, i) => {
      const detail = detailQueries[i]?.data
      products.push(
        detail ?? {
          id: r.option.id,
          name: r.option.label,
          code: null,
          category: null,
          subCategory: null,
          unit: null,
          brand: null,
          price: 0,
          cost: 0,
          description: null,
        },
      )
      quantities.push(r.quantity)
    })
    setPreview({ products, quantities, fields: { ...fields }, style: labelStyle })
  }

  function handlePrint() {
    window.print()
  }

  // Flatten the preview into one label per product × quantity.
  const labels: IPrintProduct[] = []
  if (preview) {
    preview.products.forEach((p, i) => {
      const q = preview.quantities[i] ?? 1
      for (let n = 0; n < q; n++) labels.push(p)
    })
  }

  const previewIsContinuous = preview?.style === 'continuous'
  const gridCols = preview ? COLUMNS_FOR_STYLE[preview.style] ?? 4 : 4

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Print Barcode / Label"
        subtitle="Generate printable product barcode labels"
      />

      <main className="flex-1 space-y-5 p-6 print:hidden">
        {/* ── Product picker ── */}
        <section className="space-y-3 rounded-xl border border-notion-line bg-white p-4">
          <h2 className="text-sm font-semibold text-notion-text">Products</h2>
          <div className="flex items-end gap-2">
            <div className="w-80">
              <label className="mb-1 block text-xs font-medium text-notion-text">Add product</label>
              <PaginatedSelect
                queryKey={['inventory', 'print-barcode', 'product-picker']}
                fetchPage={fetchProductPage}
                value={picker}
                onChange={setPicker}
                placeholder="Search a master product…"
              />
            </div>
            <Button size="sm" onClick={addRow} disabled={!picker}>
              + Add
            </Button>
          </div>

          {rows.length > 0 && (
            <div className="divide-y divide-notion-line rounded-lg border border-notion-line">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 truncate text-sm text-notion-text">{r.option.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-notion-faint">Qty</span>
                    <div className="w-20">
                      <Input
                        type="number"
                        min={1}
                        value={String(r.quantity)}
                        onChange={(e) => setQty(r.key, Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeRow(r.key)}
                    className="text-notion-faint transition-colors hover:text-notion-red"
                    title="Remove"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {rows.length === 0 && (
            <p className="text-xs text-notion-faint">No products added yet.</p>
          )}
        </section>

        {/* ── Label style + fields ── */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-notion-line bg-white p-4">
            <h2 className="text-sm font-semibold text-notion-text">Label Style</h2>
            <SelectField
              label="Labels per sheet"
              value={labelStyle}
              onChange={setLabelStyle}
              options={LABEL_STYLES}
            />
            {isContinuous && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                <Input label="Width (mm)" type="number" value={contWidth} onChange={(e) => setContWidth(e.target.value)} />
                <Input label="Height (mm)" type="number" value={contHeight} onChange={(e) => setContHeight(e.target.value)} />
                <SelectField
                  label="Orientation"
                  value={contOrientation}
                  onChange={setContOrientation}
                  options={[
                    { value: 'portrait', label: 'Portrait' },
                    { value: 'landscape', label: 'Landscape' },
                  ]}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-notion-line bg-white p-4">
            <h2 className="text-sm font-semibold text-notion-text">Show on Label</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {FIELD_LABELS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm text-notion-text">
                  <Toggle checked={fields[f.key]} onChange={() => toggleField(f.key)} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2">
          <Button onClick={buildPreview} disabled={rows.length === 0 || !allLoaded}>
            Update
          </Button>
          {preview && (
            <Button variant="secondary" onClick={handlePrint}>
              Print
            </Button>
          )}
          {rows.length > 0 && !allLoaded && (
            <span className="text-xs text-notion-faint">Loading product details…</span>
          )}
        </div>

        {/* ── Preview (screen) ── */}
        {preview && labels.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-notion-text">
              Preview — {labels.length} label{labels.length === 1 ? '' : 's'}
            </h2>
            <LabelSheet labels={labels} fields={preview.fields} gridCols={gridCols} continuous={previewIsContinuous} />
          </section>
        )}
      </main>

      {/* ── Print-only area (visible only on window.print) ── */}
      {preview && labels.length > 0 && (
        <div className="hidden print:block">
          <LabelSheet labels={labels} fields={preview.fields} gridCols={gridCols} continuous={previewIsContinuous} />
        </div>
      )}
    </div>
  )
}

/** Renders a grid of labels. Each label honours the selected field toggles. */
function LabelSheet({
  labels,
  fields,
  gridCols,
  continuous,
}: {
  labels: IPrintProduct[]
  fields: LabelFields
  gridCols: number
  continuous: boolean
}) {
  return (
    <div
      className="grid gap-2 rounded-lg border border-notion-line bg-white p-3"
      style={{ gridTemplateColumns: continuous ? '1fr' : `repeat(${gridCols}, minmax(0, 1fr))` }}
    >
      {labels.map((p, i) => (
        <div
          key={`${p.id}-${i}`}
          className="flex flex-col items-center gap-0.5 rounded border border-dashed border-gray-300 p-2 text-center"
        >
          {fields.siteName && <span className="text-[10px] font-semibold text-black">{SITE_NAME}</span>}
          {fields.productName && <span className="text-[11px] font-medium text-black">{p.name}</span>}
          {fields.category && p.category && <span className="text-[9px] text-gray-600">{p.category}</span>}
          {fields.variants && p.subCategory && <span className="text-[9px] text-gray-600">{p.subCategory}</span>}
          {fields.productImage && p.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="h-8 w-8 object-contain" />
          )}
          <BarcodeSvg value={p.code ?? p.id.slice(0, 10)} />
          <div className="flex items-center gap-1 text-[10px] font-semibold text-black">
            {fields.price && <span>{p.price.toFixed(2)}</span>}
            {fields.price && fields.currencies && <span>{CURRENCY}</span>}
            {!fields.price && fields.currencies && <span>{CURRENCY}</span>}
            {fields.units && p.unit && <span className="text-gray-600">/ {p.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
