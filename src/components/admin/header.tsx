'use client'

import { useRouter } from 'next/navigation'
import { useSiteAdminAuthStore } from '@/store/siteadmin-auth.store'

const ROLE_LABELS: Record<string, string> = {
  super_owner:      'Super Owner',
  full_admin:       'Full Admin',
  operations_admin: 'Operations Admin',
  content_admin:    'Content Admin',
}

interface AdminHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  const router = useRouter()
  const { user, logout } = useSiteAdminAuthStore()

  function handleLogout() {
    logout()
    router.push('/admin/login')
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'SA'

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-notion-line bg-white px-5">
      {/* Left — breadcrumb-style title */}
      <div className="flex items-baseline gap-2 min-w-0">
        <h1 className="truncate text-md font-medium text-notion-text">{title}</h1>
        {subtitle && <p className="hidden truncate text-xs text-notion-faint sm:block">· {subtitle}</p>}
      </div>

      {/* Right — actions + user menu */}
      <div className="flex items-center gap-2">
        {actions}

        {user && (
          <div className="flex items-center gap-2 pl-2">
            <span className="hidden text-xs text-notion-sub md:inline">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-notion-text text-[10px] font-semibold text-white">
              {initials}
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-md text-notion-faint transition-colors hover:bg-notion-hover hover:text-notion-red"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
