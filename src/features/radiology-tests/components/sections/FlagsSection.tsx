'use client'

import type { RadiologyTest } from '../../interfaces'
import { STATUS_OPTIONS, opts } from '../../utils/constants'
import { SelectField, YesNoField } from '../controls'

/* ─── Flags Section (radiology) ─── */
export function FlagsSection({ data, set }: { data: RadiologyTest; set: (f: keyof RadiologyTest, v: unknown) => void }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <YesNoField label="Bill Only Test" value={data.billOnlyTest} onChange={x => set('billOnlyTest', x)} />
      <YesNoField label="Allow Discounts" value={data.isAllowDiscounts} onChange={x => set('isAllowDiscounts', x)} />
      <YesNoField label="Outsource" value={data.outsource} onChange={x => set('outsource', x)} />
      <YesNoField label="Preference Test" value={data.preferredTest} onChange={x => set('preferredTest', x)} />
      <YesNoField label="Hide in Order Screen" value={data.hideInOrderScreen} onChange={x => set('hideInOrderScreen', x)} />
      <SelectField label="Test Status" value={data.testStatus} onChange={v => set('testStatus', v)} options={opts(STATUS_OPTIONS)} />
    </div>
  )
}
