'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminHeader } from '@/components/admin/header'
import { Badge } from '@/components/ui/badge'
import { useSiteAdminAuthStore } from '@/store/siteadmin-auth.store'

interface Tenant {
  id: string
  name: string
  slug: string
  subscriptionStatus: string
  createdAt: string
}

// ── Stat Card (flat, Notion-style) ──────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  tint: string   // subtle icon-chip background
  icon: React.ReactNode
  delay?: string
}

function StatCard({ label, value, sub, tint, icon, delay = '0ms' }: StatCardProps) {
  return (
    <div
      className="animate-fade-in-up rounded-lg border border-notion-line bg-white p-4 transition-colors hover:bg-notion-panel"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tint}`}>
          {icon}
        </span>
        <p className="text-xs font-medium text-notion-sub">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-notion-text">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-notion-faint">{sub}</p>}
    </div>
  )
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  active:       'success',
  trialing:     'info',
  grace_period: 'warning',
  suspended:    'danger',
  cancelled:    'default',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { hasRole } = useSiteAdminAuthStore()

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['siteadmin', 'tenants'],
    queryFn: async () => {
      const res = await api.get<Tenant[]>('/api/v1/siteadmin/tenants?limit=5')
      const list = Array.isArray(res.data) ? res.data : []
      // Backend returns Prisma enums UPPERCASE (e.g. "TRIALING"); this UI keys
      // its status maps in lowercase. Normalise on the way in.
      return list.map(t => ({ ...t, subscriptionStatus: t.subscriptionStatus.toLowerCase() }))
    },
    enabled: hasRole('operations_admin'),
  })

  const total = tenants.length
  const statusCounts = tenants.reduce<Record<string, number>>((acc, t) => {
    acc[t.subscriptionStatus] = (acc[t.subscriptionStatus] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AdminHeader title="Dashboard" subtitle="Platform overview" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total Businesses"
              value={total || '—'}
              sub="All tenants"
              tint="bg-blue-50 text-notion-blue"
              delay="0ms"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path d="M3 21h18M9 21V7l6-4v18M9 11h6M9 16h6" />
                </svg>
              }
            />
            <StatCard
              label="Active"
              value={statusCounts['active'] ?? '—'}
              sub="Active subscriptions"
              tint="bg-[#edf5ee] text-[#448361]"
              delay="40ms"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Trialing"
              value={statusCounts['trialing'] ?? '—'}
              sub="In trial period"
              tint="bg-[#e7f3f8] text-[#337ea9]"
              delay="80ms"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Suspended"
              value={statusCounts['suspended'] ?? '—'}
              sub="Need attention"
              tint="bg-[#fbeceb] text-[#c0392b]"
              delay="120ms"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              }
            />
          </div>

          {/* ── Recent businesses ── */}
          {hasRole('operations_admin') && (
            <div className="animate-fade-in-up overflow-hidden rounded-lg border border-notion-line bg-white" style={{ animationDelay: '160ms' }}>
              <div className="flex items-center justify-between border-b border-notion-line px-4 py-3">
                <h3 className="text-sm font-semibold text-notion-text">Recent Businesses</h3>
                <a href="/admin/dashboard/businesses" className="text-xs font-medium text-notion-blue hover:underline">
                  View all →
                </a>
              </div>

              {isLoading ? (
                <div className="px-4 py-10 text-center text-xs text-notion-faint">Loading businesses…</div>
              ) : tenants.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-notion-faint">No businesses yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-notion-line bg-notion-panel text-left">
                      <th className="px-4 py-2 text-xs font-medium text-notion-faint">Business</th>
                      <th className="px-4 py-2 text-xs font-medium text-notion-faint">Slug</th>
                      <th className="px-4 py-2 text-xs font-medium text-notion-faint">Status</th>
                      <th className="px-4 py-2 text-xs font-medium text-notion-faint">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id} className="border-b border-notion-line last:border-0 transition-colors hover:bg-notion-panel">
                        <td className="px-4 py-2.5 font-medium text-notion-text">{t.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-notion-faint">{t.slug}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={STATUS_VARIANT[t.subscriptionStatus] ?? 'default'}>
                            {t.subscriptionStatus.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-notion-sub">
                          {new Date(t.createdAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
