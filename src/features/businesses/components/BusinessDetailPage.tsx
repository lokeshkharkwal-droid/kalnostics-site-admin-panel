'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminHeader } from '@/widgets/AdminHeader'
import { Card, CardContent, Button, Badge, PageLoader, parsePhone } from '@/shared/ui'
import { type TenantDetail, STATUS_VARIANT, STATUS_LABEL } from '@/entities/tenant'
import { getTenant, updateTenant } from '../services/businesses.api'
import { formatBusinessDate } from '../utils'
import type { IEditForm } from '../interfaces'
import { BusinessInfoTab } from './BusinessInfoTab'
import { SubscriptionTab } from './SubscriptionTab'
import { SettingsTab } from './SettingsTab'
import { AdminAccountTab } from './AdminAccountTab'

type DetailTab = 'info' | 'subscription' | 'settings' | 'admin'

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'info',         label: 'General Info' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'settings',     label: 'Settings' },
  { key: 'admin',        label: 'Admin Account' },
]

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<IEditForm | null>(null)
  const [saveError, setSaveError] = useState('')
  const [activeTab, setActiveTab] = useState<DetailTab>('info')

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['siteadmin', 'tenant', id],
    queryFn: () => getTenant(id),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: Partial<IEditForm>) => updateTenant(id, body as Record<string, unknown>),
    onSuccess: (updated: TenantDetail) => {
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
    } as Partial<IEditForm>)
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
                <Button variant="secondary" size="sm" onClick={() => router.push('/businesses')}>
                  ← Back to Businesses
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const editTabProps = {
    tenant,
    editing,
    form,
    setForm,
    updating: updateMutation.isPending,
    saveError,
    onSave: handleSave,
    onCancel: cancelEdit,
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title={tenant.name}
        subtitle={`${tenant.slug}.kaltros.com`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => router.push('/businesses')}>
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
            Joined {formatBusinessDate(tenant.createdAt)}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-notion-line">
          {TABS.map(tab => (
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

        {activeTab === 'info' && <BusinessInfoTab {...editTabProps} />}
        {activeTab === 'subscription' && <SubscriptionTab tenant={tenant} />}
        {activeTab === 'settings' && <SettingsTab {...editTabProps} />}
        {activeTab === 'admin' && <AdminAccountTab tenantId={tenant.id} tenantName={tenant.name} />}
      </main>
    </div>
  )
}
