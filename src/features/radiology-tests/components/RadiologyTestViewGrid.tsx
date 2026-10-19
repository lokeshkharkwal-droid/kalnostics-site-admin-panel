'use client'

import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'
import { Badge, DataTable, type Column } from '@/shared/ui'
import type {
  RadiologyTestListRow, RadiologyTestListView, TatUnit,
  RadiologyTestDefaultRow, RadiologyTestBasicDetailsRow, RadiologyTestPricingRow,
  RadiologyTestTatRow, RadiologyTestFlagsRow, RadiologyTestNotesRow, RadiologyTestOverviewRow,
} from '@/entities/radiology-test'
import { PencilIcon, PowerIcon, TrashIcon } from './icons'

/* ═══════════════════════════════════════
   RADIOLOGY TEST VIEW GRID
   Server-driven listing grid. Tabs map to the backend `?view=` projections; the
   grid renders the columns of whichever view's rows are passed in. The radiology
   model is flat, so there are no child-centric views.
═══════════════════════════════════════ */

const VIEW_TABS: { label: string; view: RadiologyTestListView }[] = [
  { label: 'Default', view: 'DEFAULT' },
  { label: 'Basic Details', view: 'BASIC_DETAILS' },
  { label: 'Pricing', view: 'PRICING' },
  { label: 'TAT', view: 'TAT' },
  { label: 'Flags', view: 'FLAGS' },
  { label: 'Notes', view: 'NOTES' },
  { label: 'Overview', view: 'OVERVIEW' },
]

const MODALITY_LABEL: Record<string, string> = {
  XRAY: 'X-Ray', CT: 'CT', MRI: 'MRI', ULTRASOUND: 'Ultrasound', MAMMOGRAPHY: 'Mammography',
  PET: 'PET', FLUOROSCOPY: 'Fluoroscopy', DEXA: 'DEXA', OTHER: 'Other',
}

/* ── display helpers ── */
const fmtEnum = (v: string | null | undefined): string =>
  v ? v.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '—'
const fmtModality = (v: string | null | undefined): string => (v ? MODALITY_LABEL[v] ?? fmtEnum(v) : '—')
const fmtNum = (v: number | string | null | undefined): string =>
  v === null || v === undefined || v === '' ? '—' : String(v)
const fmtPrice = (v: number | null | undefined): string => (v == null ? '—' : `₹${v}`)
const fmtTat = (val: number | null, unit: TatUnit | null): string =>
  val == null ? '—' : `${val} ${fmtEnum(unit)}`
const yesNo = (v: boolean): string => (v ? 'Yes' : 'No')

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'secondary'}>{active ? 'Active' : 'Inactive'}</Badge>
}

interface ViewColumn {
  header: string
  align?: 'left' | 'right'
  cell: (row: RadiologyTestListRow) => ReactNode
}

const COL_NAME: ViewColumn = { header: 'Test Name', cell: (r) => <span className="font-medium text-notion-text">{(r as { testName: string }).testName}</span> }
const COL_CODE: ViewColumn = { header: 'Test Code', cell: (r) => <span className="font-mono text-xs text-notion-blue">{(r as { testCode?: string }).testCode ?? '—'}</span> }

