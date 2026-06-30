'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSiteAdminAuthStore } from '@/store'
import { AdminSidebar } from '@/widgets/AdminSidebar'
import { PageLoader } from '@/shared/ui'

/**
 * SiteAdmin dashboard shell — sidebar + content area.
 * Guards all authenticated routes: redirects to login if no valid token.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, init } = useSiteAdminAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    init()
    setReady(true)
  }, [init])

  useEffect(() => {
    if (ready && !token) {
      router.replace('/login')
    }
  }, [ready, token, router])

  // Show loader while we check localStorage
  if (!ready || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-y-auto bg-white">
        {children}
      </div>
    </div>
  )
}
