'use client'

import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'
import { Badge, DataTable, type Column } from '@/shared/ui'
import type {
  LabTestListRow, LabTestListView, TatUnit,
  LabTestDefaultRow, LabTestBasicDetailsRow, LabTestPricingRow, LabTestTatRow,
  LabTestFlagsRow, LabTestSampleViewRow, LabTestResultsRow, LabTestReferenceRangeRow,
  LabTestReferenceValueRow, LabTestNotesRow, LabTestOverviewRow,
} from '@/entities/lab-test'
import { PencilIcon, PowerIcon, TrashIcon } from './icons'

/* ═══════════════════════════════════════
   LAB TEST VIEW GRID
   Server-driven listing grid. The section tabs map 1:1 to the backend
   `LabTestListView`s; the grid renders the columns of whichever view's rows are
   passed in (the `?view=` endpoint does the projection + pagination). Version
   Control is intentionally excluded from the Site Admin UI.
═══════════════════════════════════════ */

const VIEW_TABS: { label: string; view: LabTestListView }[] = [
  { label: 'Default', view: 'DEFAULT' },
  { label: 'Basic Details', view: 'BASIC_DETAILS' },
  { label: 'Pricing', view: 'PRICING' },
  { label: 'TAT', view: 'TAT' },
  { label: 'Flags', view: 'FLAGS' },
  { label: 'Sample', view: 'SAMPLE' },
  { label: 'Results', view: 'RESULTS' },
  { label: 'Reference Range', view: 'REFERENCE_RANGE' },
  { label: 'Reference Value', view: 'REFERENCE_VALUE' },
  { label: 'Notes', view: 'NOTES' },
  { label: 'Overview', view: 'OVERVIEW' },
]

/* ── display helpers ── */
const fmtEnum = (v: string | null | undefined): string =>
  v ? v.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '—'
const fmtNum = (v: number | string | null | undefined): string =>
  v === null || v === undefined || v === '' ? '—' : String(v)
const fmtPrice = (v: number | null | undefined): string => (v == null ? '—' : `₹${v}`)
const fmtTat = (val: number | null, unit: TatUnit | null): string =>
  val == null ? '—' : `${val} ${fmtEnum(unit)}`
const yesNo = (v: boolean): string => (v ? 'Yes' : 'No')

function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'secondary'}>{active ? 'Active' : 'Inactive'}</Badge>
}

function StackList({ items, empty = '—' }: { items: ReactNode[]; empty?: string }) {
  if (items.length === 0) return <span className="text-notion-faint">{empty}</span>
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((it, i) => <div key={i} className="text-xs text-notion-sub">{it}</div>)}
    </div>
  )
}

interface ViewColumn {
  header: string
  align?: 'left' | 'right'
  cell: (row: LabTestListRow) => ReactNode
}

const COL_NAME: ViewColumn = { header: 'Test Name', cell: (r) => <span className="font-medium text-notion-text">{(r as { testName: string }).testName}</span> }
const COL_CODE: ViewColumn = { header: 'Test Code', cell: (r) => <span className="font-mono text-xs text-notion-blue">{(r as { testCode?: string }).testCode ?? '—'}</span> }

