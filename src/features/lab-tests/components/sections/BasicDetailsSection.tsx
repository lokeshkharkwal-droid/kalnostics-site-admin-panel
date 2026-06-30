'use client'

import { Input } from '@/shared/ui'
import type { LabTest } from '../../interfaces'
import { INTERVAL_UNITS, PROCESS_METHODS, SAMPLE_PRIORITIES, opts } from '../../utils/constants'
import { SelectField, YesNoField } from '../controls'

/* ─── Basic Details Section ───
   Department / Category / Sub Category / Report Template / PDF Settings /
   Image Settings / Approval Workflow / Mandatory Test are intentionally omitted
   — they don't apply to a SITE_ADMIN global template. */
export function BasicDetailsSection({ data, set }: { data: LabTest; set: (f: keyof LabTest, v: unknown) => void }) {
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
        <SelectField label="Process Method" value={data.processMethod} onChange={v => set('processMethod', v)} options={opts(PROCESS_METHODS)} />
        <Input label="ICD Code" value={data.icdCode} onChange={e => set('icdCode', e.target.value)} />
        <Input label="LOINC Code" value={data.loincCode} onChange={e => set('loincCode', e.target.value)} />
        <div className="col-span-2">
          <Input label="Clinical Tags" placeholder="e.g. Anemia, Cardiac…" value={data.clinicalTags} onChange={e => set('clinicalTags', e.target.value)} />
        </div>
        <SelectField label="Sample Priority Type" value={data.samplePriorityType} onChange={v => set('samplePriorityType', v)} options={opts(SAMPLE_PRIORITIES)} />
        <YesNoField label="Enable CMS" value={data.enable} onChange={x => set('enable', x)} />
      </div>

      <div className="grid grid-cols-3 gap-4 pt-1">
        <YesNoField label="Hide in Order Screen" value={data.hideInOrderScreen} onChange={x => set('hideInOrderScreen', x)} />
        <YesNoField label="Repeat Interval Restriction" value={data.repeatIntervalRestriction} onChange={x => set('repeatIntervalRestriction', x)} />
      </div>

      {data.repeatIntervalRestriction && (
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-notion-panel p-3">
          <Input label="Repeat Interval" type="number" value={data.intervalDuration} onChange={e => set('intervalDuration', e.target.value)} />
          <SelectField label="Interval Unit" value={data.intervalUnit} onChange={v => set('intervalUnit', v)} options={opts(INTERVAL_UNITS)} />
        </div>
      )}
    </div>
  )
}
