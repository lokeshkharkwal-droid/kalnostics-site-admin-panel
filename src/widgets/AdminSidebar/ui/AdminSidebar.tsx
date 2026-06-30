'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/utils'
import { useSiteAdminAuthStore } from '@/store'
import type { SiteAdminRole } from '@/entities/siteadmin-user'

interface NavItem {
  label: string
  /** Leaf items link to a route; group headers omit `href` and carry `children`. */
  href?: string
  icon?: React.ReactNode
  minRole?: SiteAdminRole
  children?: NavItem[]
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
const FlaskIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M10 3v6.5L5.2 18A1.5 1.5 0 006.5 20.3h11A1.5 1.5 0 0018.8 18L14 9.5V3M8 14h8" />
  </svg>
)
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg className={cn('h-3.5 w-3.5 transition-transform duration-100', open && 'rotate-90')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',          href: '/dashboard',  icon: <LayoutIcon />,     minRole: 'content_admin' },
  { label: 'Businesses',         href: '/businesses', icon: <BuildingIcon />,   minRole: 'operations_admin' },
  {
    label: 'Lab',
    icon: <FlaskIcon />,
    minRole: 'content_admin',
    children: [
      { label: 'Departments', href: '/departments', minRole: 'content_admin' },
      { label: 'Categories', href: '/categories', minRole: 'content_admin' },
      { label: 'Sub Categories', href: '/sub-categories', minRole: 'content_admin' },
      { label: 'Lab Tests', href: '/lab-tests', minRole: 'content_admin' },
    ],
  },
  { label: 'Subscription Plans', href: '/plans',      icon: <CreditCardIcon />, minRole: 'super_owner' },
  { label: 'Admin Users',        href: '/admins',     icon: <UsersIcon />,      minRole: 'super_owner' },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname()
  const { hasRole, user } = useSiteAdminAuthStore()

  const canSee = (item: NavItem) => !item.minRole || hasRole(item.minRole)
  const isActive = (href?: string): boolean =>
    !href ? false : href === '/dashboard' ? pathname === href : pathname.startsWith(href)

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
          {NAV_ITEMS.filter(canSee).map(item =>
            item.children
              ? <NavGroup key={item.label} item={item} canSee={canSee} isActive={isActive} />
              : <NavLeaf key={item.href} item={item} active={isActive(item.href)} />,
          )}
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

// ── Nav pieces ──────────────────────────────────────────────────────────────────

/** A single linkable nav row. `nested` indents it under a group header. */
function NavLeaf({ item, active, nested }: { item: NavItem; active: boolean; nested?: boolean }) {
  return (
    <li>
      <Link
        href={item.href ?? '#'}
        className={cn(
          'group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-100',
          nested && 'pl-9',
          active
            ? 'bg-notion-sel font-medium text-notion-text'
            : 'text-notion-sub hover:bg-notion-hover hover:text-notion-text',
        )}
      >
        {item.icon && (
          <span className={cn(
            'shrink-0',
            active ? 'text-notion-text' : 'text-notion-faint group-hover:text-notion-sub',
          )}>
            {item.icon}
          </span>
        )}
        {item.label}
      </Link>
    </li>
  )
}

/** A collapsible group header with indented child links. Auto-expands when one of
 *  its children is the active route. */
function NavGroup({
  item, canSee, isActive,
}: {
  item: NavItem
  canSee: (item: NavItem) => boolean
  isActive: (href?: string) => boolean
}) {
  const children = (item.children ?? []).filter(canSee)
  const hasActiveChild = children.some(c => isActive(c.href))
  const [open, setOpen] = useState(hasActiveChild)

  if (children.length === 0) return null

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-100',
          hasActiveChild
            ? 'font-medium text-notion-text'
            : 'text-notion-sub hover:bg-notion-hover hover:text-notion-text',
        )}
      >
        {item.icon && (
          <span className={cn(
            'shrink-0',
            hasActiveChild ? 'text-notion-text' : 'text-notion-faint group-hover:text-notion-sub',
          )}>
            {item.icon}
          </span>
        )}
        <span className="flex-1 text-left">{item.label}</span>
        <span className="shrink-0 text-notion-faint"><ChevronIcon open={open} /></span>
      </button>
      {open && (
        <ul className="mt-px space-y-px">
          {children.map(c => <NavLeaf key={c.href} item={c} active={isActive(c.href)} nested />)}
        </ul>
      )}
    </li>
  )
}
