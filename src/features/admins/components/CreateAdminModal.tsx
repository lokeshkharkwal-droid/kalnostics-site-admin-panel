'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, PasswordInput } from '@/shared/ui'
import { ROLE_LABEL, CREATABLE_ROLES, type SiteAdminRole } from '@/entities/siteadmin-user'
import { createAdmin } from '../services/admins.api'
import type { ICreateAdminModalProps, ICreateAdminForm } from '../interfaces'

const INITIAL_FORM: ICreateAdminForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'operations_admin',
}

export function CreateAdminModal({ onClose }: ICreateAdminModalProps) {
  const qc = useQueryClient()
  const [form, setForm] = useState<ICreateAdminForm>(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  const createMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'users'] })
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create admin account'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.firstName.trim()) { setFormError('First name is required'); return }
    if (!form.email.trim())     { setFormError('Email is required'); return }
    if (!form.password.trim())  { setFormError('Password is required'); return }
    createMutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4">
          <h2 className="text-sm font-semibold text-notion-text">Create Admin Account</h2>
          <button
            onClick={onClose}
            className="text-notion-faint hover:text-notion-sub transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              placeholder="Priya"
              disabled={createMutation.isPending}
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              placeholder="Kumar"
              disabled={createMutation.isPending}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="priya@kaltros.com"
            disabled={createMutation.isPending}
          />

          <PasswordInput
            label="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            disabled={createMutation.isPending}
          />

          <div>
            <label className="block text-xs font-medium text-notion-text mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as SiteAdminRole }))}
              disabled={createMutation.isPending}
              className="w-full rounded-md border border-notion-line2 bg-white px-3 py-2 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
            >
              {CREATABLE_ROLES.map(role => (
                <option key={role} value={role}>{ROLE_LABEL[role]}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-notion-faint">
              {form.role === 'content_admin' && 'Master data only: tests, templates, equipment'}
              {form.role === 'operations_admin' && 'Content + business management, audit logs'}
              {form.role === 'full_admin' && 'Operations + finance reports'}
            </p>
          </div>

          {formError && (
            <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
