'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { cn } from '@/shared/utils'
import { Button, Input } from '@/shared/ui'
import type { LabTest, ReferenceRangeItem } from '../../interfaces'
import { ABNORMAL_FLAG_OPTIONS, AGE_UNITS, GENDER_OPTIONS, METHODS, opts } from '../../utils/constants'
import { Modal } from '../Modal'
import { SelectField } from '../controls'
import { PencilIcon, PlusIcon, StarIcon, TrashIcon } from '../icons'
import { ParameterNameSelect } from './ParameterNameSelect'

/* ─── Reference Range Section ─── */
export function ReferenceRangeSection({ data, setData }: { data: LabTest; setData: Dispatch<SetStateAction<LabTest>> }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<ReferenceRangeItem | null>(null)
  const empty = (): ReferenceRangeItem => ({
    id: `rr-${Date.now()}`, parameter: '', method: '', gender: 'All',
    ageFrom: '0', ageFromUnit: 'Years', ageTo: '999', ageToUnit: 'Years',
    lowerLimit: '', upperLimit: '', criticalMin: '', criticalMax: '', displayRange: '', abnormalFlagLogic: 'Bold and Red', isDefault: false,
  })
  const [form, setForm] = useState<ReferenceRangeItem>(empty())

  const handleSave = () => {
    setData(prev => editItem
      ? { ...prev, referenceRanges: prev.referenceRanges.map(r => r.id === editItem.id ? form : r) }
      : { ...prev, referenceRanges: [...prev.referenceRanges, form] })
    setFormOpen(false)
  }
  const makeDefault = (id: string) => setData(prev => ({ ...prev, referenceRanges: prev.referenceRanges.map(r => ({ ...r, isDefault: r.id === id })) }))
  const deleteRange = (id: string) => setData(prev => ({ ...prev, referenceRanges: prev.referenceRanges.filter(r => r.id !== id) }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-notion-sub">{data.referenceRanges.length} reference range(s)</span>
        <Button size="sm" onClick={() => { setForm(empty()); setEditItem(null); setFormOpen(true) }}><PlusIcon className="h-3.5 w-3.5" />Add Range</Button>
      </div>

      {data.referenceRanges.map(r => (
        <div key={r.id} className={cn('flex items-start justify-between gap-3 rounded-lg border p-3', r.isDefault ? 'border-blue-200 bg-blue-50/40' : 'border-notion-line bg-notion-panel')}>
          <div className="grid flex-1 grid-cols-5 gap-2 text-xs text-notion-sub">
            <span><strong>Parameter:</strong> {r.parameter || '—'}</span>
            <span><strong>Gender:</strong> {r.gender}</span>
            <span><strong>Age:</strong> {r.ageFrom}–{r.ageTo} {r.ageToUnit}</span>
            <span><strong>Range:</strong> {r.lowerLimit || '—'} – {r.upperLimit || '—'}</span>
            <span><strong>Display:</strong> {r.displayRange || '—'}</span>
            {r.isDefault && <span className="flex items-center gap-1 text-notion-blue"><StarIcon className="h-3 w-3" />Default</span>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" title="Edit reference range" onClick={() => { setForm({ ...r }); setEditItem(r); setFormOpen(true) }} className="rounded p-1.5 text-notion-sub hover:bg-notion-hover"><PencilIcon className="h-3.5 w-3.5" /></button>
            {!r.isDefault && <Button size="sm" variant="secondary" onClick={() => makeDefault(r.id)}>Set Default</Button>}
            <button type="button" title="Delete reference range" onClick={() => deleteRange(r.id)} className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      {data.referenceRanges.length === 0 && (
        <div className="rounded-lg border border-dashed border-notion-line2 py-8 text-center text-sm text-notion-faint">No reference ranges added yet</div>
      )}

      {formOpen && (
        <Modal
          title={editItem ? 'Edit Reference Range' : 'Add Reference Range'}
          size="lg"
          onClose={() => setFormOpen(false)}
          footer={<>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Range</Button>
          </>}
        >
          <div className="grid grid-cols-2 gap-3">
            <ParameterNameSelect results={data.results} value={form.parameter} onChange={v => setForm(p => ({ ...p, parameter: v }))} />
            <SelectField label="Method" value={form.method} onChange={v => setForm(p => ({ ...p, method: v }))} options={opts(METHODS)} placeholder="Select…" />
            <SelectField label="Gender" value={form.gender} onChange={v => setForm(p => ({ ...p, gender: v }))} options={opts(GENDER_OPTIONS)} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Age From" type="number" value={form.ageFrom} onChange={e => setForm(p => ({ ...p, ageFrom: e.target.value }))} />
              <SelectField label="Unit" value={form.ageFromUnit} onChange={v => setForm(p => ({ ...p, ageFromUnit: v }))} options={opts(AGE_UNITS)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Age To" type="number" value={form.ageTo} onChange={e => setForm(p => ({ ...p, ageTo: e.target.value }))} />
              <SelectField label="Unit" value={form.ageToUnit} onChange={v => setForm(p => ({ ...p, ageToUnit: v }))} options={opts(AGE_UNITS)} />
            </div>
            <Input label="Lower Limit" value={form.lowerLimit} onChange={e => setForm(p => ({ ...p, lowerLimit: e.target.value }))} />
            <Input label="Upper Limit" value={form.upperLimit} onChange={e => setForm(p => ({ ...p, upperLimit: e.target.value }))} />
            <Input label="Critical Min" value={form.criticalMin} onChange={e => setForm(p => ({ ...p, criticalMin: e.target.value }))} />
            <Input label="Critical Max" value={form.criticalMax} onChange={e => setForm(p => ({ ...p, criticalMax: e.target.value }))} />
            <div className="col-span-2">
              <Input label="Display of Reference Range" value={form.displayRange} onChange={e => setForm(p => ({ ...p, displayRange: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <SelectField label="Abnormal Flag Logic" value={form.abnormalFlagLogic} onChange={v => setForm(p => ({ ...p, abnormalFlagLogic: v }))} options={opts(ABNORMAL_FLAG_OPTIONS)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
