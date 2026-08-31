'use client'

import { cn } from '@/shared/utils'
import { ActionMenu, AutosuggestInput, DataTable, Input, type Column } from '@/shared/ui'
import type { ResultItem } from '../../../interfaces'
import { PARAMETER_TYPES, RESULT_TYPES, opts } from '../../../utils/constants'
import { SelectField } from '../../controls'
import { StarIcon } from '../../icons'
import type { ConfigPanelKey } from './ParameterConfigPanel'

export const TOGGLEABLE_COLUMNS = [
  { key: 'parameterName', label: 'Parameter Name' },
  { key: 'parameterCode', label: 'Parameter Code' },
  { key: 'method', label: 'Method' },
  { key: 'reportingUnit', label: 'Reporting Unit' },
  { key: 'resultType', label: 'Result Type' },
  { key: 'parameterType', label: 'Parameter Type' },
  { key: 'nabl', label: 'NABL' },
  { key: 'cap', label: 'CAP' },
  { key: 'resultRounding', label: 'Result Rounding Type' },
] as const
export type ToggleableColumnKey = typeof TOGGLEABLE_COLUMNS[number]['key']

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

/** Stops a cell interaction from also bubbling up to the row's onClick (expand). */
function stop(e: React.SyntheticEvent) { e.stopPropagation() }

export function ParametersTable({
  rows, visibleColumnKeys, methodSuggestions,
  onUpdateRow, onDeleteRow, onMakeDefault, onExpand, onOpenSubpanel,
}: {
  rows: ResultItem[]
  visibleColumnKeys: Set<ToggleableColumnKey>
  methodSuggestions: string[]
  onUpdateRow: (id: string, patch: Partial<ResultItem>) => void
  onDeleteRow: (id: string) => void
  onMakeDefault: (id: string) => void
  onExpand: (id: string) => void
  onOpenSubpanel: (id: string, key: ConfigPanelKey) => void
}) {
  const columns: Column<ResultItem>[] = [
    {
      id: '#',
      header: '#',
      width: 60,
      minWidth: 60,
      resizable: false,
      truncate: false,
      cell: (row, index) => (
        <button
          type="button"
          title={row.isDefault ? 'Default parameter' : 'Set as default'}
          onClick={e => { stop(e); onMakeDefault(row.id) }}
          className={cn('flex items-center gap-1 text-xs', row.isDefault ? 'text-notion-blue' : 'text-notion-faint hover:text-notion-sub')}
        >
          <StarIcon className="h-3.5 w-3.5" /> {index + 1}
        </button>
      ),
    },
  ]

  if (visibleColumnKeys.has('parameterName')) columns.push({
    id: 'parameterName', header: 'Parameter Name*', width: 170, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <Input value={row.parameterName} onChange={e => onUpdateRow(row.id, { parameterName: e.target.value })} />
      </div>
    ),
  })
  if (visibleColumnKeys.has('parameterCode')) columns.push({
    id: 'parameterCode', header: 'Parameter Code*', width: 140, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <Input value={row.parameterCode} onChange={e => onUpdateRow(row.id, { parameterCode: e.target.value })} />
      </div>
    ),
  })
  if (visibleColumnKeys.has('method')) columns.push({
    id: 'method', header: 'Method', width: 190, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <AutosuggestInput value={row.method} onChange={v => onUpdateRow(row.id, { method: v })} suggestions={methodSuggestions} placeholder="Type or select…" />
      </div>
    ),
  })
  if (visibleColumnKeys.has('reportingUnit')) columns.push({
    id: 'reportingUnit', header: 'Reporting Unit', width: 130, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <Input value={row.reportingUnit} onChange={e => onUpdateRow(row.id, { reportingUnit: e.target.value })} />
      </div>
    ),
  })
  if (visibleColumnKeys.has('resultType')) columns.push({
    id: 'resultType', header: 'Result Type', width: 160, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <SelectField value={row.resultType} onChange={v => onUpdateRow(row.id, { resultType: v })} options={opts(RESULT_TYPES)} />
      </div>
    ),
  })
  if (visibleColumnKeys.has('parameterType')) columns.push({
    id: 'parameterType', header: 'Parameter Type', width: 150, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <SelectField value={row.parameterType} onChange={v => onUpdateRow(row.id, { parameterType: v })} options={opts(PARAMETER_TYPES)} />
      </div>
    ),
  })
  if (visibleColumnKeys.has('nabl')) columns.push({
    id: 'nabl', header: 'NABL', width: 90, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <SelectField value={row.nabl ? 'yes' : 'no'} onChange={v => onUpdateRow(row.id, { nabl: v === 'yes' })} options={YES_NO} />
      </div>
    ),
  })
  if (visibleColumnKeys.has('cap')) columns.push({
    id: 'cap', header: 'CAP', width: 90, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <SelectField value={row.cap ? 'yes' : 'no'} onChange={v => onUpdateRow(row.id, { cap: v === 'yes' })} options={YES_NO} />
      </div>
    ),
  })
  if (visibleColumnKeys.has('resultRounding')) columns.push({
    id: 'resultRounding', header: 'Result Rounding Type', width: 190, truncate: false,
    cell: row => (
      <div onClick={stop}>
        <Input placeholder="e.g. 2 Decimal" value={row.resultRounding} onChange={e => onUpdateRow(row.id, { resultRounding: e.target.value })} />
      </div>
    ),
  })

  return (
    <DataTable<ResultItem>
      frame={false}
      columns={columns}
      rows={rows}
      rowKey={r => r.id}
      onRowClick={row => onExpand(row.id)}
      emptyMessage="No parameters yet — click “Add Parameter” to start."
      actions={row => (
        <ActionMenu
          items={[
            { label: 'Configure Reflex Tests', onClick: () => onOpenSubpanel(row.id, 'reflexTest') },
            { label: 'Configure Calculation Formula', onClick: () => onOpenSubpanel(row.id, 'calculationFormula') },
            { label: 'Configure Allowable Units', onClick: () => onOpenSubpanel(row.id, 'allowableUnits') },
            { label: 'Configure Notes', onClick: () => onOpenSubpanel(row.id, 'notes') },
            { label: 'Delete Parameter', variant: 'danger', onClick: () => onDeleteRow(row.id) },
          ]}
        />
      )}
    />
  )
}
