'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSiteAdminAuthStore, type SiteAdminRole } from '@/store/siteadmin-auth.store'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  minRole?: SiteAdminRole
}

// ── Icons (monochrome, inherit text colour) ─────────────────────────────────────

const LayoutIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
const BuildingIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
    <path d="M3 21h18M9 21V7l6-4v18M9 11h6M9 16h6" />
  </svg>
)
const CreditCardIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
  </svg>
)
const UsersIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',          href: '/admin/dashboard',            icon: <LayoutIcon />,     minRole: 'content_admin' },
  { label: 'Businesses',         href: '/admin/dashboard/businesses', icon: <BuildingIcon />,   minRole: 'operations_admin' },
  { label: 'Subscription Plans', href: '/admin/dashboard/plans',      icon: <CreditCardIcon />, minRole: 'super_owner' },
  { label: 'Admin Users',        href: '/admin/dashboard/admins',     icon: <UsersIcon />,      minRole: 'super_owner' },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname()
  const { hasRole, user } = useSiteAdminAuthStore()

  const visibleItems = NAV_ITEMS.filter(item => !item.minRole || hasRole(item.minRole))

  return (
    <aside className="flex h-full w-60 flex-col border-r border-notion-line bg-notion-sidebar">

      {/* Workspace header */}
      <div className="flex h-12 items-center gap-2.5 px-3">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-notion-text text-[11px] font-bold text-white">
          K
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-notion-text">Kalnostics</p>
          <p className="truncate text-[11px] leading-tight text-notion-faint">Admin workspace</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-px">
          {visibleItems.map((item) => {
            const isActive = item.href === '/admin/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-100',
                    isActive
                      ? 'bg-notion-sel font-medium text-notion-text'
                      : 'text-notion-sub hover:bg-notion-hover hover:text-notion-text',
                  )}
                >
                  <span className={cn(
                    'shrink-0',
                    isActive ? 'text-notion-text' : 'text-notion-faint group-hover:text-notion-sub',
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-notion-line px-3 py-2.5">
        <p className="truncate text-[11px] text-notion-faint">
          {user?.email ?? 'Signed in'}
        </p>
        <p className="text-[10px] text-notion-faint/70">Kalnostics Admin · v1.0</p>
      </div>
    </aside>
  )
}
