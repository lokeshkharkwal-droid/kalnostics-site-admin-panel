'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import { PhoneInput } from '@/components/ui/phone-input'

interface Tenant {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  subscriptionStatus: string
  subscriptionPlanId: string | null
  isActive: boolean
  createdAt: string
}

interface CreateTenantForm {
  name: string
  slug: string
  email: string
  phoneCountryCode: string
  phone: string
  adminFirstName: string
  adminLastName: string
  adminPhoneCountryCode: string
  adminPhone: string
  adminEmail: string
}

interface CreatedCredentials {
  adminPhone: string
  tempPassword: string
  businessName: string
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active:       'success',
  trialing:     'info',
  grace_period: 'warning',
  suspended:    'danger',
  cancelled:    'default',
}

const STATUS_LABEL: Record<string, string> = {
  active:       'Active',
  trialing:     'Trialing',
  grace_period: 'Grace Period',
  suspended:    'Suspended',
  cancelled:    'Cancelled',
}

const LIMIT = 20

const STATUS_OPTIONS = [
  { value: '',             label: 'All Statuses' },
  { value: 'active',       label: 'Active' },
  { value: 'trialing',     label: 'Trialing' },
  { value: 'grace_period', label: 'Grace Period' },
  { value: 'suspended',    label: 'Suspended' },
  { value: 'cancelled',    label: 'Cancelled' },
]

