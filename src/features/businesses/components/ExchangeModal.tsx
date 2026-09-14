'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal, Button, Badge, Spinner } from '@/shared/ui'
import {
  getTenantExchangeStatus,
  getTenantExchangeUsage,
  registerTenantWithExchange,
} from '../services/businesses.api'

/** One month's usage row, as returned by the Exchange `/clientsbilling/show`. */
interface UsageRow {
  month?: number | string
  year?: number | string
  sms_count?: number | string | null
  email_count?: number | string | null
  whatsapp_count?: number | string | null
}

/** Coerce the loosely-typed Exchange usage payload into monthly rows. */
function toUsageRows(usage: unknown): UsageRow[] {
  if (Array.isArray(usage)) return usage as UsageRow[]
  if (usage && typeof usage === 'object' && Array.isArray((usage as { data?: unknown }).data)) {
    return (usage as { data: UsageRow[] }).data
  }
  return []
}

/**
 * Business Exchange modal — shows whether a tenant is registered as a client on
 * the external Exchange server, lets a SiteAdmin register it (the `/clients`
 * step), and displays the per-month message/notification usage counts. Mirrors
 * the legacy `businessExchange` screen.
 */
export function ExchangeModal({ tenantId, name, onClose }: { tenantId: string; name: string; onClose: () => void }) {
  const qc = useQueryClient()

  const statusQuery = useQuery({
    queryKey: ['siteadmin', 'tenant-exchange-status', tenantId],
    queryFn: () => getTenantExchangeStatus(tenantId),
    enabled: !!tenantId,
  })
  const usageQuery = useQuery({
    queryKey: ['siteadmin', 'tenant-exchange-usage', tenantId],
    queryFn: () => getTenantExchangeUsage(tenantId),
    enabled: !!tenantId,
  })

  const registerMutation = useMutation({
    mutationFn: () => registerTenantWithExchange(tenantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenant-exchange-status', tenantId] })
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenant-exchange-usage', tenantId] })
    },
  })

  const isRegistered = !!statusQuery.data
  const usageRows = toUsageRows(usageQuery.data)

  return (
    <Modal
      title="Business Exchange"
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
            {isRegistered ? 'Registered' : 'Register with Exchange'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-notion-text">{name}</p>
            <p className="text-xs text-notion-faint">Exchange client registration &amp; usage</p>
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
            This business is not registered on the Exchange server. Register it so the
            Exchange can track its notification/message counts. (The tenant must already
            have an exchange id — run Sync Exchange Ids first if registration is rejected.)
          </p>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-notion-sub">Usage</p>
          {usageQuery.isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : usageRows.length === 0 ? (
            <p className="text-sm text-notion-faint">No usage data available.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-notion-line2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-notion-line2 bg-notion-bg text-left text-xs text-notion-sub">
                    <th className="px-3 py-2">Period</th>
                    <th className="px-3 py-2">SMS</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRows.map((r, i) => (
                    <tr key={i} className="border-b border-notion-line2 last:border-0">
                      <td className="px-3 py-2 text-notion-text">{r.month ?? '—'}/{r.year ?? '—'}</td>
                      <td className="px-3 py-2 text-notion-sub">{r.sms_count ?? 0}</td>
                      <td className="px-3 py-2 text-notion-sub">{r.email_count ?? 0}</td>
                      <td className="px-3 py-2 text-notion-sub">{r.whatsapp_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
