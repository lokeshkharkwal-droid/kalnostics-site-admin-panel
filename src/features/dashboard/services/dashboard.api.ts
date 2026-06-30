import { api } from '@/shared/services/api'
import type { Tenant, DashboardCounts } from '@/entities/tenant'

/**
 * Fetch aggregate business counts (total/active/trial/suspended) across all
 * tenants for the dashboard stat cards. Unlike the recent-tenants fetch, these
 * are computed server-side over the full tenant set.
 */
export async function fetchDashboardCounts(): Promise<DashboardCounts> {
  const res = await api.get<DashboardCounts>('/api/v1/siteadmin/tenants/dashboard-counts')
  return res.data
}

/**
 * Fetch the 5 most recent tenants for the dashboard overview.
 * Backend returns Prisma enums UPPERCASE (e.g. "TRIALING"); this UI keys its
 * status maps in lowercase, so we normalise on the way in.
 */
export async function fetchRecentTenants(): Promise<Tenant[]> {
  const res = await api.get<Tenant[]>('/api/v1/siteadmin/tenants?limit=5')
  const list = Array.isArray(res.data) ? res.data : []
  return list.map(t => ({ ...t, subscriptionStatus: t.subscriptionStatus.toLowerCase() }))
}
