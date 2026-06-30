'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui'
import type { LabTest } from '../interfaces'
import { TEST_SECTIONS } from '../utils/constants'
import { validateLabTest } from '../utils/validate'
import { FormBlock } from './controls'
import { CloseIcon } from './icons'
import { BasicDetailsSection } from './sections/BasicDetailsSection'
import { PricingSection } from './sections/PricingSection'
import { TATSection } from './sections/TATSection'
import { FlagsSection } from './sections/FlagsSection'
import { SampleSection } from './sections/SampleSection'
import { ResultsSection } from './sections/ResultsSection'
import { ReferenceRangeSection } from './sections/ReferenceRangeSection'
import { ReferenceValuesSection } from './sections/ReferenceValuesSection'
import { NotesSection } from './sections/NotesSection'

const sectionId = (s: string) => `tsec-${s.replace(/\s+/g, '-').toLowerCase()}`

/**
 * Full-screen Add/Edit Lab Test form. Mirrors the Business Admin form (minus the
 * template-irrelevant sections/fields), rebuilt in the Site Admin design system.
 */
export function LabTestFormModal({
  test, isCreate, saving, onSave, onClose,
}: {
  test: LabTest
  isCreate: boolean
  saving: boolean
  onSave: (t: LabTest) => void
  onClose: () => void
}) {
  const [data, setData] = useState<LabTest>({ ...test })
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof LabTest, val: unknown) => setData(prev => ({ ...prev, [field]: val }))
  const scrollTo = (s: string) => document.getElementById(sectionId(s))?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const submit = () => {
    const err = validateLabTest(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-notion-line bg-white shadow-xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-notion-line px-6 py-3.5">
          <h2 className="text-sm font-semibold text-notion-text">{isCreate ? 'Add New Test' : 'Edit Test'}</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-notion-faint transition-colors hover:text-notion-sub" aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Jump nav */}
          <aside className="w-44 shrink-0 overflow-y-auto border-r border-notion-line bg-notion-sidebar px-2 py-3">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase text-notion-faint">Jump to</p>
            <nav className="space-y-0.5">
              {TEST_SECTIONS.map(s => (
                <button key={s} onClick={() => scrollTo(s)} className="block w-full rounded px-2 py-1.5 text-left text-xs text-notion-sub hover:bg-notion-hover hover:text-notion-text">
                  {s}
                </button>
              ))}
            </nav>
          </aside>

          {/* Sections */}
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
            <FormBlock id={sectionId('Basic Details')} title="Basic Details"><BasicDetailsSection data={data} set={set} /></FormBlock>
            <FormBlock id={sectionId('Pricing')} title="Pricing"><PricingSection data={data} set={set} /></FormBlock>
            <FormBlock id={sectionId('TAT')} title="TAT"><TATSection data={data} set={set} /></FormBlock>
            <FormBlock id={sectionId('Flags')} title="Flags"><FlagsSection data={data} set={set} /></FormBlock>
            <FormBlock id={sectionId('Sample')} title="Sample"><SampleSection data={data} setData={setData} /></FormBlock>
            <FormBlock id={sectionId('Results')} title="Results"><ResultsSection data={data} setData={setData} /></FormBlock>
            <FormBlock id={sectionId('Reference Range')} title="Reference Range"><ReferenceRangeSection data={data} setData={setData} /></FormBlock>
            <FormBlock id={sectionId('Reference Values')} title="Reference Values"><ReferenceValuesSection data={data} setData={setData} /></FormBlock>
            <FormBlock id={sectionId('Notes')} title="Notes"><NotesSection data={data} set={set} /></FormBlock>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-notion-red">{error}</p>
            )}

            <div className="flex justify-end gap-2 border-t border-notion-line pt-3 pb-2">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={submit} loading={saving}>Save & Close</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