const VIEW_COLUMNS: Record<RadiologyTestListView, ViewColumn[]> = {
  DEFAULT: [
    COL_NAME, COL_CODE,
    { header: 'Modality', cell: (r) => fmtModality((r as RadiologyTestDefaultRow).modality) },
    { header: 'Body Part', cell: (r) => (r as RadiologyTestDefaultRow).bodyPart ?? '—' },
    { header: 'MSRP', align: 'right', cell: (r) => fmtPrice((r as RadiologyTestDefaultRow).priceMsrp) },
    { header: 'Max TAT', cell: (r) => fmtTat((r as RadiologyTestDefaultRow).tatMaxValue, (r as RadiologyTestDefaultRow).tatMaxUnit) },
    { header: 'Status', cell: (r) => <StatusBadge active={(r as RadiologyTestDefaultRow).isActive} /> },
  ],
  BASIC_DETAILS: [
    COL_NAME, COL_CODE,
    { header: 'AKA', cell: (r) => (r as RadiologyTestBasicDetailsRow).aka ?? '—' },
    { header: 'Modality', cell: (r) => fmtModality((r as RadiologyTestBasicDetailsRow).modality) },
    { header: 'Body Part', cell: (r) => (r as RadiologyTestBasicDetailsRow).bodyPart ?? '—' },
    { header: 'View', cell: (r) => (r as RadiologyTestBasicDetailsRow).view ?? '—' },
    { header: 'Contrast', cell: (r) => yesNo((r as RadiologyTestBasicDetailsRow).isContrast) },
    { header: 'ICD', cell: (r) => (r as RadiologyTestBasicDetailsRow).icdCode ?? '—' },
    { header: 'LOINC', cell: (r) => (r as RadiologyTestBasicDetailsRow).loincCode ?? '—' },
  ],
  PRICING: [
    COL_NAME, COL_CODE,
    { header: 'MSRP', align: 'right', cell: (r) => fmtPrice((r as RadiologyTestPricingRow).priceMsrp) },
    { header: 'Minimum', align: 'right', cell: (r) => fmtPrice((r as RadiologyTestPricingRow).priceMinimum) },
    { header: 'Maximum', align: 'right', cell: (r) => fmtPrice((r as RadiologyTestPricingRow).priceMaximum) },
    { header: 'Original', align: 'right', cell: (r) => fmtPrice((r as RadiologyTestPricingRow).priceOriginal) },
    { header: 'Franchise', align: 'right', cell: (r) => fmtPrice((r as RadiologyTestPricingRow).franchisePrice) },
    { header: 'Emergency', align: 'right', cell: (r) => fmtPrice((r as RadiologyTestPricingRow).emergencyPrice) },
    { header: 'Discount Cap %', align: 'right', cell: (r) => fmtNum((r as RadiologyTestPricingRow).discountCapPct) },
    { header: 'Price Override', cell: (r) => yesNo((r as RadiologyTestPricingRow).isAllowPriceOverride) },
    { header: 'Discounts', cell: (r) => yesNo((r as RadiologyTestPricingRow).isAllowDiscounts) },
  ],
  TAT: [
    COL_NAME,
    { header: 'Min TAT', align: 'right', cell: (r) => fmtNum((r as RadiologyTestTatRow).tatMinValue) },
    { header: 'Min Unit', cell: (r) => fmtEnum((r as RadiologyTestTatRow).tatMinUnit) },
    { header: 'Max TAT', align: 'right', cell: (r) => fmtNum((r as RadiologyTestTatRow).tatMaxValue) },
    { header: 'Max Unit', cell: (r) => fmtEnum((r as RadiologyTestTatRow).tatMaxUnit) },
    { header: 'Schedule', cell: (r) => { const t = r as RadiologyTestTatRow; return t.scheduleFrom || t.scheduleTo ? `${t.scheduleFrom ?? '—'} – ${t.scheduleTo ?? '—'}` : '—' } },
  ],
  FLAGS: [
    COL_NAME,
    { header: 'Hide in Order', cell: (r) => yesNo((r as RadiologyTestFlagsRow).isHideInOrderScreen) },
    { header: 'CMS Enabled', cell: (r) => yesNo((r as RadiologyTestFlagsRow).isEnableCms) },
    { header: 'Preference', cell: (r) => yesNo((r as RadiologyTestFlagsRow).isPreferenceTest) },
    { header: 'Outsource', cell: (r) => yesNo((r as RadiologyTestFlagsRow).isOutsource) },
    { header: 'Bill Only', cell: (r) => yesNo((r as RadiologyTestFlagsRow).isBillOnlyTest) },
    { header: 'Status', cell: (r) => <StatusBadge active={(r as RadiologyTestFlagsRow).isActive} /> },
  ],
  NOTES: [
    COL_NAME,
    { header: 'Useful For', cell: (r) => (r as RadiologyTestNotesRow).usefulFor ?? '—' },
    { header: 'Interpretation', cell: (r) => (r as RadiologyTestNotesRow).interpretationOfResults ?? '—' },
    { header: 'Limitations', cell: (r) => (r as RadiologyTestNotesRow).limitations ?? '—' },
    { header: 'Remarks', cell: (r) => (r as RadiologyTestNotesRow).remarks ?? '—' },
    { header: 'References', cell: (r) => (r as RadiologyTestNotesRow).references ?? '—' },
  ],
  OVERVIEW: [
    COL_NAME, COL_CODE,
    { header: 'Modality', cell: (r) => fmtModality((r as RadiologyTestOverviewRow).modality) },
    { header: 'Max Value', align: 'right', cell: (r) => fmtPrice((r as RadiologyTestOverviewRow).maxValue) },
    { header: 'Max TAT', cell: (r) => fmtTat((r as RadiologyTestOverviewRow).tatMaxValue, (r as RadiologyTestOverviewRow).tatMaxUnit) },
    { header: 'Status', cell: (r) => <StatusBadge active={(r as RadiologyTestOverviewRow).isActive} /> },
  ],
}

export function RadiologyTestViewGrid({
  view, dataView, onViewChange, rows, loading, onEdit, onToggleStatus, onDelete,
}: {
  view: RadiologyTestListView
  dataView: RadiologyTestListView
  onViewChange: (v: RadiologyTestListView) => void
  rows: RadiologyTestListRow[]
  loading: boolean
  onEdit: (id: string) => void
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
}) {
  const columns: Column<RadiologyTestListRow>[] = VIEW_COLUMNS[dataView].map((vc, idx) => ({
    id: `${vc.header}-${idx}`,
    header: vc.header,
    align: vc.align,
    truncate: false,
    width: vc.align === 'right' ? 110 : vc.header.includes('Name') ? 200 : 170,
    cell: (r: RadiologyTestListRow) => vc.cell(r),
  }))

  return (
    <div className="space-y-2">
      {/* Section/view tab strip */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-notion-line bg-white px-2 py-1.5">
        {VIEW_TABS.map(t => (
          <button
            key={t.view}
            onClick={() => onViewChange(t.view)}
            className={cn(
              'whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium transition-colors',
              view === t.view ? 'bg-notion-blue text-white' : 'text-notion-sub hover:bg-notion-hover',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <DataTable
        rows={rows}
        rowKey={r => r.id}
        columns={columns}
        loading={loading}
        emptyMessage="No radiology tests found"
        actionsWidth={120}
        actions={r => (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onEdit(r.id)} title="Edit" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><PencilIcon className="h-4 w-4" /></button>
            <button type="button" onClick={() => onToggleStatus(r.id)} title="Toggle status" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><PowerIcon className="h-4 w-4" /></button>
            <button type="button" onClick={() => onDelete(r.id)} title="Delete" className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-4 w-4" /></button>
          </div>
        )}
      />
    </div>
  )
}
