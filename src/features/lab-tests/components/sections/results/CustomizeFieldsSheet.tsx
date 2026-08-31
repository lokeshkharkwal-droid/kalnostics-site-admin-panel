'use client'

import { Sheet, Toggle } from '@/shared/ui'
import { TOGGLEABLE_COLUMNS, type ToggleableColumnKey } from './ParametersTable'

/** Column-visibility picker for the parameter table's toggleable columns. */
export function CustomizeFieldsSheet({
  open, onClose, visibleColumnKeys, onChange,
}: {
  open: boolean
  onClose: () => void
  visibleColumnKeys: Set<ToggleableColumnKey>
  onChange: (next: Set<ToggleableColumnKey>) => void
}) {
  const toggle = (key: ToggleableColumnKey) => {
    const next = new Set(visibleColumnKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(next)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Customize Fields">
      <p className="mb-3 text-xs text-notion-faint">Choose which columns appear in the parameters table.</p>
      <div className="space-y-2.5">
        {TOGGLEABLE_COLUMNS.map(col => (
          <div key={col.key} className="flex items-center justify-between">
            <span className="text-sm text-notion-text">{col.label}</span>
            <Toggle checked={visibleColumnKeys.has(col.key)} onChange={() => toggle(col.key)} />
          </div>
        ))}
      </div>
    </Sheet>
  )
}
