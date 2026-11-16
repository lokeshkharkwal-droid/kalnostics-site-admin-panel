/* ═══════════════════════════════════════════════════════════════════════
   Inventory Master Products — CSV export helper.

   Builds a spreadsheet-safe CSV from a set of master-product rows and triggers
   a browser download. Used by the list page's "Export CSV" action (EZHT parity:
   the legacy product list supported exporting the catalogue).
   ═══════════════════════════════════════════════════════════════════════ */

import type { IMasterProduct } from '../interfaces'

/** CSV column order for the master-products export. */
const HEADERS = [
  'Code',
  'Name',
  'Category',
  'Cost',
  'Price',
  'Unit',
  'Alert Qty',
  'Importable',
] as const

/**
 * Escape a single CSV field: coerce to string, wrap in double quotes, and
 * double any embedded quotes. Wrapping unconditionally keeps commas, quotes and
 * newlines inside values safe.
 */
function escapeCsv(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

/** Render one product as its ordered CSV field values. */
function toRow(p: IMasterProduct): (string | number | null)[] {
  return [
    p.code ?? '',
    p.name,
    p.categoryName ?? '',
    p.cost ?? '',
    p.price ?? '',
    p.unitName ?? '',
    p.alertQuantity ?? '',
    p.isImportable ? 'yes' : 'no',
  ]
}

/** Build the full CSV text (header + one line per product) for the given rows. */
export function buildMasterProductsCsv(products: IMasterProduct[]): string {
  const lines = [
    HEADERS.map(escapeCsv).join(','),
    ...products.map((p) => toRow(p).map(escapeCsv).join(',')),
  ]
  return lines.join('\r\n')
}

/**
 * Build a CSV from the given products and trigger a browser download. Guards
 * against SSR — it only runs in the browser (no-op on the server).
 */
export function downloadMasterProductsCsv(
  products: IMasterProduct[],
  filename = 'master-products.csv',
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const csv = buildMasterProductsCsv(products)
  // Prepend a BOM so Excel detects UTF-8.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
