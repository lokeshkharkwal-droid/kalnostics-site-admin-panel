'use client'

import { Input } from '@/shared/ui'
import type { AgeRestrictionValue } from '../../interfaces'
import { AGE_UNITS, opts } from '../../utils/constants'
import { MAX_AGE_VALUE, validateAgeRestriction } from '../../utils/ageRestriction'
import { SelectField } from '../controls'

type AgeField = keyof AgeRestrictionValue

/** Keep only digits, at most 3 (0–999), so the field never holds a sign, decimal or exponent. */
const digitsOnly = (raw: string) => raw.replace(/\D/g, '').slice(0, String(MAX_AGE_VALUE).length)

/**
 * Minimum / Maximum Age (value + unit) shown under Basic Details while
 * "Age Restriction" is Yes — same reveal-panel style as Repeat Interval.
 */
export function AgeRestrictionFields({ value, onChange }: {
  value: AgeRestrictionValue
  onChange: (field: AgeField, val: unknown) => void
}) {
  const error = validateAgeRestriction(value)
  const bound = (label: string, field: 'minAge' | 'maxAge', unitField: 'minAgeUnit' | 'maxAgeUnit') => (
    <div className="grid grid-cols-2 items-end gap-2">
      <Input
        id={`age-restriction-${field}`}
        label={<>{label} <span className="text-notion-red">*</span></>}
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={value[field]}
        aria-invalid={Boolean(error)}
        onChange={e => onChange(field, digitsOnly(e.target.value))}
      />
      <SelectField aria-label={`${label} unit`} value={value[unitField]} onChange={u => onChange(unitField, u)} options={opts(AGE_UNITS)} />
    </div>
  )

  return (
    <div className="space-y-2 rounded-lg bg-notion-panel p-3" data-testid="age-restriction-fields">
      <div className="grid grid-cols-3 gap-4">
        {bound('Minimum Age', 'minAge', 'minAgeUnit')}
        {bound('Maximum Age', 'maxAge', 'maxAgeUnit')}
        <p className="self-end pb-1 text-xs text-notion-faint">
          The test can only be ordered for patients within this age range. Set Age Restriction to No for no age limit.
        </p>
      </div>
      {error && <p className="text-xs text-notion-red" role="alert">{error}</p>}
    </div>
  )
}
