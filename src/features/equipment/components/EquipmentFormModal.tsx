'use client'

import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button, Input, Label, Modal, PaginatedSelect, TextArea } from '@/shared/ui'
import type { Equipment } from '../interfaces'
import { slugifyCode, validateEquipment } from '../utils/mapping'
import { fetchLabTestOptionsPage } from '../services/equipment.api'

// RichEditor pulls in the large tiptap/ProseMirror graph — load it lazily,
// client-only (it is intentionally not re-exported from `@/shared/ui`).
const RichEditor = dynamic(() => import('@/shared/ui/rich-editor').then((m) => m.RichEditor), { ssr: false })

export type FormMode = 'create' | 'edit' | 'view'

/**
 * Add / edit / view modal for a lab equipment. Fields: Name (required, auto-slugs
 * into Code on create), Code, Description, a multi-select of SITE_ADMIN lab tests
 * (required, backed by the paginated lab-test options API), and three rich-text
 * HTML documents (Setup / Lab Config / Adopter). In `view` mode all inputs are
 * disabled, the documents render as read-only HTML, and the save footer is hidden.
 */
export function EquipmentFormModal({
  equipment, mode, saving, onSave, onClose,
}: {
  equipment: Equipment
  mode: FormMode
  saving: boolean
  onSave: (e: Equipment) => void
  onClose: () => void
}) {
  const [data, setData] = useState<Equipment>({ ...equipment })
  const [error, setError] = useState<string | null>(null)
  const readOnly = mode === 'view'
  // On create, keep Code in sync with a slug of Name until the user edits Code.
  const codeTouched = useRef(mode !== 'create' && equipment.code.trim().length > 0)

  const set = <K extends keyof Equipment>(field: K, val: Equipment[K]) =>
    setData((prev) => ({ ...prev, [field]: val }))

  const onNameChange = (name: string) =>
    setData((prev) => ({
      ...prev,
      name,
      code: mode === 'create' && !codeTouched.current ? slugifyCode(name) : prev.code,
    }))

  const onCodeChange = (code: string) => {
    codeTouched.current = true
    set('code', code)
  }

  const submit = () => {
    const err = validateEquipment(data)
    if (err) { setError(err); return }
    setError(null)
    onSave(data)
  }

  const title = mode === 'create' ? 'Add Equipment' : mode === 'edit' ? 'Edit Equipment' : 'Equipment Details'

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
          <Input label="Name *" value={data.name} disabled={readOnly} onChange={(e) => onNameChange(e.target.value)} />
          <Input label="Code" value={data.code} disabled={readOnly} placeholder="auto-generated from name" onChange={(e) => onCodeChange(e.target.value)} />
        </div>

        <TextArea label="Description" rows={2} value={data.description} disabled={readOnly} onChange={(e) => set('description', e.target.value)} />

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

        <DocumentField label="Setup Document" value={data.setupDocument} readOnly={readOnly} onChange={(html) => set('setupDocument', html)} />
        <DocumentField label="Lab Config Document" value={data.labConfigDocument} readOnly={readOnly} onChange={(html) => set('labConfigDocument', html)} />
        <DocumentField label="Adopter Document" value={data.adopterDocument} readOnly={readOnly} onChange={(html) => set('adopterDocument', html)} />

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-notion-red">{error}</p>
        )}
      </div>
    </Modal>
  )
}

/** A labelled rich-text document field — editor when editable, HTML preview in view mode. */
function DocumentField({
  label, value, readOnly, onChange,
}: {
  label: string
  value: string
  readOnly: boolean
  onChange: (html: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {readOnly ? (
        value.trim() ? (
          <div
            className="prose prose-sm max-w-none rounded-md border border-notion-border bg-notion-bg px-3 py-2 text-sm text-notion-text"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <p className="text-sm text-notion-faint">—</p>
        )
      ) : (
        <RichEditor value={value} onChange={onChange} minHeight={100} />
      )}
    </div>
  )
}
