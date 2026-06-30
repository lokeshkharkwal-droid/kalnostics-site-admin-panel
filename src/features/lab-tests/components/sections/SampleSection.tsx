'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { cn } from '@/shared/utils'
import { Button, Input } from '@/shared/ui'
import type { LabTest, SampleItem } from '../../interfaces'
import { CONTAINERS, SAMPLE_TYPES, opts } from '../../utils/constants'
import { Modal } from '../Modal'
import { SelectField, TextArea, YesNoField } from '../controls'
import { PencilIcon, PlusIcon, StarIcon, TrashIcon } from '../icons'

/* ─── Sample Section ─── */
export function SampleSection({ data, setData }: { data: LabTest; setData: Dispatch<SetStateAction<LabTest>> }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<SampleItem | null>(null)
  const emptySample = (): SampleItem => ({
    id: `s-${Date.now()}`, sampleName: '', sampleType: '', containerType: '', sampleSize: '',
    collectionMethod: '', fastingRequired: false, numberOfSamples: 1, stability: '',
    lightProtection: false, preservative: '', transportTemp: '', handlingInstructions: '',
    isDefault: data.samples.length === 0,
  })
  const [form, setForm] = useState<SampleItem>(emptySample())

  const openAdd = () => { setForm(emptySample()); setEditItem(null); setFormOpen(true) }
  const openEdit = (s: SampleItem) => { setForm({ ...s }); setEditItem(s); setFormOpen(true) }

  const handleSave = () => {
    setData(prev => editItem
      ? { ...prev, samples: prev.samples.map(s => s.id === editItem.id ? form : s) }
      : { ...prev, samples: [...prev.samples, form] })
    setFormOpen(false)
  }
  const makeDefault = (id: string) => setData(prev => ({ ...prev, samples: prev.samples.map(s => ({ ...s, isDefault: s.id === id })) }))
  const deleteSample = (id: string) => setData(prev => ({ ...prev, samples: prev.samples.filter(s => s.id !== id) }))

  // Auto-fill on sample name change
  const handleSampleNameChange = (name: string) => {
    const autoFill: Record<string, Partial<SampleItem>> = {
      'Blood (EDTA)': { sampleType: 'Blood', containerType: 'EDTA Tube (Purple)', transportTemp: '2-8°C', stability: '24h at 4°C' },
      'Serum (Plain)': { sampleType: 'Serum', containerType: 'Plain Tube (Red)', transportTemp: '2-8°C', stability: '7 days at -20°C' },
      Urine: { sampleType: 'Urine', containerType: 'Urine Container', transportTemp: '2-8°C', stability: '4h at RT' },
    }
    setForm(prev => ({ ...prev, sampleName: name, ...(autoFill[name] ?? {}) }))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-notion-sub">{data.samples.length} sample(s)</span>
        <Button size="sm" onClick={openAdd}><PlusIcon className="h-3.5 w-3.5" />Add Sample</Button>
      </div>

      {data.samples.map(s => (
        <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg border border-notion-line bg-notion-panel p-3">
          <div className="grid flex-1 grid-cols-4 gap-2 text-xs text-notion-sub">
            <span><strong>Sample:</strong> {s.sampleName || '—'}</span>
            <span><strong>Type:</strong> {s.sampleType || '—'}</span>
            <span><strong>Container:</strong> {s.containerType || '—'}</span>
            <span><strong>Size:</strong> {s.sampleSize || '—'}</span>
            <span><strong>Fasting:</strong> {s.fastingRequired ? 'Yes' : 'No'}</span>
            <span><strong>Transport:</strong> {s.transportTemp || '—'}</span>
            <span><strong>Stability:</strong> {s.stability || '—'}</span>
            {s.isDefault && <span className="flex items-center gap-1 text-notion-blue"><StarIcon className="h-3 w-3" />Default</span>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" title="Edit sample" onClick={() => openEdit(s)} className="rounded p-1.5 text-notion-sub hover:bg-notion-hover"><PencilIcon className="h-3.5 w-3.5" /></button>
            {!s.isDefault && <Button size="sm" variant="secondary" onClick={() => makeDefault(s.id)}>Set Default</Button>}
            <button type="button" title="Delete sample" onClick={() => deleteSample(s.id)} className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      {data.samples.length === 0 && (
        <div className="rounded-lg border border-dashed border-notion-line2 py-8 text-center text-sm text-notion-faint">No samples added yet</div>
      )}

      {formOpen && (
        <Modal
          title={editItem ? 'Edit Sample' : 'Add Sample'}
          size="lg"
          onClose={() => setFormOpen(false)}
          footer={<>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Sample</Button>
          </>}
        >
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Sample Name" value={form.sampleName} onChange={handleSampleNameChange} options={opts(SAMPLE_TYPES)} placeholder="Select…" />
            <Input label="Sample Type" value={form.sampleType} onChange={e => setForm(p => ({ ...p, sampleType: e.target.value }))} />
            <SelectField label="Container Type" value={form.containerType} onChange={v => setForm(p => ({ ...p, containerType: v }))} options={opts(CONTAINERS)} placeholder="Select…" />
            <Input label="Sample Size" value={form.sampleSize} onChange={e => setForm(p => ({ ...p, sampleSize: e.target.value }))} />
            <Input label="Collection Method" value={form.collectionMethod} onChange={e => setForm(p => ({ ...p, collectionMethod: e.target.value }))} />
            <Input label="Number of Samples" type="number" value={form.numberOfSamples} onChange={e => setForm(p => ({ ...p, numberOfSamples: +e.target.value }))} />
            <Input label="Stability" value={form.stability} onChange={e => setForm(p => ({ ...p, stability: e.target.value }))} />
            <Input label="Transport Temperature" value={form.transportTemp} onChange={e => setForm(p => ({ ...p, transportTemp: e.target.value }))} />
            <Input label="Preservative" value={form.preservative} onChange={e => setForm(p => ({ ...p, preservative: e.target.value }))} />
            <div className="col-span-2">
              <TextArea label="Sample Handling Instructions" rows={2} value={form.handlingInstructions} onChange={e => setForm(p => ({ ...p, handlingInstructions: e.target.value }))} />
            </div>
            <YesNoField label="Fasting Required" value={form.fastingRequired} onChange={v => setForm(p => ({ ...p, fastingRequired: v }))} />
            <YesNoField label="Light Protection" value={form.lightProtection} onChange={v => setForm(p => ({ ...p, lightProtection: v }))} />
            <YesNoField label="Set as Default" value={form.isDefault} onChange={v => setForm(p => ({ ...p, isDefault: v }))} />
          </div>
        </Modal>
      )}
    </div>
  )
}
