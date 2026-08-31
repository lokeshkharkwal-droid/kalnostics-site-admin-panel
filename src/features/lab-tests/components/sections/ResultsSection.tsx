'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/shared/ui'
import type { LabTest } from '../../interfaces'
import { PencilIcon, PlusIcon, TrashIcon } from '../icons'
import { AddResultDialog } from './results/AddResultDialog'

interface ResultGroup {
  groupName: string
  groupLayout: string
  count: number
  parameterNames: string[]
}

function buildGroups(results: LabTest['results']): ResultGroup[] {
  const map = new Map<string, ResultGroup>()
  for (const r of results) {
    const existing = map.get(r.groupName)
    if (existing) {
      existing.count += 1
      if (r.parameterName.trim()) existing.parameterNames.push(r.parameterName)
    } else {
      map.set(r.groupName, {
        groupName: r.groupName,
        groupLayout: r.groupLayout,
        count: 1,
        parameterNames: r.parameterName.trim() ? [r.parameterName] : [],
      })
    }
  }
  return Array.from(map.values())
}

/* ─── Results Section ───
   "Add Result" edits a whole group of parameters at once (see
   sections/results/AddResultDialog.tsx). Group Settings / Icon Settings /
   Image Settings are intentionally omitted (tenant settings refs, not
   applicable to templates). */
export function ResultsSection({ data, setData }: { data: LabTest; setData: Dispatch<SetStateAction<LabTest>> }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null)

  const groups = buildGroups(data.results)

  const openAdd = () => { setEditingGroupName(null); setDialogOpen(true) }
  const openEdit = (groupName: string) => { setEditingGroupName(groupName); setDialogOpen(true) }
  const deleteGroup = (groupName: string) =>
    setData(prev => ({ ...prev, results: prev.results.filter(r => r.groupName !== groupName) }))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-notion-sub">{data.results.length} result parameter(s)</span>
        <Button size="sm" onClick={openAdd}><PlusIcon className="h-3.5 w-3.5" />Add Result</Button>
      </div>

      {groups.map(g => (
        <div key={g.groupName} className="flex items-start justify-between gap-3 rounded-lg border border-notion-line bg-notion-panel p-3">
          <div className="grid flex-1 grid-cols-4 gap-2 text-xs text-notion-sub">
            <span><strong>Group:</strong> {g.groupName || '—'}</span>
            <span><strong>Layout:</strong> {g.groupLayout}</span>
            <span><strong>Parameters:</strong> {g.count}</span>
            <span className="truncate"><strong>Names:</strong> {g.parameterNames.join(', ') || '—'}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" title="Edit result group" onClick={() => openEdit(g.groupName)} className="rounded p-1.5 text-notion-sub hover:bg-notion-hover"><PencilIcon className="h-3.5 w-3.5" /></button>
            <button type="button" title="Delete result group" onClick={() => deleteGroup(g.groupName)} className="rounded p-1.5 text-notion-red hover:bg-notion-hover"><TrashIcon className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      {groups.length === 0 && (
        <div className="rounded-lg border border-dashed border-notion-line2 py-8 text-center text-sm text-notion-faint">No results added yet</div>
      )}

      <AddResultDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        data={data}
        setData={setData}
        editingGroupName={editingGroupName}
      />
    </div>
  )
}
