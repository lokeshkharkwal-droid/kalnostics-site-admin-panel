'use client'

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button, PaginatedSelect, type SelectOption } from '@/shared/ui'
import { cn } from '@/shared/utils'
import type { LabTest } from '../../../interfaces'
import { getLabTest, searchLabTestOptions } from '../../../services/lab-tests.api'
import { fromEntity } from '../../../utils/mapping'
import { copyResultGroups, existingGroupKeys, groupResults } from '../../../utils/copyResultGroups'
import { Label } from '../../controls'
import { Modal } from '../../Modal'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

interface Props {
  open: boolean
  onClose: () => void
  /** The form's test (the copy target). */
  data: LabTest
  setData: Dispatch<SetStateAction<LabTest>>
}

/**
 * "Copy Result" (Add New Test form → Results): pick another lab test template, choose some or all of its result
 * groups, and copy them into the form, with their parameters' reference ranges and reference values. The copy lands
 * in the form's draft only (editable, saved with the test); the source test is only read.
 */
export function CopyResultsDialog({ open, ...rest }: Props) {
  // The body mounts with the open dialog, so every opening starts clean (no previous pick shown).
  if (!open) return null
  return <CopyResultsBody {...rest} />
}

function CopyResultsBody({ data, setData, onClose }: Omit<Props, 'open'>) {
  const [test, setTest] = useState<SelectOption | null>(null)
  /** Groups the user un-ticked. Every other copyable group is selected, so a freshly picked test starts on All Groups. */
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const { data: source, isLoading, isError } = useQuery({
    queryKey: ['siteadmin', 'lab-tests', 'copy-source', test?.id],
    queryFn: async () => fromEntity(await getLabTest(test!.id)),
    enabled: !!test,
  })

  const groups = useMemo(() => {
    if (!source) return []
    const inForm = existingGroupKeys(data.results)
    return groupResults(source.results).map(g => ({ key: g.key, count: g.items.length, exists: inForm.has(g.key) }))
  }, [source, data.results])
  const selectable = groups.filter(g => !g.exists).map(g => g.key)
  const selected = selectable.filter(k => !excluded.has(k))
  const allSelected = selectable.length > 0 && selected.length === selectable.length

  const toggleAll = () => setExcluded(allSelected ? new Set(selectable) : new Set())
  const toggle = (key: string) =>
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const note =
    !test || isLoading || !source ? null
      : groups.length === 0 ? 'This test has no result groups.'
        : selectable.length === 0 ? 'Every result group of this test is already in this test.'
          : null

  const submit = () => {
    if (!source || selected.length === 0) return
    const outcome = copyResultGroups(source, selected, data)
    if (outcome.counts.parameters === 0) {
      toast.info('Nothing copied: the selected parameters are already in this test.')
      return
    }
    setData(prev => ({ ...prev, ...copyResultGroups(source, selected, prev).next }))
    const { counts } = outcome
    toast.success(
      `Copied ${plural(outcome.copiedGroups.length, 'result group')} from "${source.testName}": ` +
      `${plural(counts.parameters, 'parameter')}, ${plural(counts.ranges, 'reference range')}, ${plural(counts.values, 'reference value')}`,
    )
    const skipped = [...outcome.skippedGroups.map(g => `group "${g}"`), ...outcome.skippedParameters.map(p => `parameter ${p}`)]
    if (skipped.length) toast.warning(`Skipped (already in this test): ${skipped.join(', ')}`, { duration: 10000 })
    for (const f of outcome.unresolvedFormulaRefs) {
      toast.warning(
        `Check formulas before saving: "${f.parameter}" uses ${f.refs.join(', ')}, which ${f.refs.length === 1 ? 'is' : 'are'} not in this test.`,
        { duration: 12000 },
      )
    }
    onClose()
  }

  return (
    <Modal
      title="Copy Result"
      onClose={onClose}
      footer={(
        <>
          <Button size="sm" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!source || selected.length === 0}>Submit</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <p className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-xs text-notion-sub">
          Copy result groups (with their layout, settings, reference ranges and reference values) from another test.
        </p>

        <div className="flex flex-col gap-1">
          <Label>Test Name <span className="text-notion-red">*</span></Label>
          <PaginatedSelect
            value={test}
            onChange={opt => { setTest(opt); setExcluded(new Set()) }}
            queryKey={['siteadmin', 'lab-tests', 'copy-result-options']}
            fetchPage={({ page, search, pageSize }) => searchLabTestOptions({ page, search, limit: pageSize })}
            placeholder="Search and select test…"
            emptyText="No lab tests"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Group Name <span className="text-notion-red">*</span></Label>
          {!test ? (
            <p className="text-xs text-notion-faint">Select a test first.</p>
          ) : isLoading ? (
            <p className="text-xs text-notion-faint">Loading groups…</p>
          ) : isError ? (
            <p className="text-xs text-notion-red">Unable to load this test&apos;s result groups.</p>
          ) : (
            <div role="listbox" aria-label="Groups" aria-multiselectable="true" className="max-h-64 overflow-y-auto rounded-md border border-notion-line2 p-1">
              <GroupOption label="All Groups" selected={allSelected} disabled={selectable.length === 0} onToggle={toggleAll} />
              {groups.map(g => (
                <GroupOption
                  key={g.key}
                  label={g.key}
                  hint={g.exists ? 'Already in this test' : plural(g.count, 'parameter')}
                  selected={!g.exists && !excluded.has(g.key)}
                  disabled={g.exists}
                  onToggle={() => toggle(g.key)}
                />
              ))}
            </div>
          )}
          {note && <p className="text-xs text-notion-faint">{note}</p>}
        </div>
      </div>
    </Modal>
  )
}

function GroupOption({ label, selected, disabled, hint, onToggle }: {
  label: string
  selected: boolean
  disabled?: boolean
  hint?: string
  onToggle: () => void
}) {
  return (
    <label
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      className={cn(
        'flex items-center gap-2 rounded px-2 py-1.5 text-xs',
        disabled ? 'cursor-not-allowed text-notion-faint' : 'cursor-pointer text-notion-text hover:bg-notion-hover',
      )}
    >
      <input type="checkbox" className="h-3.5 w-3.5" checked={selected} disabled={disabled} onChange={onToggle} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && <span className="shrink-0 text-[11px] text-notion-faint">{hint}</span>}
    </label>
  )
}
