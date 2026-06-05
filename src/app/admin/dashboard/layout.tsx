'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSiteAdminAuthStore } from '@/store/siteadmin-auth.store'
import { AdminSidebar } from '@/components/admin/sidebar'
import { PageLoader } from '@/components/ui/spinner'
import { useState } from 'react'

/**
 * SiteAdmin dashboard shell — sidebar + content area.
 * Guards all /admin/dashboard/* routes: redirects to login if no valid token.
 */
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, init } = useSiteAdminAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    init()
    setReady(true)
  }, [init])

  useEffect(() => {
    if (ready && !token) {
      router.replace('/admin/login')
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
