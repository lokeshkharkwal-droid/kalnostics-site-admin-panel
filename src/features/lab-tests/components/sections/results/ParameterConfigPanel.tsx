'use client'

import { cn } from '@/shared/utils'
import { Input } from '@/shared/ui'
import type { ResultItem } from '../../../interfaces'
import { Label, TextArea } from '../../controls'
import { ChevronUpIcon, FlaskIcon, NotesIcon, RulerIcon, SigmaIcon } from '../../icons'
import { ReflexTestPicker } from '../ReflexTestPicker'

export type ConfigPanelKey =
  | 'reflexTest' | 'calculationFormula' | 'allowableUnits'
  | 'resultSuggestions' | 'defaultValue' | 'overallResult' | 'notes'
export type VisiblePanels = Record<ConfigPanelKey, boolean>

const PANELS: { key: ConfigPanelKey; label: string; icon: (p: { className?: string }) => React.ReactElement }[] = [
  { key: 'reflexTest', label: 'Reflex Test', icon: FlaskIcon },
  { key: 'calculationFormula', label: 'Calculation Formula', icon: SigmaIcon },
  { key: 'allowableUnits', label: 'Allowable Units', icon: RulerIcon },
  { key: 'resultSuggestions', label: 'Result Suggestions', icon: NotesIcon },
  { key: 'defaultValue', label: 'Default Value', icon: RulerIcon },
  { key: 'overallResult', label: 'Overall Result', icon: SigmaIcon },
  { key: 'notes', label: 'Notes', icon: NotesIcon },
]

/**
 * Per-row "expand" panel for the Add Result parameter table — a row of toggle
 * buttons, each independently revealing its own field below (not conditioned
 * on any other field's value; purely user-toggled, mirroring the reference).
 */
export function ParameterConfigPanel({
  row, onChange, visiblePanels, onTogglePanel, onCollapseRow,
}: {
  row: ResultItem
  onChange: (patch: Partial<ResultItem>) => void
  visiblePanels: VisiblePanels
  onTogglePanel: (key: ConfigPanelKey) => void
  onCollapseRow: () => void
}) {
  return (
    <div className="rounded-lg border border-notion-line bg-notion-panel/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-notion-text">
          Configure: {row.parameterName || 'New Parameter'}
        </h4>
        <button
          type="button"
          onClick={onCollapseRow}
          className="flex items-center gap-1 rounded p-1 text-xs text-notion-sub hover:bg-notion-hover"
        >
          <ChevronUpIcon className="h-3.5 w-3.5" /> Collapse
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PANELS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onTogglePanel(key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              visiblePanels[key]
                ? 'border-notion-blue bg-notion-blue text-white'
                : 'border-notion-line2 bg-white text-notion-sub hover:bg-notion-hover',
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {visiblePanels.reflexTest && (
          <ReflexTestPicker
            selected={row.reflexTests}
            onAdd={o => onChange({ reflexTests: row.reflexTests.some(rt => rt.id === o.id) ? row.reflexTests : [...row.reflexTests, o] })}
            onRemove={id => onChange({ reflexTests: row.reflexTests.filter(x => x.id !== id) })}
          />
        )}
        {visiblePanels.calculationFormula && (
          <div>
            <Label>Formula {row.parameterType === 'Calculated' && <span className="text-notion-red">*</span>}</Label>
            <Input
              className="mt-1"
              placeholder="e.g. (A + B) / 2"
              value={row.calculationFormula}
              onChange={e => onChange({ calculationFormula: e.target.value })}
            />
          </div>
        )}
        {visiblePanels.allowableUnits && (
          <Input
            label="Allowable Units"
            placeholder="e.g. mg/dL, g/L"
            value={row.allowableUnits ?? ''}
            onChange={e => onChange({ allowableUnits: e.target.value })}
          />
        )}
        {visiblePanels.resultSuggestions && (
          <TextArea
            label="Result Suggestions"
            rows={3}
            placeholder="One suggestion per line"
            value={(row.resultSuggestions ?? []).join('\n')}
            onChange={e => onChange({ resultSuggestions: e.target.value.split('\n') })}
            onBlur={e => onChange({ resultSuggestions: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
          />
        )}
        {visiblePanels.defaultValue && (
          <Input
            label="Default Value"
            placeholder="A suggested value or any custom text"
            value={row.defaultValue ?? ''}
            onChange={e => onChange({ defaultValue: e.target.value })}
          />
        )}
        {visiblePanels.overallResult && (
          <Input
            label="Overall Result Groups"
            placeholder="Comma-separated group names"
            value={row.overallResultGroups.join(', ')}
            onChange={e => onChange({ overallResultGroups: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          />
        )}
        {visiblePanels.notes && (
          <TextArea label="Notes" rows={2} value={row.notes} onChange={e => onChange({ notes: e.target.value })} />
        )}
      </div>
    </div>
  )
}
