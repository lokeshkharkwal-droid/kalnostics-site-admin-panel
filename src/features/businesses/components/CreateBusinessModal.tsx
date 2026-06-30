'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Input, PhoneInput } from '@/shared/ui'
import { createTenant } from '../services/businesses.api'
import { slugify } from '../utils'
import type { ICreateBusinessModalProps, ICreateTenantForm } from '../interfaces'

const EMPTY_FORM: ICreateTenantForm = {
  name: '', slug: '', email: '', phoneCountryCode: '+91', phone: '',
  adminFirstName: '', adminLastName: '', adminPhoneCountryCode: '+91', adminPhone: '', adminEmail: '',
}

export function CreateBusinessModal({ onClose, onCreated }: ICreateBusinessModalProps) {
  const qc = useQueryClient()
  const [form, setForm] = useState<ICreateTenantForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
      onCreated({ adminPhone: data.adminPhone, tempPassword: data.tempPassword, businessName: data.tenant.name })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create business'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.name.trim()) { setFormError('Business name is required'); return }
    if (!form.slug.trim()) { setFormError('Slug is required'); return }
    if (!form.email.trim()) { setFormError('Business email is required'); return }
    if (!emailPattern.test(form.email.trim())) { setFormError('Enter a valid business email'); return }
    if (!form.phone.trim()) { setFormError('Business phone is required'); return }
    if (!form.adminFirstName.trim()) { setFormError('First name is required'); return }
    if (!form.adminLastName.trim()) { setFormError('Last name is required'); return }
    if (!form.adminPhone.trim()) { setFormError('Phone is required'); return }
    if (!form.adminEmail.trim()) { setFormError('Email is required'); return }
    if (!emailPattern.test(form.adminEmail.trim())) { setFormError('Enter a valid email'); return }
    createMutation.mutate(form)
  }

  // Auto-generate slug from name (only if slug hasn't been manually edited)
  function handleNameChange(name: string) {
    setForm(f => ({ ...f, name, slug: f.slug || slugify(name) }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-notion-line bg-white shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-notion-line px-5 py-4 shrink-0">
          <h2 className="text-sm font-semibold text-notion-text">Create New Business</h2>
          <button
            onClick={onClose}
            className="text-notion-faint hover:text-notion-sub transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 px-5 py-4 overflow-y-auto">
          {/* Business details */}
          <p className="text-xs font-semibold text-notion-sub uppercase tracking-wide">Business Details</p>
          <Input
            label="Business name *"
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="City Diagnostics"
            disabled={createMutation.isPending}
          />
          <Input
            label="Slug *"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
            placeholder="city-diagnostics"
            hint="Subdomain: city-diagnostics.kaltros.com"
            disabled={createMutation.isPending}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Business email *"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="info@clinic.com"
              disabled={createMutation.isPending}
            />
            <PhoneInput
              label="Business phone *"
              required
              countryCode={form.phoneCountryCode}
              onCountryCodeChange={v => setForm(f => ({ ...f, phoneCountryCode: v }))}
              phone={form.phone}
              onPhoneChange={v => setForm(f => ({ ...f, phone: v }))}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Business admin account */}
          <div className="border-t border-notion-line pt-3">
            <p className="text-xs font-semibold text-notion-sub uppercase tracking-wide mb-3">
              Business Admin Account
              <span className="ml-2 font-normal normal-case text-notion-faint">Login credentials will be generated</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name *"
                value={form.adminFirstName}
                onChange={e => setForm(f => ({ ...f, adminFirstName: e.target.value }))}
                placeholder="Dilip"
                disabled={createMutation.isPending}
              />
              <Input
                label="Last name *"
                value={form.adminLastName}
                onChange={e => setForm(f => ({ ...f, adminLastName: e.target.value }))}
                placeholder="Kumar"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <PhoneInput
                label="Phone (login ID) *"
                required
                countryCode={form.adminPhoneCountryCode}
                onCountryCodeChange={v => setForm(f => ({ ...f, adminPhoneCountryCode: v }))}
                phone={form.adminPhone}
                onPhoneChange={v => setForm(f => ({ ...f, adminPhone: v }))}
                disabled={createMutation.isPending}
              />
              <Input
                label="Email *"
                type="email"
                value={form.adminEmail}
                onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                placeholder="dilip@clinic.com"
                disabled={createMutation.isPending}
              />
            </div>
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
              Create Business
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
