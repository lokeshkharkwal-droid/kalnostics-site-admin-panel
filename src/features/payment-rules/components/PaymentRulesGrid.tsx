'use client'

import { Badge, DataTable, type Column } from '@/shared/ui'
import { EyeIcon, PencilIcon, TrashIcon } from '@/shared/ui/icons'
import { CALC_TYPE_LABELS, RULE_TYPE_LABELS, type PaymentRuleEntity } from '../interfaces'
import { fmtDateRange } from '../utils/mapping'

/**
 * Payment rule listing grid. Columns: S.No., Name, Rule, Tenant, Branch, Class,
 * Calculation, Value, Tax, Dates, Rank, Status, Actions (View / Edit / Delete).
 * Tenant/Branch render a color-coded "Global"/"All" badge when null or 0.
 */
export function PaymentRulesGrid({
  rows, startIndex, loading, onView, onEdit, onDelete,
}: {
  rows: PaymentRuleEntity[]
  startIndex: number
  loading: boolean
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const classText = (r: PaymentRuleEntity) => [r.class1, r.class2].filter(Boolean).join(' / ') || '—'
  const valueText = (r: PaymentRuleEntity) =>
    r.calculationType === 'PERCENT' ? `${r.calculationValue}%` : r.calculationValue
  const taxText = (r: PaymentRuleEntity) => {
    if (!r.taxType && r.taxPercentage == null) return '—'
    const pct = r.taxPercentage != null ? ` (${r.taxPercentage}%)` : ''
    return `${r.taxType ?? ''}${pct}`.trim()
  }

  const columns: Column<PaymentRuleEntity>[] = [
    { header: 'S.No.', width: 64, resizable: false, truncate: false, align: 'left',
      cell: (_r, i) => <span className="text-notion-sub">{i + 1}</span> },
    { header: 'Name', width: 190, tooltip: r => r.name,
      cell: r => <span className="font-medium text-notion-text">{r.name}</span> },
    { header: 'Rule', width: 160, truncate: false, tooltip: r => RULE_TYPE_LABELS[r.ruleType],
      cell: r => <Badge variant="primary">{RULE_TYPE_LABELS[r.ruleType]}</Badge> },
    { header: 'Tenant', width: 100, truncate: false,
      cell: r => (r.tenantId ? <span className="text-notion-sub">{r.tenantId}</span> : <Badge variant="info">Global</Badge>) },
    { header: 'Branch', width: 100, truncate: false,
      cell: r => (r.branchId ? <span className="text-notion-sub">{r.branchId}</span> : <Badge variant="info">All</Badge>) },
    { header: 'Class', width: 150, tooltip: classText,
      cell: r => <span className="text-notion-sub">{classText(r)}</span> },
    { header: 'Calculation', width: 130, tooltip: r => CALC_TYPE_LABELS[r.calculationType],
      cell: r => <span className="text-notion-sub">{CALC_TYPE_LABELS[r.calculationType]}</span> },
    { header: 'Value', width: 90, align: 'right',
      cell: r => <span className="text-notion-text">{valueText(r)}</span> },
    { header: 'Tax', width: 130, tooltip: taxText,
      cell: r => <span className="text-notion-sub">{taxText(r)}</span> },
    { header: 'Dates', width: 190, truncate: false, tooltip: r => fmtDateRange(r.effectivePeriodStartDate, r.effectivePeriodEndDate),
      cell: r => <span className="text-notion-sub">{fmtDateRange(r.effectivePeriodStartDate, r.effectivePeriodEndDate)}</span> },
    { header: 'Rank', width: 72, align: 'right', resizable: false,
      cell: r => <span className="text-notion-sub">{r.rank}</span> },
    { header: 'Status', width: 110, truncate: false,
      cell: r => <Badge variant={r.isActive ? 'success' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <DataTable
      rows={rows}
      rowKey={r => r.id}
      columns={columns}
      loading={loading}
      startIndex={startIndex}
      emptyMessage="No payment rules found"
      actions={r => (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onView(r.id)} title="View" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><EyeIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => onEdit(r.id)} title="Edit" className="rounded p-1.5 text-notion-sub hover:bg-notion-hover hover:text-notion-text"><PencilIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(r.id)} title="Delete" className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-4 w-4" /></button>
        </div>
      )}
    />
  )
}
