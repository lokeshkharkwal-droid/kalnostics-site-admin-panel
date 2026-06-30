'use client'

import { cn } from '@/shared/utils'
import { Button } from './button'
import { BRANCH_TYPE_OPTIONS, type BranchType } from '@/shared/constants/branch-modules'

/**
 * Branch-modules ("module mapping") picker — a row of toggle buttons, one per
 * `BranchType`. Selected modules render as filled (primary) buttons, the rest as
 * outlined (secondary). Used by the Department / Category / Sub-Category forms.
 */
export function ModuleMultiSelect({
  value, onChange, disabled, className,
}: {
  value: BranchType[]
  onChange: (next: BranchType[]) => void
  disabled?: boolean
  className?: string
}) {
  const toggle = (m: BranchType) =>
    onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m])

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {BRANCH_TYPE_OPTIONS.map((m) => (
        <Button
          key={m.value}
          type="button"
          size="sm"
          variant={value.includes(m.value) ? 'primary' : 'secondary'}
          disabled={disabled}
          onClick={() => toggle(m.value)}
        >
          {m.label}
        </Button>
      ))}
    </div>
  )
}
