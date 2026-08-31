'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Badge, Button, Input } from '@/shared/ui'
import type { LabTest, ResultItem } from '../../../interfaces'
import { GROUP_LAYOUTS, METHODS, opts } from '../../../utils/constants'
import { SelectField } from '../../controls'
import { GearIcon, PlusIcon } from '../../icons'
import { ParameterConfigPanel, type ConfigPanelKey, type VisiblePanels } from './ParameterConfigPanel'
import { ParametersTable, TOGGLEABLE_COLUMNS, type ToggleableColumnKey } from './ParametersTable'
import { CustomizeFieldsSheet } from './CustomizeFieldsSheet'

const makeRow = (groupName: string, groupLayout: string, isDefault: boolean): ResultItem => ({
  id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  groupName, groupLayout, parameterName: '', parameterCode: '', method: '',
  nabl: false, cap: false, parameterType: 'Measured', resultEntryMode: 'Manual', calculationFormula: '',
  reportingUnit: '', resultRounding: '2 Decimal', allowableUnits: '', decimalPlaces: 2, resultType: 'Quantitative',
  reflexTests: [], criticalValueMin: '', criticalValueMax: '', notes: '', isDefault,
})

const deriveDefaultPanels = (row: ResultItem): VisiblePanels => ({
  reflexTest: row.reflexTests.length > 0,
  calculationFormula: !!row.calculationFormula.trim(),
  allowableUnits: !!(row.allowableUnits ?? '').trim(),
  notes: !!row.notes.trim(),
})

/**
 * Batch "Add/Edit Result Group" dialog — define a Group once, then add/edit
 * many parameter rows in a table, each expandable into a config sub-panel.
 * Only mutates local state; persistence happens on the outer test form's Save.
 */
