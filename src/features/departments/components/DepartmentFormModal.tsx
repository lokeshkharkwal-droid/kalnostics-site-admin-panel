'use client'

import { useState } from 'react'
import { Button, Input, Label, Modal, ModuleMultiSelect, TextArea, Toggle } from '@/shared/ui'
import type { Department } from '../interfaces'
import { validateDepartment } from '../utils/mapping'

export type FormMode = 'create' | 'edit' | 'view'

/**
 * Compact add / edit / view modal for a department template. In `view` mode all
 * inputs are disabled and the save footer is hidden. No person-mapping field —
 * templates carry no staff.
 */
export function DepartmentFormModal({
  department, mode, saving, onSave, onClose,
}: {
  department: Department
  mode: FormMode
  saving: boolean
  onSave: (d: Department) => void
  onClose: () => void
}) {
  const [data, setData] = useState<Department>({ ...department })
  const [error, setError] = useState<string | null>(null)
  const readOnly = mode === 'view'

  const set = <K extends keyof Department>(field: K, val: Department[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  const submit = () => {
    const err = validateDepartment(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  const title = mode === 'create' ? 'Add Department' : mode === 'edit' ? 'Edit Department' : 'Department Details'

  return (
    <Modal
      title={title}
      size="lg"
      onClose={onClose}
      footer={readOnly ? (
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      ) : (
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={submit}>Save</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Name *" value={data.name} disabled={readOnly} onChange={(e) => set('name', e.target.value)} />
          </div>
          <Input
            label="Short Name *"
            value={data.shortName}
            disabled={readOnly}
            placeholder="2–6 chars (A–Z, 0–9)"
            onChange={(e) => set('shortName', e.target.value.toUpperCase())}
          />
          {mode !== 'create' && (
            <Input label="Code" value={data.code} disabled readOnly />
          )}
          <div className="col-span-2">
            <TextArea label="Description *" rows={3} value={data.description} disabled={readOnly} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Branch Modules *</Label>
          <ModuleMultiSelect value={data.moduleMapping} disabled={readOnly} onChange={(v) => set('moduleMapping', v)} />
        </div>

        <div className="flex items-center gap-2">
          <Label>Status</Label>
          <Toggle checked={data.isActive} disabled={readOnly} onChange={(v) => set('isActive', v)} />
          <span className="text-xs text-notion-sub">{data.isActive ? 'Active' : 'Inactive'}</span>
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-notion-red">{error}</p>
        )}
      </div>
    </Modal>
  )
}
