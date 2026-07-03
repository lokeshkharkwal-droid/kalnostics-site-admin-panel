'use client'

import { useState } from 'react'
import { Button, Input, Label, Modal, PaginatedSelect } from '@/shared/ui'
import type { TestGroup } from '../interfaces'
import { validateTestGroup } from '../utils/mapping'
import { fetchLabTestOptionsPage } from '../services/test-groups.api'

export type FormMode = 'create' | 'edit' | 'view'

/**
 * Add / edit / view modal for a test group. Fields: Group Name (required) and a
 * multi-select of SITE_ADMIN lab tests (required), backed by the paginated
 * lab-test options API. In `view` mode all inputs are disabled and the save
 * footer is hidden.
 */
export function TestGroupFormModal({
  testGroup, mode, saving, onSave, onClose,
}: {
  testGroup: TestGroup
  mode: FormMode
  saving: boolean
  onSave: (g: TestGroup) => void
  onClose: () => void
}) {
  const [data, setData] = useState<TestGroup>({ ...testGroup })
  const [error, setError] = useState<string | null>(null)
  const readOnly = mode === 'view'

  const set = <K extends keyof TestGroup>(field: K, val: TestGroup[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  const submit = () => {
    const err = validateTestGroup(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  const title = mode === 'create' ? 'Add Test Group' : mode === 'edit' ? 'Edit Test Group' : 'Test Group Details'

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
        <Input label="Group Name *" value={data.groupName} disabled={readOnly} onChange={(e) => set('groupName', e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <Label>Lab Tests *</Label>
          <PaginatedSelect
            multiple
            value={data.labTests}
            onChange={(opts) => set('labTests', opts)}
            queryKey={['siteadmin', 'lab-test-options']}
            fetchPage={fetchLabTestOptionsPage}
            placeholder="Select lab tests"
            emptyText="No lab tests"
            disabled={readOnly}
          />
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-notion-red">{error}</p>
        )}
      </div>
    </Modal>
  )
}
