'use client'

import { useState } from 'react'
import {
  Button, Input, Label, Modal, ModuleMultiSelect, PaginatedSelect, SelectField, TextArea, Toggle,
} from '@/shared/ui'
import { fetchDepartmentOptionsPage } from '@/features/departments/services/departments.api'
import type { CategoryType } from '@/entities/category'
import { CATEGORY_TYPE_LABELS, type Category } from '../interfaces'
import { validateCategory } from '../utils/mapping'

export type FormMode = 'create' | 'edit' | 'view'

const TYPE_OPTIONS = (Object.keys(CATEGORY_TYPE_LABELS) as CategoryType[]).map((value) => ({
  value,
  label: CATEGORY_TYPE_LABELS[value],
}))

/**
 * Compact add / edit / view modal for a category template. Adds a Type select
 * (Independent / Under Department); when Under Department, a searchable parent
 * Department dropdown (shared PaginatedSelect) is required. No person-mapping.
 */
export function CategoryFormModal({
  category, mode, saving, onSave, onClose,
}: {
  category: Category
  mode: FormMode
  saving: boolean
  onSave: (c: Category) => void
  onClose: () => void
}) {
  const [data, setData] = useState<Category>({ ...category })
  const [error, setError] = useState<string | null>(null)
  const readOnly = mode === 'view'

  const set = <K extends keyof Category>(field: K, val: Category[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  const changeType = (value: string) => {
    const next = value as CategoryType
    // Drop the parent when leaving UNDER_DEPARTMENT.
    setData((prev) => ({ ...prev, categoryType: next, department: next === 'UNDER_DEPARTMENT' ? prev.department : null }))
  }

  const submit = () => {
    const err = validateCategory(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  const title = mode === 'create' ? 'Add Category' : mode === 'edit' ? 'Edit Category' : 'Category Details'

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
          {mode !== 'create' && <Input label="Code" value={data.code} disabled readOnly />}

          <SelectField label="Type *" value={data.categoryType} disabled={readOnly} onChange={changeType} options={TYPE_OPTIONS} />
          {data.categoryType === 'UNDER_DEPARTMENT' && (
            <div className="flex flex-col gap-1">
              <Label>Department *</Label>
              <PaginatedSelect
                value={data.department}
                onChange={(opt) => set('department', opt)}
                queryKey={['siteadmin', 'department-options']}
                fetchPage={fetchDepartmentOptionsPage}
                placeholder="Select department"
                emptyText="No departments"
                disabled={readOnly}
              />
            </div>
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
