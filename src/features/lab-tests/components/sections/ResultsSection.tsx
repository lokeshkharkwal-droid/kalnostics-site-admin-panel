'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { cn } from '@/shared/utils'
import { Button, Input } from '@/shared/ui'
import type { LabTest, ResultItem } from '../../interfaces'
import { ENTRY_MODES, GROUP_LAYOUTS, METHODS, PARAMETER_TYPES, RESULT_TYPES, opts } from '../../utils/constants'
import { Modal } from '../Modal'
import { SelectField, TextArea, YesNoField } from '../controls'
import { PencilIcon, PlusIcon, StarIcon, TrashIcon } from '../icons'
import { ReflexTestPicker } from './ReflexTestPicker'

/* ─── Results Section ───
   Group Settings / Icon Settings / Image Settings and the file attachment are
   intentionally omitted (tenant settings refs, not applicable to templates). */
export function ResultsSection({ data, setData }: { data: LabTest; setData: Dispatch<SetStateAction<LabTest>> }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<ResultItem | null>(null)
  const emptyResult = (): ResultItem => ({
    id: `r-${Date.now()}`, groupName: '', groupLayout: '1 Column', parameterName: '', parameterCode: '', method: '',
    nabl: false, cap: false, parameterType: 'Measured', resultEntryMode: 'Manual', calculationFormula: '',
    reportingUnit: '', resultRounding: '2 Decimal', allowableUnits: '', decimalPlaces: 2, resultType: 'Quantitative',
    reflexTests: [], criticalValueMin: '', criticalValueMax: '', notes: '', isDefault: data.results.length === 0,
  })
  const [form, setForm] = useState<ResultItem>(emptyResult())

  const openAdd = () => { setForm(emptyResult()); setEditItem(null); setFormOpen(true) }
  const openEdit = (r: ResultItem) => { setForm({ ...r }); setEditItem(r); setFormOpen(true) }

  const handleSave = () => {
    setData(prev => editItem
      ? { ...prev, results: prev.results.map(r => r.id === editItem.id ? form : r) }
      : { ...prev, results: [...prev.results, form] })
    setFormOpen(false)
  }
  const makeDefault = (id: string) => setData(prev => ({ ...prev, results: prev.results.map(r => ({ ...r, isDefault: r.id === id })) }))
  const deleteResult = (id: string) => setData(prev => ({ ...prev, results: prev.results.filter(r => r.id !== id) }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-notion-sub">{data.results.length} result parameter(s)</span>
        <Button size="sm" onClick={openAdd}><PlusIcon className="h-3.5 w-3.5" />Add Result</Button>
      </div>

      {data.results.map(r => (
        <div key={r.id} className={cn('flex items-start justify-between gap-3 rounded-lg border p-3', r.isDefault ? 'border-blue-200 bg-blue-50/40' : 'border-notion-line bg-notion-panel')}>
          <div className="grid flex-1 grid-cols-4 gap-2 text-xs text-notion-sub">
            <span><strong>Parameter:</strong> {r.parameterName || '—'}</span>
            <span><strong>Method:</strong> {r.method || '—'}</span>
            <span><strong>Unit:</strong> {r.reportingUnit || '—'}</span>
            <span><strong>Type:</strong> {r.resultType}</span>
            <span><strong>NABL:</strong> {r.nabl ? 'Yes' : 'No'}</span>
            {r.isDefault && <span className="flex items-center gap-1 text-notion-blue"><StarIcon className="h-3 w-3" />Default</span>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" title="Edit result" onClick={() => openEdit(r)} className="rounded p-1.5 text-notion-sub hover:bg-notion-hover"><PencilIcon className="h-3.5 w-3.5" /></button>
            {!r.isDefault && <Button size="sm" variant="secondary" onClick={() => makeDefault(r.id)}>Set Default</Button>}
            <button type="button" title="Delete result" onClick={() => deleteResult(r.id)} className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      {data.results.length === 0 && (
        <div className="rounded-lg border border-dashed border-notion-line2 py-8 text-center text-sm text-notion-faint">No results added yet</div>
      )}

      {formOpen && (
        <Modal
          title={editItem ? 'Edit Result' : 'Add Result'}
          size="lg"
          onClose={() => setFormOpen(false)}
          footer={<>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Result</Button>
          </>}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input label="Group Name" value={form.groupName} onChange={e => setForm(p => ({ ...p, groupName: e.target.value }))} />
            <SelectField label="Group Layout" value={form.groupLayout} onChange={v => setForm(p => ({ ...p, groupLayout: v }))} options={opts(GROUP_LAYOUTS)} />
            <Input label="Parameter Name" value={form.parameterName} onChange={e => setForm(p => ({ ...p, parameterName: e.target.value }))} />
            <Input label="Parameter Code" value={form.parameterCode} onChange={e => setForm(p => ({ ...p, parameterCode: e.target.value }))} />
            <SelectField label="Method" value={form.method} onChange={v => setForm(p => ({ ...p, method: v }))} options={opts(METHODS)} placeholder="Select…" />
            <Input label="Reporting Unit" value={form.reportingUnit} onChange={e => setForm(p => ({ ...p, reportingUnit: e.target.value }))} />
            <SelectField label="Result Type" value={form.resultType} onChange={v => setForm(p => ({ ...p, resultType: v }))} options={opts(RESULT_TYPES)} />
            <SelectField label="Parameter Type" value={form.parameterType} onChange={v => setForm(p => ({ ...p, parameterType: v }))} options={opts(PARAMETER_TYPES)} />
            <SelectField label="Result Entry Mode" value={form.resultEntryMode} onChange={v => setForm(p => ({ ...p, resultEntryMode: v }))} options={opts(ENTRY_MODES)} />
            <div className="col-span-2">
              <Input label="Calculation Formula" placeholder="e.g. (A + B) / 2" value={form.calculationFormula} onChange={e => setForm(p => ({ ...p, calculationFormula: e.target.value }))} />
            </div>
            <Input label="Result Rounding Type" placeholder="e.g. 2 Decimal / Whole Number" value={form.resultRounding} onChange={e => setForm(p => ({ ...p, resultRounding: e.target.value }))} />
            <Input label="Allowable Units" placeholder="e.g. mg/dL, g/L" value={form.allowableUnits ?? ''} onChange={e => setForm(p => ({ ...p, allowableUnits: e.target.value }))} />
            <Input label="Decimal Places" type="number" min={0} value={form.decimalPlaces} onChange={e => setForm(p => ({ ...p, decimalPlaces: Number(e.target.value) }))} />
            <Input label="Critical Value Min" type="number" placeholder="e.g. 7" value={form.criticalValueMin} onChange={e => setForm(p => ({ ...p, criticalValueMin: e.target.value }))} />
            <Input label="Critical Value Max" type="number" placeholder="e.g. 20" value={form.criticalValueMax} onChange={e => setForm(p => ({ ...p, criticalValueMax: e.target.value }))} />
            <div className="col-span-2">
              <ReflexTestPicker
                selected={form.reflexTests}
                onAdd={o => setForm(p => p.reflexTests.some(rt => rt.id === o.id) ? p : { ...p, reflexTests: [...p.reflexTests, o] })}
                onRemove={id => setForm(p => ({ ...p, reflexTests: p.reflexTests.filter(x => x.id !== id) }))}
              />
            </div>
            <div className="col-span-2">
              <TextArea label="Notes" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <YesNoField label="NABL" value={form.nabl} onChange={v => setForm(p => ({ ...p, nabl: v }))} />
            <YesNoField label="CAP" value={form.cap} onChange={v => setForm(p => ({ ...p, cap: v }))} />
          </div>
        </Modal>
      )}
    </div>
  )
}
