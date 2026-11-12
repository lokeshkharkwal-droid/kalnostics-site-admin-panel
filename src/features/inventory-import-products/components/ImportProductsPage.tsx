'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Button, DataTable, type Column } from '@/shared/ui'
import {
  IMPORT_COLUMNS,
  createFromRow,
  type ImportRow,
} from '../services/import-products.api'

/** Minimal CSV parser: splits on newlines, handles simple quoted fields. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    if (line.trim() === '') continue
    const cells: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"'
          i++
        } else if (ch === '"') {
          inQuotes = false
        } else {
          cur += ch
        }
      } else if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        cells.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur)
    rows.push(cells.map((c) => c.trim()))
  }
  return rows
}

/** Map header-ordered cells → an ImportRow using the file's own header row. */
function rowsFromCsv(matrix: string[][]): ImportRow[] {
  if (matrix.length < 2) return []
  const header = matrix[0].map((h) => h.trim())
  const indexOf = (key: string) =>
    header.findIndex((h) => h.toLowerCase() === key.toLowerCase())
  const idx: Record<string, number> = {}
  IMPORT_COLUMNS.forEach((c) => {
    idx[c] = indexOf(c)
  })
  return matrix.slice(1).map((cells) => {
    const get = (key: keyof ImportRow) => {
      const i = idx[key]
      return i >= 0 && i < cells.length ? cells[i] : ''
    }
    return {
      code: get('code'),
      name: get('name'),
      category: get('category'),
      subCategory: get('subCategory'),
      unit: get('unit'),
      brand: get('brand'),
      cost: get('cost'),
      price: get('price'),
      hsnCode: get('hsnCode'),
      taxName: get('taxName'),
      taxRate: get('taxRate'),
    }
  })
}

interface ImportSummary {
  created: number
  failed: number
  errors: { row: number; name: string; message: string }[]
}

export function ImportProductsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  function downloadSample() {
    const csv = `${IMPORT_COLUMNS.join(',')}\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'master-products-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSummary(null)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const parsed = rowsFromCsv(parseCsv(text))
      const valid = parsed.filter((r) => r.name.trim() !== '')
      setRows(valid)
      if (valid.length === 0) toast.error('No valid rows found (a `name` is required per row).')
    }
    reader.readAsText(file)
  }

  function reset() {
    setRows([])
    setFileName('')
    setSummary(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function runImport() {
    if (rows.length === 0) return
    setImporting(true)
    setProgress(0)
    const result: ImportSummary = { created: 0, failed: 0, errors: [] }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        await createFromRow(row)
        result.created++
      } catch (err: unknown) {
        result.failed++
        const e = err as { response?: { data?: { error?: { message?: string }; message?: string | string[] } } }
        const raw =
          e?.response?.data?.error?.message ??
          e?.response?.data?.message ??
          'Failed to create'
        result.errors.push({
          row: i + 2, // +1 header, +1 for 1-based
          name: row.name,
          message: Array.isArray(raw) ? raw[0] : String(raw),
        })
      }
      setProgress(i + 1)
    }
    setSummary(result)
    setImporting(false)
    if (result.failed === 0) toast.success(`Imported ${result.created} product(s).`)
    else toast.error(`${result.created} imported, ${result.failed} failed.`)
  }

  const columns: Column<ImportRow>[] = [
    { header: 'Code', cell: (r) => r.code || '—', width: 110 },
    { header: 'Name', cell: (r) => r.name, width: 180 },
    { header: 'Category', cell: (r) => r.category || '—', width: 120 },
    { header: 'Sub-cat', cell: (r) => r.subCategory || '—', width: 110 },
    { header: 'Unit', cell: (r) => r.unit || '—', width: 80 },
    { header: 'Brand', cell: (r) => r.brand || '—', width: 100 },
    { header: 'Cost', cell: (r) => r.cost || '—', width: 70 },
    { header: 'Price', cell: (r) => r.price || '—', width: 70 },
    { header: 'HSN', cell: (r) => r.hsnCode || '—', width: 80 },
    { header: 'Tax', cell: (r) => (r.taxName ? `${r.taxName} ${r.taxRate}` : '—'), width: 100 },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Import Products"
        subtitle="Bulk-create master products from a CSV file"
        actions={
          <Button variant="secondary" size="sm" onClick={downloadSample}>
            Download sample CSV
          </Button>
        }
      />

      <main className="flex-1 space-y-5 p-6">
        {/* ── Upload ── */}
        <section className="space-y-3 rounded-xl border border-notion-line bg-white p-4">
          <h2 className="text-sm font-semibold text-notion-text">1. Upload CSV</h2>
          <p className="text-xs text-notion-faint">
            Columns: {IMPORT_COLUMNS.join(', ')}. The <code>name</code> column is required for each row.
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="block text-sm text-notion-sub file:mr-3 file:rounded-md file:border file:border-notion-line2 file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-notion-text hover:file:bg-notion-hover"
            />
            {fileName && (
              <button onClick={reset} className="text-xs text-notion-faint hover:text-notion-red">
                Clear
              </button>
            )}
          </div>
        </section>

        {/* ── Preview ── */}
        {rows.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-notion-text">
                2. Preview — {rows.length} row{rows.length === 1 ? '' : 's'}
              </h2>
              <Button
                onClick={runImport}
                loading={importing}
                disabled={importing}
              >
                {importing ? `Importing ${progress}/${rows.length}…` : `Import ${rows.length} product(s)`}
              </Button>
            </div>
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={(r) => `${rows.indexOf(r)}-${r.code}-${r.name}`}
              emptyMessage="No rows"
            />
          </section>
        )}

        {/* ── Summary ── */}
        {summary && (
          <section className="space-y-3 rounded-xl border border-notion-line bg-white p-4">
            <h2 className="text-sm font-semibold text-notion-text">Import summary</h2>
            <div className="flex gap-6 text-sm">
              <span className="text-[#448361]">Created: {summary.created}</span>
              <span className={summary.failed ? 'text-[#c0392b]' : 'text-notion-faint'}>
                Failed: {summary.failed}
              </span>
            </div>
            {summary.errors.length > 0 && (
              <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">Errors</p>
                <ul className="space-y-0.5 text-xs text-red-600">
                  {summary.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.row} ({e.name || 'unnamed'}): {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
