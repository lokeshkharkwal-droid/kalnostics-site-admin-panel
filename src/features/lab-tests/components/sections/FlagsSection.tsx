'use client'

import type { LabTest } from '../../interfaces'
import { STATUS_OPTIONS, opts } from '../../utils/constants'
import { SelectField, YesNoField } from '../controls'

/* ─── Flags Section ─── */
export function FlagsSection({ data, set }: { data: LabTest; set: (f: keyof LabTest, v: unknown) => void }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <YesNoField label="Bill Only Test" value={data.billOnlyTest} onChange={x => set('billOnlyTest', x)} />
      <YesNoField label="Allow Discounts" value={data.isAllowDiscounts} onChange={x => set('isAllowDiscounts', x)} />
      <YesNoField label="Outsource" value={data.outsource} onChange={x => set('outsource', x)} />
      <YesNoField label="Preference Test" value={data.preferredTest} onChange={x => set('preferredTest', x)} />
      <YesNoField label="Sample Flow" value={data.sampleFlow} onChange={x => set('sampleFlow', x)} />
      <SelectField label="Test Status" value={data.testStatus} onChange={v => set('testStatus', v)} options={opts(STATUS_OPTIONS)} />
    </div>
  )
}
