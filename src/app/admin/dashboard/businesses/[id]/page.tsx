'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import { PhoneInput, parsePhone } from '@/components/ui/phone-input'

interface TenantSettings {
  timezone: string
  currency: string
  date_format: string
  language: string
  logo_url?: string
  primary_color?: string
  app_name?: string
}

interface Tenant {
  id: string
  name: string
  slug: string
  customDomain: string | null
  email: string | null
  phone: string | null
  address: Record<string, unknown> | null
  subscriptionStatus: string
  subscriptionPlanId: string | null
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  gracePeriodEndsAt: string | null
  settings: TenantSettings
  isActive: boolean
  mrnPrefix: string | null
  createdAt: string
  updatedAt: string
}

interface BusinessAdmin {
  personId: string
  firstName: string
  lastName: string | null
  phone: string | null
  email: string | null
  platformMrn: string
  isActive: boolean
  isTempPassword: boolean
  lastLoginAt: string | null
}

interface ResetCredentials {
  adminPhone: string
  tempPassword: string
}

interface EditForm {
  name: string
  email: string
  phoneCountryCode: string
  phone: string
  mrnPrefix: string
  settings: {
    timezone: string
    currency: string
    date_format: string
    language: string
    app_name: string
  }
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-notion-sub uppercase tracking-wide mb-3">
      {children}
    </h3>
  )
}

