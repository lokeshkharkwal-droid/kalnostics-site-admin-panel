import type { SiteAdminUser } from '@/entities/siteadmin-user'

/** Format an admin's last-login as "DD Mon YYYY · IP" (or "Never"). */
export function formatLastLogin(admin: SiteAdminUser): string {
  if (!admin.lastLoginAt) return 'Never'
  const date = new Date(admin.lastLoginAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  return admin.lastLoginIp ? `${date} · ${admin.lastLoginIp}` : date
}
