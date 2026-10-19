'use client'

import { Input } from '@/shared/ui'
import type { RadiologyTest } from '../../interfaces'
import { MODALITIES, SAMPLE_PRIORITIES, opts } from '../../utils/constants'
import { SelectField, YesNoField } from '../controls'

/* ─── Basic Details Section (radiology) ───
   Department / Category / Sub Category / Report Template / Approval Workflow are
   intentionally omitted — they don't apply to a SITE_ADMIN global template.
   The radiology model is FLAT (no samples / result parameters). */
export function BasicDetailsSection({ data, set }: { data: RadiologyTest; set: (f: keyof RadiologyTest, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <Input label="Test Name *" value={data.testName} onChange={e => set('testName', e.target.value)} />
        </div>
        <Input label="Test Display Name" value={data.testDisplay} onChange={e => set('testDisplay', e.target.value)} />
        <Input label="Test Code *" value={data.testCode} onChange={e => set('testCode', e.target.value)} />
        <div className="col-span-2">
          <Input label="AKA (Also Known As)" value={data.aka} onChange={e => set('aka', e.target.value)} />
        </div>
        <SelectField label="Modality" value={data.modality} onChange={v => set('modality', v)} options={opts(MODALITIES)} />
        <Input label="Body Part" placeholder="e.g. Chest, Abdomen…" value={data.bodyPart} onChange={e => set('bodyPart', e.target.value)} />
        <Input label="View / Projection" placeholder="e.g. PA, Lateral…" value={data.view} onChange={e => set('view', e.target.value)} />
        <YesNoField label="Contrast" value={data.isContrast} onChange={x => set('isContrast', x)} />
        <Input label="ICD Code" value={data.icdCode} onChange={e => set('icdCode', e.target.value)} />
        <Input label="LOINC Code" value={data.loincCode} onChange={e => set('loincCode', e.target.value)} />
        <div className="col-span-2">
          <Input label="Clinical Tags" placeholder="e.g. Trauma, Cardiac…" value={data.clinicalTags} onChange={e => set('clinicalTags', e.target.value)} />
        </div>
        <SelectField label="Sample Priority Type" value={data.samplePriorityType} onChange={v => set('samplePriorityType', v)} options={opts(SAMPLE_PRIORITIES)} />
        <YesNoField label="Enable CMS" value={data.enable} onChange={x => set('enable', x)} />
      </div>
    </div>
  )
}
