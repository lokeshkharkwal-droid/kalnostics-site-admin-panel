'use client'

import type { LabTest } from '../../interfaces'
import { TextArea } from '../controls'

/* ─── Notes Section ─── */
export function NotesSection({ data, set }: { data: LabTest; set: (f: keyof LabTest, v: unknown) => void }) {
  return (
    <div className="space-y-4">
      <TextArea label="Useful For" rows={3} value={data.usefulFor} onChange={e => set('usefulFor', e.target.value)} />
      <TextArea label="Interpretation of Results" rows={3} value={data.interpretation} onChange={e => set('interpretation', e.target.value)} />
      <TextArea label="Limitations" rows={2} value={data.limitations} onChange={e => set('limitations', e.target.value)} />
      <TextArea label="Remarks" rows={2} value={data.remarks} onChange={e => set('remarks', e.target.value)} />
      <TextArea label="References" rows={2} value={data.references} onChange={e => set('references', e.target.value)} />
    </div>
  )
}
