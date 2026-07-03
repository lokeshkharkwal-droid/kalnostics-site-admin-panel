'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Input,
  Modal,
  SelectField,
  TextArea,
  Label,
  ModuleMultiSelect,
} from '@/shared/ui'
import type { BranchType } from '@/shared/constants/branch-modules'
import { createRole, updateRole } from '../services/auth-roles.api'
import type { IRoleForm, IRoleFormModalProps } from '../interfaces'

const TITLES = {
  create: 'Add Role',
  edit: 'Edit Role',
  view: 'Role Details',
} as const

export function RoleFormModal({ mode, role, onClose }: IRoleFormModalProps) {
  const qc = useQueryClient()
  const readOnly = mode === 'view'
  // Built-in roles have an immutable name/key + branch matrix (server-enforced);
  // only description/status are editable.
  const lockCore = mode === 'edit' && !!role?.isSystem

  const [form, setForm] = useState<IRoleForm>({
    name: role?.name ?? '',
    description: role?.description ?? '',
    isActive: role?.isActive ?? true,
    allowedBranchTypes: role?.allowedBranchTypes ?? [],
  })
  const [formError, setFormError] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      if (mode === 'create') return createRole(form)
      // Edit: send only the fields the server accepts for this role kind.
      return updateRole(role!.id, {
        description: form.description,
        isActive: form.isActive,
        ...(lockCore
          ? {}
          : { name: form.name, allowedBranchTypes: form.allowedBranchTypes }),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'roles'] })
      onClose()
    },
    onError: (err: unknown) => {
      const data = (
        err as {
          response?: {
            data?: { error?: { message?: string }; message?: string | string[] }
          }
        }
      )?.response?.data
      const raw = data?.error?.message ?? data?.message ?? 'Failed to save role'
      setFormError(Array.isArray(raw) ? raw[0] : raw)
    },
  })

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Role name is required')
      return
    }
    mutation.mutate()
  }

  const footer = readOnly ? (
    <Button variant="secondary" onClick={onClose}>
      Close
    </Button>
  ) : (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={mutation.isPending}
      >
        Cancel
      </Button>
      <Button type="button" loading={mutation.isPending} onClick={() => handleSubmit()}>
        {mode === 'create' ? 'Create Role' : 'Save Changes'}
      </Button>
    </>
  )

  return (
    <Modal title={TITLES[mode]} onClose={onClose} footer={footer}>
      <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Role Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Regional Coordinator"
          disabled={readOnly || lockCore || mutation.isPending}
        />
        {lockCore && (
          <p className="-mt-2 text-xs text-notion-faint">
            Built-in role — name and branch types can’t be changed.
          </p>
        )}

        <TextArea
          label="Description"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="What is this role for?"
          rows={3}
          disabled={readOnly || mutation.isPending}
        />

        <SelectField
          label="Status"
          value={form.isActive ? 'active' : 'inactive'}
          onChange={v => setForm(f => ({ ...f, isActive: v === 'active' }))}
          disabled={readOnly || mutation.isPending}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />

        <div className="flex flex-col gap-1.5">
          <Label>Allowed Branch Types</Label>
          <p className="text-xs text-notion-faint">
            Branch types this role can be assigned at. Leave empty for a
            tenant-level role (no branch).
          </p>
          <ModuleMultiSelect
            value={form.allowedBranchTypes}
            onChange={(next: BranchType[]) =>
              setForm(f => ({ ...f, allowedBranchTypes: next }))
            }
            disabled={readOnly || lockCore || mutation.isPending}
          />
        </div>

        {formError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