export default function BusinessesPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<CreatedCredentials | null>(null)
  const [copied, setCopied] = useState<'phone' | 'password' | null>(null)

  const [form, setForm] = useState<CreateTenantForm>({
    name: '', slug: '', email: '', phoneCountryCode: '+91', phone: '',
    adminFirstName: '', adminLastName: '', adminPhoneCountryCode: '+91', adminPhone: '', adminEmail: '',
  })
  const [formError, setFormError] = useState('')

  // Fetch all tenants — API returns Tenant[] (non-paginated)
  // Client-side search + pagination is acceptable for SiteAdmin (few hundred tenants max)
  const { data: allTenants = [], isLoading } = useQuery({
    queryKey: ['siteadmin', 'tenants'],
    queryFn: async () => {
      const res = await api.get<Tenant[]>('/api/v1/siteadmin/tenants')
      const list = res.data as Tenant[]
      // Backend returns subscriptionStatus as an UPPERCASE Prisma enum; this UI
      // keys its status maps/filters in lowercase. Normalise on the way in.
      return list.map(t => ({ ...t, subscriptionStatus: t.subscriptionStatus.toLowerCase() }))
    },
  })

  // Client-side search + status filter
  const filtered = useMemo(() => {
    let result = allTenants
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) || t.slug.includes(q),
      )
    }
    if (statusFilter) {
      result = result.filter(t => t.subscriptionStatus === statusFilter)
    }
    return result
  }, [allTenants, search, statusFilter])

  const total = filtered.length
  const totalPages = Math.ceil(total / LIMIT)
  const tenants = filtered.slice((page - 1) * LIMIT, page * LIMIT)

  const createMutation = useMutation({
    mutationFn: (body: CreateTenantForm) => {
      const payload = {
        ...body,
        phone:      body.phone.trim() ? body.phoneCountryCode + body.phone.trim() : undefined,
        adminPhone: body.adminPhone.trim() ? body.adminPhoneCountryCode + body.adminPhone.trim() : body.adminPhone,
        phoneCountryCode: undefined,
        adminPhoneCountryCode: undefined,
      }
      return api.post('/api/v1/siteadmin/tenants', payload, { successMessage: 'Business created' }).then(r => r.data as { tenant: Tenant; adminPhone: string; tempPassword: string })
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
      setShowCreate(false)
      setForm({ name: '', slug: '', email: '', phoneCountryCode: '+91', phone: '', adminFirstName: '', adminLastName: '', adminPhoneCountryCode: '+91', adminPhone: '', adminEmail: '' })
      setFormError('')
      // Show credentials card — SiteAdmin must copy and share with client
      setCreatedCreds({ adminPhone: data.adminPhone, tempPassword: data.tempPassword, businessName: data.tenant.name })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create business'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) { setFormError('Business name is required'); return }
    if (!form.slug.trim()) { setFormError('Slug is required'); return }
    if (!form.adminFirstName.trim()) { setFormError('Admin first name is required'); return }
    if (!form.adminPhone.trim()) { setFormError('Admin phone is required'); return }
    createMutation.mutate(form)
  }

  function copyToClipboard(text: string, field: 'phone' | 'password') {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  // Auto-generate slug from name (only if slug hasn't been manually edited)
  function handleNameChange(name: string) {
    setForm(f => ({
      ...f,
      name,
      slug: f.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }))
  }

  function handleSearchChange(val: string) {
    setSearch(val)
    setPage(1)
  }

  function handleStatusChange(val: string) {
    setStatusFilter(val)
    setPage(1)
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Businesses"
        subtitle={`${total} total businesses on the platform`}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            + New Business
          </Button>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="w-72">
            <Input
              placeholder="Search by name or slug…"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => handleStatusChange(e.target.value)}
            className="h-9 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}
              className="text-xs text-notion-faint hover:text-notion-sub"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <PageLoader />
            ) : tenants.length === 0 ? (
              <div className="py-16 text-center text-sm text-notion-faint">
                {(search || statusFilter) ? 'No businesses match the selected filters' : 'No businesses yet. Create the first one.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-notion-line bg-notion-panel/50">
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Business</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Contact</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-notion-sub uppercase tracking-wide">Joined</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr
                        key={t.id}
                        className="border-b border-notion-panel hover:bg-notion-panel/40 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/dashboard/businesses/${t.id}`)}
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-notion-text">{t.name}</p>
                          <p className="text-xs text-notion-faint font-mono">{t.slug}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-notion-sub">{t.email ?? '—'}</p>
                          <p className="text-xs text-notion-faint">{t.phone ?? ''}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={STATUS_VARIANT[t.subscriptionStatus] ?? 'default'}>
                            {STATUS_LABEL[t.subscriptionStatus] ?? t.subscriptionStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-notion-sub">
                          {new Date(t.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-xs text-notion-blue">View →</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-notion-line px-5 py-3">
              <p className="text-xs text-notion-sub">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex gap-1.5">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  ← Prev
                </Button>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Next →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* Create business modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-notion-line bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-notion-line px-5 py-4 shrink-0">
              <h2 className="text-sm font-semibold text-notion-text">Create New Business</h2>
              <button
                onClick={() => { setShowCreate(false); setFormError('') }}
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
                label="Business name"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="City Diagnostics"
                disabled={createMutation.isPending}
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                placeholder="city-diagnostics"
                hint="Subdomain: city-diagnostics.kaltros.com"
                disabled={createMutation.isPending}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Business email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="info@clinic.com"
                  disabled={createMutation.isPending}
                />
                <PhoneInput
                  label="Business phone"
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
                    label="Last name"
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
                    label="Email"
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
                  onClick={() => { setShowCreate(false); setFormError('') }}
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
      )}

      {/* Credentials card — shown once after business creation */}
      {createdCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-notion-line bg-white shadow-xl">
            <div className="px-5 py-4 border-b border-notion-line">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h2 className="text-sm font-semibold text-notion-text">Business Created</h2>
              </div>
              <p className="text-xs text-notion-sub">
                Share these credentials with <strong>{createdCreds.businessName}</strong> admin.
                The password is shown only once — copy it now.
              </p>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Phone */}
              <div className="rounded-lg bg-notion-panel border border-notion-line px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-notion-sub mb-0.5">Login Phone</p>
                  <p className="font-mono text-sm font-semibold text-notion-text">{createdCreds.adminPhone}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(createdCreds.adminPhone, 'phone')}
                  className="shrink-0 text-xs text-notion-blue hover:text-notion-bluedk font-medium"
                >
                  {copied === 'phone' ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              {/* Password */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-amber-700 mb-0.5">Temp Password</p>
                  <p className="font-mono text-base font-bold tracking-widest text-notion-text">{createdCreds.tempPassword}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(createdCreds.tempPassword, 'password')}
                  className="shrink-0 text-xs text-notion-blue hover:text-notion-bluedk font-medium"
                >
                  {copied === 'password' ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              <p className="text-xs text-notion-faint text-center">
                Admin can change this password after first login.
              </p>
            </div>

            <div className="border-t border-notion-line px-5 py-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setCreatedCreds(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