function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-notion-sub mb-0.5">{label}</p>
      <p className="text-sm text-notion-text">{value || <span className="text-notion-faint">—</span>}</p>
    </div>
  )
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)
  const [saveError, setSaveError] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'subscription' | 'settings' | 'admin'>('info')
  const [resetCreds, setResetCreds] = useState<ResetCredentials | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['siteadmin', 'tenant', id],
    queryFn: async () => {
      const res = await api.get<Tenant>(`/api/v1/siteadmin/tenants/${id}`)
      const t = res.data as Tenant
      // Backend returns subscriptionStatus as an UPPERCASE Prisma enum; this UI
      // keys its status maps in lowercase. Normalise on the way in.
      return { ...t, subscriptionStatus: t.subscriptionStatus.toLowerCase() } as Tenant
    },
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: Partial<EditForm>) =>
      api.patch(`/api/v1/siteadmin/tenants/${id}`, body, { successMessage: 'Changes saved' }).then(r => r.data),
    onSuccess: (updated: Tenant) => {
      qc.setQueryData(['siteadmin', 'tenant', id], updated)
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
      setEditing(false)
      setSaveError('')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to save changes'
      setSaveError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  const { data: adminAccount, isLoading: adminLoading, refetch: refetchAdmin } = useQuery({
    queryKey: ['siteadmin', 'tenant-admin', id],
    queryFn: async () => {
      const res = await api.get<BusinessAdmin | null>(`/api/v1/siteadmin/tenants/${id}/admin`)
      return res.data as BusinessAdmin | null
    },
    enabled: !!id && activeTab === 'admin',
  })

  const resetMutation = useMutation({
    mutationFn: () =>
      api.post<ResetCredentials>(`/api/v1/siteadmin/tenants/${id}/admin/reset-password`, undefined, { successMessage: 'Password reset' }).then(r => r.data),
    onSuccess: (data: ResetCredentials) => {
      setResetCreds(data)
      setResetConfirm(false)
      refetchAdmin()
    },
  })

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  function startEdit() {
    if (!tenant) return
    const parsedPhone = parsePhone(tenant.phone)
    setForm({
      name: tenant.name,
      email: tenant.email ?? '',
      phoneCountryCode: parsedPhone.countryCode,
      phone: parsedPhone.phone,
      mrnPrefix: tenant.mrnPrefix ?? '',
      settings: {
        timezone:    tenant.settings?.timezone ?? 'Asia/Kolkata',
        currency:    tenant.settings?.currency ?? 'INR',
        date_format: tenant.settings?.date_format ?? 'DD/MM/YYYY',
        language:    tenant.settings?.language ?? 'en',
        app_name:    tenant.settings?.app_name ?? '',
      },
    })
    setSaveError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setForm(null)
    setSaveError('')
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaveError('')

    if (!form.name.trim()) {
      setSaveError('Business name is required')
      return
    }

    // Build the patch payload — omit empty strings for optional fields
    updateMutation.mutate({
      name:      form.name.trim(),
      email:     form.email.trim() || undefined,
      phone:     form.phone.trim() ? form.phoneCountryCode + form.phone.trim() : undefined,
      mrnPrefix: form.mrnPrefix.trim() || undefined,
      settings: {
        timezone:    form.settings.timezone,
        currency:    form.settings.currency,
        date_format: form.settings.date_format,
        language:    form.settings.language,
        ...(form.settings.app_name ? { app_name: form.settings.app_name } : {}),
      },
    } as any)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col overflow-auto">
        <AdminHeader title="Business Details" />
        <PageLoader />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col overflow-auto">
        <AdminHeader title="Business Details" />
        <main className="p-6">
          <Card>
            <CardContent className="py-16 text-center text-sm text-notion-faint">
              Business not found or failed to load.
              <div className="mt-4">
                <Button variant="secondary" size="sm" onClick={() => router.push('/admin/dashboard/businesses')}>
                  ← Back to Businesses
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const tabs = [
    { key: 'info' as const,         label: 'General Info' },
    { key: 'subscription' as const, label: 'Subscription' },
    { key: 'settings' as const,     label: 'Settings' },
    { key: 'admin' as const,        label: 'Admin Account' },
  ]

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title={tenant.name}
        subtitle={`${tenant.slug}.kaltros.com`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/admin/dashboard/businesses')}
            >
              ← Back
            </Button>
            {!editing && (
              <Button size="sm" onClick={startEdit}>
                Edit
              </Button>
            )}
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-5">
        {/* Status row */}
        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[tenant.subscriptionStatus] ?? 'default'}>
            {STATUS_LABEL[tenant.subscriptionStatus] ?? tenant.subscriptionStatus}
          </Badge>
          {!tenant.isActive && (
            <Badge variant="danger">Deactivated</Badge>
          )}
          <span className="text-xs text-notion-faint">
            Joined {formatDate(tenant.createdAt)}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-notion-line">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-notion-blue text-notion-blue'
                  : 'border-transparent text-notion-sub hover:text-notion-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── General Info tab ────────────────────────────────────────── */}
        {activeTab === 'info' && (
          <Card>
            <div className="px-5 py-4 border-b border-notion-line flex items-center justify-between">
              <SectionTitle>Business Information</SectionTitle>
              {editing && (
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={cancelEdit} disabled={updateMutation.isPending}>
                    Cancel
                  </Button>
                  <Button size="sm" loading={updateMutation.isPending} onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            <CardContent className="py-5">
              {!editing ? (
                <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                  <ReadField label="Business Name" value={tenant.name} />
                  <ReadField label="Slug (subdomain)" value={`${tenant.slug}.kaltros.com`} />
                  <ReadField label="Email" value={tenant.email} />
                  <ReadField label="Phone" value={tenant.phone} />
                  <ReadField label="Custom Domain" value={tenant.customDomain} />
                  <ReadField label="MRN Prefix" value={tenant.mrnPrefix} />
                </div>
              ) : (
                form && (
                  <form onSubmit={handleSave} className="space-y-4 max-w-lg">
                    <Input
                      label="Business Name"
                      value={form.name}
                      onChange={e => setForm(f => f && ({ ...f, name: e.target.value }))}
                      disabled={updateMutation.isPending}
                    />
                    <div>
                      <p className="text-xs text-notion-sub mb-1">Slug (immutable)</p>
                      <p className="text-sm text-notion-sub font-mono bg-notion-panel border border-notion-line rounded-md px-3 py-2">
                        {tenant.slug}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => f && ({ ...f, email: e.target.value }))}
                        disabled={updateMutation.isPending}
                      />
                      <PhoneInput
                        label="Phone"
                        countryCode={form.phoneCountryCode}
                        onCountryCodeChange={v => setForm(f => f && ({ ...f, phoneCountryCode: v }))}
                        phone={form.phone}
                        onPhoneChange={v => setForm(f => f && ({ ...f, phone: v }))}
                        disabled={updateMutation.isPending}
                      />
                    </div>
                    <Input
                      label="MRN Prefix"
                      value={form.mrnPrefix}
                      onChange={e => setForm(f => f && ({ ...f, mrnPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                      placeholder="CD"
                      hint="Prefix for patient MRNs (e.g. CD → CD-00001). Cannot exceed 10 chars."
                      disabled={updateMutation.isPending}
                    />

                    {saveError && (
                      <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                        {saveError}
                      </p>
                    )}
                  </form>
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Subscription tab ─────────────────────────────────────────── */}
        {activeTab === 'subscription' && (
          <Card>
            <div className="px-5 py-4 border-b border-notion-line">
              <SectionTitle>Subscription Details</SectionTitle>
            </div>
            <CardContent className="py-5">
              <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                <div>
                  <p className="text-xs text-notion-sub mb-0.5">Status</p>
                  <Badge variant={STATUS_VARIANT[tenant.subscriptionStatus] ?? 'default'}>
                    {STATUS_LABEL[tenant.subscriptionStatus] ?? tenant.subscriptionStatus}
                  </Badge>
                </div>
                <ReadField label="Plan ID" value={tenant.subscriptionPlanId} />
                <ReadField label="Trial Ends" value={formatDate(tenant.trialEndsAt) ?? '—'} />
                <ReadField label="Subscription Ends" value={formatDate(tenant.subscriptionEndsAt) ?? '—'} />
                <ReadField label="Grace Period Ends" value={formatDate(tenant.gracePeriodEndsAt) ?? '—'} />
              </div>

              <div className="mt-6 rounded-lg bg-notion-panel border border-notion-line px-4 py-3">
                <p className="text-xs text-notion-sub">
                  Subscription plan assignment and upgrades will be managed from the
                  Subscription Plans page. Manual adjustments require super_owner access.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Settings tab ─────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <Card>
            <div className="px-5 py-4 border-b border-notion-line flex items-center justify-between">
              <SectionTitle>Locale & Branding</SectionTitle>
              {editing && (
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={cancelEdit} disabled={updateMutation.isPending}>
                    Cancel
                  </Button>
                  <Button size="sm" loading={updateMutation.isPending} onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            <CardContent className="py-5">
              {!editing ? (
                <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                  <ReadField label="Timezone" value={tenant.settings?.timezone} />
                  <ReadField label="Currency" value={tenant.settings?.currency} />
                  <ReadField label="Date Format" value={tenant.settings?.date_format} />
                  <ReadField label="Language" value={tenant.settings?.language} />
                  <ReadField label="App Name (white-label)" value={tenant.settings?.app_name} />
                </div>
              ) : (
                form && (
                  <form onSubmit={handleSave} className="space-y-4 max-w-lg">
                    <Input
                      label="Timezone"
                      value={form.settings.timezone}
                      onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, timezone: e.target.value } }))}
                      placeholder="Asia/Kolkata"
                      disabled={updateMutation.isPending}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Currency"
                        value={form.settings.currency}
                        onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, currency: e.target.value } }))}
                        placeholder="INR"
                        disabled={updateMutation.isPending}
                      />
                      <Input
                        label="Date Format"
                        value={form.settings.date_format}
                        onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, date_format: e.target.value } }))}
                        placeholder="DD/MM/YYYY"
                        disabled={updateMutation.isPending}
                      />
                    </div>
                    <Input
                      label="Language"
                      value={form.settings.language}
                      onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, language: e.target.value } }))}
                      placeholder="en"
                      disabled={updateMutation.isPending}
                    />
                    <Input
                      label="App Name (white-label)"
                      value={form.settings.app_name}
                      onChange={e => setForm(f => f && ({ ...f, settings: { ...f.settings, app_name: e.target.value } }))}
                      placeholder="Custom name shown in the business's UI"
                      disabled={updateMutation.isPending}
                    />

                    {saveError && (
                      <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                        {saveError}
                      </p>
                    )}
                  </form>
                )
              )}
            </CardContent>
          </Card>
        )}
        {/* ── Admin Account tab ─────────────────────────────────────────── */}
        {activeTab === 'admin' && (
          <div className="space-y-4">
            <Card>
              <div className="px-5 py-4 border-b border-notion-line flex items-center justify-between">
                <SectionTitle>Business Admin Account</SectionTitle>
                {adminAccount && !resetCreds && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setResetConfirm(true)}
                    disabled={resetMutation.isPending}
                  >
                    Reset Password
                  </Button>
                )}
              </div>

              <CardContent className="py-5">
                {adminLoading ? (
                  <p className="text-sm text-notion-faint">Loading…</p>
                ) : !adminAccount ? (
                  <p className="text-sm text-notion-faint">No admin account found for this business.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-10 gap-y-5">
                    <ReadField
                      label="Name"
                      value={[adminAccount.firstName, adminAccount.lastName].filter(Boolean).join(' ')}
                    />
                    <ReadField label="Platform MRN" value={adminAccount.platformMrn} />
                    <ReadField label="Phone (login ID)" value={adminAccount.phone} />
                    <ReadField label="Email" value={adminAccount.email} />
                    <div>
                      <p className="text-xs text-notion-sub mb-0.5">Password Status</p>
                      {adminAccount.isTempPassword ? (
                        <Badge variant="warning">Temp Password — not changed yet</Badge>
                      ) : (
                        <Badge variant="success">Password set by admin</Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-notion-sub mb-0.5">Account Status</p>
                      <Badge variant={adminAccount.isActive ? 'success' : 'danger'}>
                        {adminAccount.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <ReadField
                      label="Last Login"
                      value={adminAccount.lastLoginAt ? formatDate(adminAccount.lastLoginAt) : null}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reset password confirm dialog */}
            {resetConfirm && (
              <Card>
                <CardContent className="py-5">
                  <p className="text-sm text-notion-text mb-4">
                    Are you sure you want to reset the business admin password for{' '}
                    <strong>{tenant.name}</strong>? A new temporary password will be generated.
                  </p>
                  {resetMutation.isError && (
                    <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 mb-4">
                      {(resetMutation.error as any)?.response?.data?.message ?? 'Failed to reset password'}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={resetMutation.isPending}
                      onClick={() => resetMutation.mutate()}
                    >
                      Yes, Reset Password
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setResetConfirm(false)}
                      disabled={resetMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New credentials card — shown once after reset */}
            {resetCreds && (
              <Card>
                <div className="px-5 py-4 border-b border-notion-line">
                  <SectionTitle>New Credentials</SectionTitle>
                </div>
                <CardContent className="py-5 space-y-4">
                  <p className="text-sm text-notion-sub">
                    Share these credentials with the business admin. The password is shown once — it cannot be retrieved again.
                  </p>

                  <div className="rounded-lg bg-notion-panel border border-notion-line divide-y divide-notion-line">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs text-notion-sub mb-0.5">Phone (Login ID)</p>
                        <p className="text-sm font-mono text-notion-text">{resetCreds.adminPhone}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(resetCreds.adminPhone, 'phone')}
                      >
                        {copiedField === 'phone' ? '✓ Copied' : 'Copy'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs text-notion-sub mb-0.5">Temporary Password</p>
                        <p className="text-sm font-mono text-notion-text tracking-wider">{resetCreds.tempPassword}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(resetCreds.tempPassword, 'password')}
                      >
                        {copiedField === 'password' ? '✓ Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-notion-faint">
                    Admin must change this password after first login.
                  </p>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setResetCreds(null)}
                  >
                    Dismiss
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