const VIEW_COLUMNS: Record<LabTestListView, ViewColumn[]> = {
  DEFAULT: [
    COL_NAME, COL_CODE,
    { header: 'MSRP', align: 'right', cell: (r) => fmtPrice((r as LabTestDefaultRow).priceMsrp) },
    { header: 'Max TAT', cell: (r) => fmtTat((r as LabTestDefaultRow).tatMaxValue, (r as LabTestDefaultRow).tatMaxUnit) },
    { header: 'Default Sample', cell: (r) => (r as LabTestDefaultRow).defaultSample?.sampleType ?? '—' },
    { header: 'Parameters', align: 'right', cell: (r) => fmtNum((r as LabTestDefaultRow).parametersCount) },
    { header: 'Status', cell: (r) => <StatusBadge active={(r as LabTestDefaultRow).isActive} /> },
  ],
  // Department / Category / Subcategory columns dropped — always null for templates.
  BASIC_DETAILS: [
    COL_NAME, COL_CODE,
    { header: 'AKA', cell: (r) => (r as LabTestBasicDetailsRow).aka ?? '—' },
    { header: 'Process', cell: (r) => fmtEnum((r as LabTestBasicDetailsRow).processMethod) },
    { header: 'Priority', cell: (r) => fmtEnum((r as LabTestBasicDetailsRow).samplePriorityType) },
    { header: 'ICD', cell: (r) => (r as LabTestBasicDetailsRow).icdCode ?? '—' },
    { header: 'LOINC', cell: (r) => (r as LabTestBasicDetailsRow).loincCode ?? '—' },
  ],
  PRICING: [
    COL_NAME, COL_CODE,
    { header: 'MSRP', align: 'right', cell: (r) => fmtPrice((r as LabTestPricingRow).priceMsrp) },
    { header: 'Minimum', align: 'right', cell: (r) => fmtPrice((r as LabTestPricingRow).priceMinimum) },
    { header: 'Maximum', align: 'right', cell: (r) => fmtPrice((r as LabTestPricingRow).priceMaximum) },
    { header: 'Original', align: 'right', cell: (r) => fmtPrice((r as LabTestPricingRow).priceOriginal) },
    { header: 'Franchise', align: 'right', cell: (r) => fmtPrice((r as LabTestPricingRow).franchisePrice) },
    { header: 'Emergency', align: 'right', cell: (r) => fmtPrice((r as LabTestPricingRow).emergencyPrice) },
    { header: 'Discount Cap %', align: 'right', cell: (r) => fmtNum((r as LabTestPricingRow).discountCapPct) },
    { header: 'Price Override', cell: (r) => yesNo((r as LabTestPricingRow).isAllowPriceOverride) },
    { header: 'Discounts', cell: (r) => yesNo((r as LabTestPricingRow).isAllowDiscounts) },
  ],
  TAT: [
    COL_NAME,
    { header: 'Min TAT', align: 'right', cell: (r) => fmtNum((r as LabTestTatRow).tatMinValue) },
    { header: 'Min Unit', cell: (r) => fmtEnum((r as LabTestTatRow).tatMinUnit) },
    { header: 'Max TAT', align: 'right', cell: (r) => fmtNum((r as LabTestTatRow).tatMaxValue) },
    { header: 'Max Unit', cell: (r) => fmtEnum((r as LabTestTatRow).tatMaxUnit) },
    { header: 'Schedule', cell: (r) => { const t = r as LabTestTatRow; return t.scheduleFrom || t.scheduleTo ? `${t.scheduleFrom ?? '—'} – ${t.scheduleTo ?? '—'}` : '—' } },
    { header: 'Processing', cell: (r) => fmtTat((r as LabTestTatRow).procTimeMaxValue, (r as LabTestTatRow).procTimeMaxUnit) },
    { header: 'Approval', cell: (r) => { const t = r as LabTestTatRow; return t.approvalTimeFrom || t.approvalTimeTo ? `${t.approvalTimeFrom ?? '—'} – ${t.approvalTimeTo ?? '—'}` : '—' } },
  ],
  FLAGS: [
    COL_NAME,
    { header: 'Hide in Order', cell: (r) => yesNo((r as LabTestFlagsRow).isHideInOrderScreen) },
    { header: 'CMS Enabled', cell: (r) => yesNo((r as LabTestFlagsRow).isEnableCms) },
    { header: 'Preference Test', cell: (r) => yesNo((r as LabTestFlagsRow).isPreferenceTest) },
    { header: 'Status', cell: (r) => <StatusBadge active={(r as LabTestFlagsRow).isActive} /> },
  ],
  SAMPLE: [
    COL_NAME, COL_CODE,
    { header: 'Status', cell: (r) => <StatusBadge active={(r as LabTestSampleViewRow).isActive} /> },
    { header: 'Samples', cell: (r) => (
      <StackList items={((r as LabTestSampleViewRow).samples ?? []).map(s =>
        `${s.sampleType ?? '—'} · ${fmtEnum(s.containerType)}${s.sampleSize ? ` · ${s.sampleSize}` : ''}${s.isFastingRequired ? ' · Fasting' : ''}`)} empty="No samples" />
    ) },
  ],
  RESULTS: [
    COL_NAME, COL_CODE,
    { header: 'Status', cell: (r) => <StatusBadge active={(r as LabTestResultsRow).isActive} /> },
    { header: 'Parameters', cell: (r) => (
      <StackList items={((r as LabTestResultsRow).resultParams ?? []).map(p =>
        `${p.parameterName}${p.units ? ` (${p.units})` : ''} · ${fmtEnum(p.resultType)}${p.method ? ` · ${p.method}` : ''}${p.isNabl ? ' · NABL' : ''}${p.isCap ? ' · CAP' : ''}`)} empty="No parameters" />
    ) },
  ],
  REFERENCE_RANGE: [
    COL_NAME, COL_CODE,
    { header: 'Reference Ranges', cell: (r) => (
      <StackList items={((r as LabTestReferenceRangeRow).referenceRanges ?? []).map(rr =>
        `${rr.parameterName} · ${fmtEnum(rr.gender)} · ${rr.ageFrom}-${rr.ageTo}y · ${fmtNum(rr.lowerLimit)}–${fmtNum(rr.upperLimit)}${rr.displayOfReferenceRange ? ` · ${rr.displayOfReferenceRange}` : ''}`)} empty="No ranges" />
    ) },
  ],
  REFERENCE_VALUE: [
    COL_NAME, COL_CODE,
    { header: 'Reference Values', cell: (r) => (
      <StackList items={((r as LabTestReferenceValueRow).referenceValues ?? []).map(rv =>
        `${rv.parameterName} · ${fmtEnum(rv.gender)} · ${rv.ageFrom}-${rv.ageTo}y · ${rv.displayValue}`)} empty="No values" />
    ) },
  ],
  NOTES: [
    COL_NAME,
    { header: 'Useful For', cell: (r) => (r as LabTestNotesRow).usefulFor ?? '—' },
    { header: 'Interpretation', cell: (r) => (r as LabTestNotesRow).interpretationOfResults ?? '—' },
    { header: 'Limitations', cell: (r) => (r as LabTestNotesRow).limitations ?? '—' },
    { header: 'Remarks', cell: (r) => (r as LabTestNotesRow).remarks ?? '—' },
    { header: 'References', cell: (r) => (r as LabTestNotesRow).references ?? '—' },
  ],
  OVERVIEW: [
    COL_NAME, COL_CODE,
    { header: 'Max Value', align: 'right', cell: (r) => fmtPrice((r as LabTestOverviewRow).maxValue) },
    { header: 'Max TAT', cell: (r) => fmtTat((r as LabTestOverviewRow).tatMaxValue, (r as LabTestOverviewRow).tatMaxUnit) },
    { header: 'Samples', align: 'right', cell: (r) => fmtNum((r as LabTestOverviewRow).samplesCount) },
    { header: 'Parameters', align: 'right', cell: (r) => fmtNum((r as LabTestOverviewRow).parametersCount) },
    { header: 'Status', cell: (r) => <StatusBadge active={(r as LabTestOverviewRow).isActive} /> },
  ],
}

export function LabTestViewGrid({
  view, dataView, onViewChange, rows, loading, onEdit, onToggleStatus, onDelete,
}: {
  /** The selected tab (drives the tab-strip highlight). */
  view: LabTestListView
  /** The view the current `rows` were actually fetched for (drives the columns). */
  dataView: LabTestListView
  onViewChange: (v: LabTestListView) => void
  rows: LabTestListRow[]
  loading: boolean
  onEdit: (id: string) => void
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
}) {
  // Columns follow the data's view (not the selected tab) so the column shape and
  // the row shape stay in sync while a freshly-selected view is still loading.
  // The view's cells render varied / multi-line content (stacked lists, notes),
  // so truncation is left off here — long values wrap within the resizable column.
  const columns: Column<LabTestListRow>[] = VIEW_COLUMNS[dataView].map((vc, idx) => ({
    id: `${vc.header}-${idx}`,
    header: vc.header,
    align: vc.align,
    truncate: false,
    width: vc.align === 'right' ? 110 : vc.header.includes('Name') ? 200 : 170,
    cell: (r: LabTestListRow) => vc.cell(r),
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
        emptyMessage="No tests found"
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
