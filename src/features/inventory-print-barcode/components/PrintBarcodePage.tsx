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

/**
 * Per-sheet geometry, ported from the legacy EZ Health Track `print.css`
 * (.barcode = US-Letter sheet, .barcodea4 = A4 sheet). `cols × rows` is the
 * labels-per-sheet, so labels chunk into pages of exactly that many.
 */
interface StyleGeom {
  page: 'a4' | 'letter'
  cols: number
  rows: number
  labelW: string
  labelH: string
  barHeight: number
}
const STYLES: Record<string, StyleGeom> = {
  '40': { page: 'a4', cols: 4, rows: 10, labelW: '1.799in', labelH: '1.003in', barHeight: 20 },
  '30': { page: 'letter', cols: 3, rows: 10, labelW: '2.625in', labelH: '1in', barHeight: 20 },
  '24': { page: 'a4', cols: 3, rows: 8, labelW: '2.48in', labelH: '1.335in', barHeight: 20 },
  '20': { page: 'letter', cols: 2, rows: 10, labelW: '4in', labelH: '1in', barHeight: 20 },
  '18': { page: 'a4', cols: 3, rows: 6, labelW: '2.5in', labelH: '1.835in', barHeight: 30 },
  '14': { page: 'letter', cols: 2, rows: 7, labelW: '4in', labelH: '1.33in', barHeight: 30 },
  '12': { page: 'a4', cols: 3, rows: 4, labelW: '2.5in', labelH: '2.834in', barHeight: 50 },
  '10': { page: 'letter', cols: 2, rows: 5, labelW: '4in', labelH: '2in', barHeight: 50 },
}
const SHEET_SIZE = {
  a4: { w: '8.25in', h: '11.6in' },
  letter: { w: '8.45in', h: '10.3in' },
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

interface PreviewState {
  products: IPrintProduct[]
  quantities: number[]
  fields: LabelFields
  style: string
  contWidth: string
  contHeight: string
  contOrientation: string
}

export function PrintBarcodePage() {
  const [rows, setRows] = useState<BatchRow[]>([])
  const [picker, setPicker] = useState<SelectOption | null>(null)
  const [labelStyle, setLabelStyle] = useState('24')
  const [fields, setFields] = useState<LabelFields>(DEFAULT_FIELDS)
  const [contWidth, setContWidth] = useState('50')
  const [contHeight, setContHeight] = useState('25')
  const [contOrientation, setContOrientation] = useState('portrait')
  const [preview, setPreview] = useState<PreviewState | null>(null)

  const isContinuous = labelStyle === 'continuous'

  function addRow() {
    if (!picker) return
    if (rows.some((r) => r.option.id === picker.id)) return
    setRows((rs) => [...rs, { key: picker.id, option: picker, quantity: 1 }])
    setPicker(null)
  }

  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key))
    setPreview(null)
  }

  function setQty(key: string, qty: number) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, quantity: Math.max(1, qty || 1) } : r)))
    setPreview(null)
  }

  function toggleField(key: keyof LabelFields) {
    setFields((f) => ({ ...f, [key]: !f[key] }))
    setPreview(null)
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
    setPreview({ products, quantities, fields: { ...fields }, style: labelStyle, contWidth, contHeight, contOrientation })
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
  const geom = preview && !previewIsContinuous ? STYLES[preview.style] : null
  const perSheet = previewIsContinuous ? 1 : geom ? geom.cols * geom.rows : 1
  const pageCount = labels.length > 0 ? Math.ceil(labels.length / perSheet) : 0
  const pageType: 'a4' | 'letter' = geom?.page ?? 'letter'

  // Page size for the print job (@page). Continuous uses the custom size.
  const pageCss = previewIsContinuous
    ? (() => {
        const w = Number(preview?.contWidth) || 50
        const h = Number(preview?.contHeight) || 25
        const [pw, ph] = preview?.contOrientation === 'landscape' ? [h, w] : [w, h]
        return `@page { size: ${pw}mm ${ph}mm; margin: 0; }`
      })()
    : `@page { size: ${pageType === 'a4' ? 'A4' : 'Letter'}; margin: 0; }`

  const printCss = `
    @media print {
      ${pageCss}
      html, body { background: #fff !important; }
      body * { visibility: hidden !important; }
      #barcode-print-area, #barcode-print-area * { visibility: visible !important; }
      #barcode-print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
      #barcode-print-area .bc-sheet { border: none !important; margin: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; }
      #barcode-print-area .bc-sheet:last-child { break-after: auto; page-break-after: auto; }
      #barcode-print-area .bc-label { border: none !important; }
    }
  `

  return (
    <div className="flex flex-col overflow-auto">
      {/* Print isolation: only #barcode-print-area reaches the printer. */}
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

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
              onChange={(v) => {
                setLabelStyle(v)
                setPreview(null)
              }}
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
          {preview && labels.length > 0 && (
            <Button variant="secondary" onClick={handlePrint}>
              Print
            </Button>
          )}
          {preview && labels.length > 0 && (
            <span className="text-xs text-notion-faint">
              {labels.length} label{labels.length === 1 ? '' : 's'} · {pageCount} page
              {pageCount === 1 ? '' : 's'}
              {!previewIsContinuous ? ` (${perSheet}/sheet)` : ''}
            </span>
          )}
          {rows.length > 0 && !allLoaded && (
            <span className="text-xs text-notion-faint">Loading product details…</span>
          )}
        </div>
      </main>

      {/* ── Preview + print target: the actual paginated sheets ── */}
      {preview && labels.length > 0 && (
        <section className="px-6 pb-6 print:p-0">
          <h2 className="mb-2 text-sm font-semibold text-notion-text print:hidden">Preview</h2>
          <div className="overflow-auto rounded-lg border border-notion-line bg-notion-bg p-4 print:border-0 print:bg-white print:p-0">
            <div id="barcode-print-area" className="mx-auto w-fit">
              <LabelSheets
                labels={labels}
                fields={preview.fields}
                perSheet={perSheet}
                geom={geom}
                continuous={previewIsContinuous}
                contWidth={preview.contWidth}
                contHeight={preview.contHeight}
                contOrientation={preview.contOrientation}
                pageType={pageType}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

/** Renders the labels chunked into fixed-size sheets, one `<div.bc-sheet>` per page. */
function LabelSheets({
  labels,
  fields,
  perSheet,
  geom,
  continuous,
  contWidth,
  contHeight,
  contOrientation,
  pageType,
}: {
  labels: IPrintProduct[]
  fields: LabelFields
  perSheet: number
  geom: StyleGeom | null
  continuous: boolean
  contWidth: string
  contHeight: string
  contOrientation: string
  pageType: 'a4' | 'letter'
}) {
  // Split labels into pages of exactly `perSheet`.
  const pages: IPrintProduct[][] = []
  for (let i = 0; i < labels.length; i += perSheet) pages.push(labels.slice(i, i + perSheet))

  if (continuous) {
    const w = Number(contWidth) || 50
    const h = Number(contHeight) || 25
    const [pw, ph] = contOrientation === 'landscape' ? [h, w] : [w, h]
    return (
      <>
        {labels.map((p, i) => (
          <div
            key={i}
            className="bc-sheet mb-3 bg-white"
            style={{ width: `${pw}mm`, height: `${ph}mm`, border: '1px solid #ccc', boxSizing: 'border-box' }}
          >
            <Label product={p} fields={fields} barHeight={28} />
          </div>
        ))}
      </>
    )
  }

  if (!geom) return null
  const sheet = SHEET_SIZE[pageType]

  return (
    <>
      {pages.map((pageLabels, pi) => (
        <div
          key={pi}
          className="bc-sheet mb-3 bg-white"
          style={{
            width: sheet.w,
            height: sheet.h,
            border: '1px solid #ccc',
            boxSizing: 'border-box',
            padding: '0.1in',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${geom.cols}, ${geom.labelW})`,
              justifyContent: 'center',
              alignContent: 'flex-start',
            }}
          >
            {pageLabels.map((p, li) => (
              <div key={li} style={{ width: geom.labelW, height: geom.labelH }}>
                <Label product={p} fields={fields} barHeight={geom.barHeight} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

/** A single label, honouring the selected field toggles. */
function Label({
  product: p,
  fields,
  barHeight,
}: {
  product: IPrintProduct
  fields: LabelFields
  barHeight: number
}) {
  return (
    <div className="bc-label flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden border border-dashed border-gray-300 px-1 py-0.5 text-center uppercase">
      {fields.siteName && <span className="text-[10px] font-semibold leading-tight text-black">{SITE_NAME}</span>}
      {fields.productName && <span className="text-[11px] font-medium leading-tight text-black">{p.name}</span>}
      {fields.category && p.category && <span className="text-[9px] leading-tight text-gray-600">{p.category}</span>}
      {fields.variants && p.subCategory && <span className="text-[9px] leading-tight text-gray-600">{p.subCategory}</span>}
      {fields.productImage && p.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imageUrl} alt={p.name} className="h-8 w-8 object-contain" />
      )}
      <BarcodeSvg value={p.code ?? p.id.slice(0, 10)} height={barHeight} />
      <div className="flex items-center gap-1 text-[10px] font-semibold text-black">
        {fields.price && <span>{p.price.toFixed(2)}</span>}
        {fields.currencies && <span>{CURRENCY}</span>}
        {fields.units && p.unit && <span className="text-gray-600">/ {p.unit}</span>}
      </div>
    </div>
  )
}
