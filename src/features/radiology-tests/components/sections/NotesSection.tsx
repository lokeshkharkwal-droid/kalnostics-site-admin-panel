'use client'

import dynamic from 'next/dynamic'
import type { RadiologyTest } from '../../interfaces'
import { Label } from '../controls'

// RichEditor pulls in the large tiptap/ProseMirror graph — load it lazily,
// client-only (matches the lab-tests Notes section).
const RichEditor = dynamic(() => import('@/shared/ui/rich-editor').then(m => m.RichEditor), { ssr: false })

/* ─── Notes Section (radiology) ─── */
export function NotesSection({ data, set }: { data: RadiologyTest; set: (f: keyof RadiologyTest, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label>Preparation Instructions</Label>
        <RichEditor value={data.preparationInstructions} onChange={v => set('preparationInstructions', v)} placeholder="Patient preparation (fasting, hydration, contrast prep)…" minHeight={90} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Useful For</Label>
        <RichEditor value={data.usefulFor} onChange={v => set('usefulFor', v)} placeholder="Enter useful for information…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Interpretation of Results</Label>
        <RichEditor value={data.interpretation} onChange={v => set('interpretation', v)} placeholder="Enter interpretation…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Limitations</Label>
        <RichEditor value={data.limitations} onChange={v => set('limitations', v)} placeholder="Enter limitations…" minHeight={90} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Remarks</Label>
        <RichEditor value={data.remarks} onChange={v => set('remarks', v)} placeholder="Enter remarks…" minHeight={90} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>References</Label>
        <RichEditor value={data.references} onChange={v => set('references', v)} placeholder="Enter references…" minHeight={90} />
      </div>
    </div>
  )
}
