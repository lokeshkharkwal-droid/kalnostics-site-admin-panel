'use client'

import { cn } from '@/shared/utils'
import { Input } from '@/shared/ui'
import type { LabTest } from '../../interfaces'
import { SCHEDULE_DAYS, TAT_UNITS, opts } from '../../utils/constants'
import { Label, SelectField, TimeField } from '../controls'

/* ─── TAT Section ─── */
export function TATSection({ data, set }: { data: LabTest; set: (f: keyof LabTest, v: unknown) => void }) {
  const toggleDay = (day: string) =>
    set('scheduleDays', data.scheduleDays.includes(day) ? data.scheduleDays.filter(d => d !== day) : [...data.scheduleDays, day])

  return (
    <div className="space-y-4">
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

      <div>
        <Label>Schedule Days</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SCHEDULE_DAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={cn(
                'h-7 rounded-md border px-3 text-xs font-medium transition-colors',
                data.scheduleDays.includes(day)
                  ? 'border-notion-blue bg-notion-blue text-white'
                  : 'border-notion-line2 bg-white text-notion-sub hover:bg-notion-hover',
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TimeField label="Schedule Time From" value={data.scheduleTimeFrom} onChange={v => set('scheduleTimeFrom', v)} />
        <TimeField label="Schedule Time To" value={data.scheduleTimeTo} onChange={v => set('scheduleTimeTo', v)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Processing Time Min</Label>
          <div className="mt-1 flex gap-2">
            <Input type="number" value={data.procTimeMin} onChange={e => set('procTimeMin', +e.target.value)} />
            <SelectField className="w-32" value={data.procTimeMinUnit} onChange={v => set('procTimeMinUnit', v)} options={opts(TAT_UNITS)} />
          </div>
        </div>
        <div>
          <Label>Processing Time Max</Label>
          <div className="mt-1 flex gap-2">
            <Input type="number" value={data.procTimeMax} onChange={e => set('procTimeMax', +e.target.value)} />
            <SelectField className="w-32" value={data.procTimeMaxUnit} onChange={v => set('procTimeMaxUnit', v)} options={opts(TAT_UNITS)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TimeField label="Approval Time From" value={data.approvalTimeFrom} onChange={v => set('approvalTimeFrom', v)} />
        <TimeField label="Approval Time To" value={data.approvalTimeTo} onChange={v => set('approvalTimeTo', v)} />
      </div>
    </div>
  )
}
