'use client'

import { Card, CardContent, Badge } from '@/shared/ui'
import { STATUS_VARIANT, STATUS_LABEL } from '@/entities/tenant'
import { formatBusinessDate } from '../utils'
import type { ISubscriptionTabProps } from '../interfaces'
import { SectionTitle } from './SectionTitle'
import { ReadField } from './ReadField'

export function SubscriptionTab({ tenant }: ISubscriptionTabProps) {
  return (
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
          <ReadField label="Trial Ends" value={formatBusinessDate(tenant.trialEndsAt) ?? '—'} />
          <ReadField label="Subscription Ends" value={formatBusinessDate(tenant.subscriptionEndsAt) ?? '—'} />
          <ReadField label="Grace Period Ends" value={formatBusinessDate(tenant.gracePeriodEndsAt) ?? '—'} />
        </div>

        <div className="mt-6 rounded-lg bg-notion-panel border border-notion-line px-4 py-3">
          <p className="text-xs text-notion-sub">
            Subscription plan assignment and upgrades will be managed from the
            Subscription Plans page. Manual adjustments require super_owner access.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
