'use client'

import { cn } from '@/shared/utils'
import type { RadiologyTest } from '../../interfaces'
import { SCHEDULE_DAYS } from '../../utils/constants'
import { Label, TimeField } from '../controls'

/* ─── Schedule Section (radiology) ─── */
export function ScheduleSection({ data, set }: { data: RadiologyTest; set: (f: keyof RadiologyTest, v: unknown) => void }) {
  const toggleDay = (day: string) =>
    set('scheduleDays', data.scheduleDays.includes(day) ? data.scheduleDays.filter(d => d !== day) : [...data.scheduleDays, day])

  return (
    <div className="space-y-4">
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
    </div>
  )
}
