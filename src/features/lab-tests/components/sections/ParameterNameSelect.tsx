'use client'

import type { ResultItem } from '../../interfaces'
import { SelectField } from '../controls'

/**
 * Picks a parameter from the test's result parameters — reference ranges/values
 * are linked to a parameter by its name (see mapping.ts), so the choice is
 * restricted to existing parameters.
 */
export function ParameterNameSelect({
  results, value, onChange, disabled,
}: {
  results: ResultItem[]
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const named = results.filter(r => r.parameterName.trim())
  return (
    <SelectField
      label="Parameter"
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={named.length ? 'Select parameter…' : 'Add a result parameter first'}
      options={named.map(r => ({ value: r.parameterName, label: r.parameterName }))}
    />
  )
}