export function AddResultDialog({
  open, onClose, data, setData, editingGroupName,
}: {
  open: boolean
  onClose: () => void
  data: LabTest
  setData: Dispatch<SetStateAction<LabTest>>
  editingGroupName: string | null
}) {
  const [results, setResults] = useState<ResultItem[]>([])
  const [groupDraft, setGroupDraft] = useState({ groupName: '', groupLayout: 'Tabular Layout' })
  const [committedKey, setCommittedKey] = useState<string | null>(editingGroupName)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [visiblePanelsByRow, setVisiblePanelsByRow] = useState<Record<string, VisiblePanels>>({})
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<Set<ToggleableColumnKey>>(
    () => new Set(TOGGLEABLE_COLUMNS.map(c => c.key)),
  )
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const seeded = editingGroupName == null ? [] : data.results.filter(r => r.groupName === editingGroupName)
    setResults(seeded)
    setGroupDraft({ groupName: editingGroupName ?? '', groupLayout: seeded[0]?.groupLayout ?? 'Tabular Layout' })
    setCommittedKey(editingGroupName)
    setExpandedRowId(null)
    setVisiblePanelsByRow({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingGroupName])

  if (!open) return null

  const methodSuggestions = Array.from(new Set([...METHODS, ...data.results.map(r => r.method)].filter(Boolean)))
  const expandedRow = expandedRowId ? results.find(r => r.id === expandedRowId) ?? null : null

  const setGroupField = (patch: Partial<typeof groupDraft>) => {
    setGroupDraft(prev => ({ ...prev, ...patch }))
    setResults(prev => prev.map(r => ({ ...r, ...patch })))
  }

  const updateRow = (id: string, patch: Partial<ResultItem>) =>
    setResults(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))

  const deleteRow = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id))
    setExpandedRowId(prev => (prev === id ? null : prev))
  }

  const makeDefault = (id: string) =>
    setResults(prev => prev.map(r => ({ ...r, isDefault: r.id === id })))

  const addParameterRow = () => {
    const row = makeRow(groupDraft.groupName, groupDraft.groupLayout, results.length === 0)
    setResults(prev => [...prev, row])
    setExpandedRowId(row.id)
  }

  const getPanels = (rowId: string, row: ResultItem): VisiblePanels => visiblePanelsByRow[rowId] ?? deriveDefaultPanels(row)

  const togglePanel = (rowId: string, row: ResultItem, key: ConfigPanelKey) =>
    setVisiblePanelsByRow(prev => {
      const current = prev[rowId] ?? deriveDefaultPanels(row)
      return { ...prev, [rowId]: { ...current, [key]: !current[key] } }
    })

  const openSubpanel = (rowId: string, key: ConfigPanelKey) => {
    setExpandedRowId(rowId)
    setVisiblePanelsByRow(prev => {
      const row = results.find(r => r.id === rowId)
      const current = prev[rowId] ?? (row ? deriveDefaultPanels(row) : { reflexTest: false, calculationFormula: false, allowableUnits: false, notes: false })
      return { ...prev, [rowId]: { ...current, [key]: true } }
    })
  }

  const commit = () => {
    setData(prev => {
      const hasDefaultLocally = results.some(r => r.isDefault)
      const base = hasDefaultLocally
        ? prev.results.map(r => (committedKey !== null && r.groupName === committedKey ? r : { ...r, isDefault: false }))
        : prev.results
      if (committedKey === null) return { ...prev, results: [...base, ...results] }
      let inserted = false
      const merged = base.flatMap(r => {
        if (r.groupName !== committedKey) return [r]
        if (inserted) return []
        inserted = true
        return results
      })
      return { ...prev, results: inserted ? merged : [...merged, ...results] }
    })
    setCommittedKey(groupDraft.groupName)
  }

  const handleSaveAll = () => commit()
  const handleSaveAndClose = () => { commit(); onClose() }

  const filledCount = results.filter(r => r.parameterName.trim() && r.parameterCode.trim()).length
  const pendingCount = results.length - filledCount

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-notion-line bg-white shadow-xl">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-notion-line px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-notion-text">
                {editingGroupName == null ? 'Add Multiple Results' : 'Edit Result Group'}
              </h2>
              <p className="mt-0.5 text-xs text-notion-faint">Create and configure multiple results/parameters for this test</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSheetOpen(true)}>
                <GearIcon className="h-3.5 w-3.5" />Customize Fields
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSaveAll}>Save All Results</Button>
              <Button size="sm" onClick={handleSaveAndClose}>Save &amp; Close</Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Group Name" value={groupDraft.groupName} onChange={e => setGroupField({ groupName: e.target.value })} />
              <SelectField label="Group Layout" value={groupDraft.groupLayout} onChange={v => setGroupField({ groupLayout: v })} options={opts(GROUP_LAYOUTS)} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-notion-text">Parameters</h3>
                  <Badge>{results.length}</Badge>
                </div>
                <Button size="sm" variant="secondary" onClick={addParameterRow}>
                  <PlusIcon className="h-3.5 w-3.5" />Add Parameter
                </Button>
              </div>

              <ParametersTable
                rows={results}
                visibleColumnKeys={visibleColumnKeys}
                methodSuggestions={methodSuggestions}
                onUpdateRow={updateRow}
                onDeleteRow={deleteRow}
                onMakeDefault={makeDefault}
                onExpand={id => setExpandedRowId(id)}
                onOpenSubpanel={openSubpanel}
              />

              {expandedRow && (
                <div className="mt-3">
                  <ParameterConfigPanel
                    row={expandedRow}
                    onChange={patch => updateRow(expandedRow.id, patch)}
                    visiblePanels={getPanels(expandedRow.id, expandedRow)}
                    onTogglePanel={key => togglePanel(expandedRow.id, expandedRow, key)}
                    onCollapseRow={() => setExpandedRowId(null)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-notion-line px-5 py-3">
            <p className="text-xs text-notion-sub">
              Total Parameters: {results.length} &nbsp;&nbsp; Filled: {filledCount} &nbsp;&nbsp; Pending: {pendingCount}
            </p>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>

      <CustomizeFieldsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        visibleColumnKeys={visibleColumnKeys}
        onChange={setVisibleColumnKeys}
      />
    </>
  )
}
