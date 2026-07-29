'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
import { BranchesTab } from './BranchesTab'
import { ConfigurationModal } from './ConfigurationModal'
import { SettingsModal } from './SettingsModal'

type DetailTab = 'info' | 'subscription' | 'localization' | 'branches' | 'admin'

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'info',         label: 'General Info' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'localization', label: 'Localization' },
  { key: 'branches',     label: 'Branches' },
  { key: 'admin',        label: 'Admin Account' },
]

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const qc = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<IEditForm | null>(null)
  const [saveError, setSaveError] = useState('')
  const [activeTab, setActiveTab] = useState<DetailTab>('info')
  const [modal, setModal] = useState<'config' | 'settings' | null>(null)
  const autoEditHandled = useRef(false)

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['siteadmin', 'tenant', id],
    queryFn: () => getTenant(id),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => updateTenant(id, body),
    onSuccess: () => {
      // Invalidate (don't setQueryData) the detail: the PATCH response omits the
      // populated country/state/city/area relations, so re-fetch via getTenant to
      // keep the Location label correct on revisit / View.
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenant', id] })
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
      setEditing(false)
      setSaveError('')
      router.push('/businesses')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Failed to save changes'
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
      shortName: tenant.shortName ?? '',
      addressLine: tenant.addressLine ?? '',
      pincode: tenant.pincode ?? '',
      country: tenant.country ? { id: tenant.country.id, label: tenant.country.name } : null,
      state: tenant.state ? { id: tenant.state.id, label: tenant.state.name } : null,
      city: tenant.city ? { id: tenant.city.id, label: tenant.city.name } : null,
      area: tenant.area ? { id: tenant.area.id, label: tenant.area.name } : null,
      logoUrl: tenant.logoUrl ?? '',
      photoUrl: tenant.photoUrl ?? '',
      settings: {
        timezone:    tenant.settings?.timezone ?? 'Asia/Kolkata',
        currency:    tenant.settings?.currency ?? 'INR',
        date_format: tenant.settings?.date_format ?? 'DD/MM/YYYY',
        language:    tenant.settings?.language ?? 'en',
      },
    })
    setSaveError('')
    setEditing(true)
  }

  // Auto-enter edit mode when arriving from the list's Actions menu (?edit=1).
  useEffect(() => {
    if (tenant && !autoEditHandled.current && searchParams.get('edit') === '1') {
      autoEditHandled.current = true
      startEdit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, searchParams])

  function cancelEdit() {
    setEditing(false)
    setForm(null)
    setSaveError('')
    // Discard unsaved edits and refetch so the detail shows the latest saved data.
    qc.invalidateQueries({ queryKey: ['siteadmin', 'tenant', id] })
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaveError('')

    if (!form.name.trim()) {
      setSaveError('Business name is required')
      return
    }

    updateMutation.mutate({
      name:        form.name.trim(),
      email:       form.email.trim() || undefined,
      phone:       form.phone.trim() ? form.phoneCountryCode + form.phone.trim() : undefined,
      shortName:   form.shortName.trim() || undefined,
      addressLine: form.addressLine.trim() || undefined,
      pincode:     form.pincode.trim() || undefined,
      countryId:   form.country?.id ?? null,
      stateId:     form.state?.id ?? null,
      cityId:      form.city?.id ?? null,
      areaId:      form.area?.id ?? null,
      logoUrl:     form.logoUrl.trim() || undefined,
      photoUrl:    form.photoUrl.trim() || undefined,
      settings: {
        timezone:    form.settings.timezone,
        currency:    form.settings.currency,
        date_format: form.settings.date_format,
        language:    form.settings.language,
      },
    })
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
              <>
                <Button size="sm" onClick={startEdit}>
                  Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setModal('config')}>
                  Configuration
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setModal('settings')}>
                  Settings
                </Button>
              </>
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
        {activeTab === 'localization' && <SettingsTab {...editTabProps} />}
        {activeTab === 'branches' && <BranchesTab tenantId={tenant.id} />}
        {activeTab === 'admin' && <AdminAccountTab tenantId={tenant.id} tenantName={tenant.name} />}
      </main>

      {/* Configuration / Settings modals — opened from the header buttons */}
      {modal === 'config' && (
        <ConfigurationModal tenantId={tenant.id} onClose={() => setModal(null)} />
      )}
      {modal === 'settings' && (
        <SettingsModal tenantId={tenant.id} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
