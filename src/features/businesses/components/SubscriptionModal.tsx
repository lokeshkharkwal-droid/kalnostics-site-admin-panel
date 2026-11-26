'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Button, Badge, Spinner } from '@/shared/ui'
import {
  changeTenantSubscriptionPlan,
  getTenantSubscriptionPlans,
  getTenantSubscriptionStatus,
  registerTenantWithSubscription,
} from '../services/businesses.api'

/** The subset of the subscription client record we display. */
interface SubscriptionRecord {
  code?: string
  plan?: { title?: string; slug?: string } | false
}

/**
 * Business Subscription modal — shows whether a tenant is registered as a client
 * on the external Subscription server, lets a SiteAdmin register it (`/clients`)
 * and assign / change its plan (`/orders`). Mirrors the Exchange modal and reuses
 * the SiteAdmin `/subscription-*` tenant endpoints.
 */
export function SubscriptionModal({ tenantId, name, onClose }: { tenantId: string; name: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [selectedPlanId, setSelectedPlanId] = useState('')

  const statusQuery = useQuery({
    queryKey: ['siteadmin', 'tenant-subscription-status', tenantId],
    queryFn: () => getTenantSubscriptionStatus(tenantId),
    enabled: !!tenantId,
  })
  const isRegistered = !!statusQuery.data
  const record = (statusQuery.data ?? null) as SubscriptionRecord | null
  const currentPlan = record && record.plan ? record.plan : null

  const plansQuery = useQuery({
    queryKey: ['siteadmin', 'tenant-subscription-plans', tenantId],
    queryFn: () => getTenantSubscriptionPlans(tenantId),
    enabled: !!tenantId && isRegistered,
  })

  const registerMutation = useMutation({
    mutationFn: () => registerTenantWithSubscription(tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenant-subscription-status', tenantId] })
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
    },
  })

  const assignMutation = useMutation({
    mutationFn: (planId: string) => changeTenantSubscriptionPlan(tenantId, planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenant-subscription-status', tenantId] })
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
    },
  })

  return (
    <Modal
      title="Business Subscription"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={registerMutation.isPending}>
            Close
          </Button>
          <Button
            size="sm"
            loading={registerMutation.isPending}
            disabled={isRegistered || statusQuery.isLoading}
            onClick={() => registerMutation.mutate()}
          >
            {isRegistered ? 'Registered' : 'Register with Subscription'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-notion-text">{name}</p>
            <p className="text-xs text-notion-faint">Subscription client registration &amp; plan</p>
          </div>
          {statusQuery.isLoading ? (
            <Spinner />
          ) : (
            <Badge variant={isRegistered ? 'success' : 'default'}>
              {isRegistered ? 'Registered' : 'Not registered'}
            </Badge>
          )}
        </div>

        {!isRegistered && !statusQuery.isLoading && (
          <p className="rounded-md border border-notion-line2 bg-notion-bg px-3 py-2 text-sm text-notion-sub">
            This business is not registered on the Subscription server. Register it so a plan and
            bills can be managed. (The business must have a subscription id — i.e. a legacy or
            exchange id.)
          </p>
        )}

        {isRegistered && (
          <div className="space-y-3">
            <div className="rounded-md border border-notion-line2 px-3 py-2 text-sm">
              <span className="text-notion-faint">Current plan: </span>
              <span className="text-notion-text">{currentPlan?.title ?? 'No plan assigned'}</span>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-notion-sub">Change plan</p>
              {plansQuery.isLoading ? (
                <div className="flex justify-center py-3"><Spinner /></div>
              ) : (plansQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-notion-faint">No plans available on the subscription server.</p>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedPlanId}
                    onChange={e => setSelectedPlanId(e.target.value)}
                    disabled={assignMutation.isPending}
                    className="h-9 flex-1 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
                  >
                    <option value="">Select a plan…</option>
                    {(plansQuery.data ?? []).map(p => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {p.title ?? p.slug ?? `Plan ${p.id}`}
                        {p.price != null ? ` — ${p.price}` : ''}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    loading={assignMutation.isPending}
                    disabled={!selectedPlanId}
                    onClick={() => assignMutation.mutate(selectedPlanId)}
                  >
                    Assign
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
