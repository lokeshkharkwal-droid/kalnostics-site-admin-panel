'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Badge, DataTable, type Column } from '@/shared/ui'
import { AdminHeader } from '@/widgets/AdminHeader'
import { useSiteAdminAuthStore } from '@/store'
import { STATUS_VARIANT } from '@/entities/tenant'
import { fetchRecentTenants, fetchDashboardCounts } from '../services/dashboard.api'
import { StatCard } from './StatCard'

export function DashboardPage() {
  const { hasRole } = useSiteAdminAuthStore()

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['siteadmin', 'tenants'],
    queryFn: fetchRecentTenants,
    enabled: hasRole('operations_admin'),
  })

  const { data: counts } = useQuery({
    queryKey: ['siteadmin', 'dashboard-counts'],
    queryFn: fetchDashboardCounts,
    enabled: hasRole('operations_admin'),
  })

  const recentColumns: Column<(typeof tenants)[number]>[] = [
    { header: 'Business', width: 220, tooltip: t => t.name,
      cell: t => <span className="font-medium text-notion-text">{t.name}</span> },
    { header: 'Slug', width: 180, tooltip: t => t.slug,
      cell: t => <span className="font-mono text-xs text-notion-faint">{t.slug}</span> },
    { header: 'Status', width: 150, truncate: false,
      cell: t => (
        <Badge variant={STATUS_VARIANT[t.subscriptionStatus] ?? 'default'}>
          {t.subscriptionStatus.replace(/_/g, ' ')}
        </Badge>
      ) },
    { header: 'Joined', width: 130,
      cell: t => <span className="text-xs text-notion-sub">{new Date(t.createdAt).toLocaleDateString('en-IN')}</span> },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AdminHeader title="Dashboard" subtitle="Platform overview" />

      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total Businesses"
              value={counts?.total ?? '—'}
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
              value={counts?.active ?? '—'}
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
              value={counts?.trial ?? '—'}
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
              value={counts?.suspended ?? '—'}
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
                <Link href="/businesses" className="text-xs font-medium text-notion-blue hover:underline">
                  View all →
                </Link>
              </div>

              <DataTable
                frame={false}
                rows={tenants}
                rowKey={t => t.id}
                loading={isLoading}
                emptyMessage="No businesses yet"
                columns={recentColumns}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
