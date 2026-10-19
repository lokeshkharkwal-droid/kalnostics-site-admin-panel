'use client'

import { Input } from '@/shared/ui'
import type { RadiologyTest } from '../../interfaces'
import { TAT_UNITS, opts } from '../../utils/constants'
import { Label, SelectField } from '../controls'

/* ─── TAT Section (radiology — flat: just the min/max turnaround) ─── */
export function TATSection({ data, set }: { data: RadiologyTest; set: (f: keyof RadiologyTest, v: unknown) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>TAT Minimum</Label>
        <div className="mt-1 flex gap-2">
          <Input type="number" value={data.tatMin} onChange={e => set('tatMin', +e.target.value)} />
          <SelectField className="w-32" value={data.tatMinUnit} onChange={v => set('tatMinUnit', v)} options={opts(TAT_UNITS)} />
        </div>
      </div>
      <div>
        <Label>TAT Maximum</Label>
        <div className="mt-1 flex gap-2">
          <Input type="number" value={data.tatMax} onChange={e => set('tatMax', +e.target.value)} />
          <SelectField className="w-32" value={data.tatMaxUnit} onChange={v => set('tatMaxUnit', v)} options={opts(TAT_UNITS)} />
        </div>
      </div>
    </div>
  )
}
