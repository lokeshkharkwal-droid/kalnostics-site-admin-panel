import { redirect } from 'next/navigation'

/**
 * Root route — this app is the SiteAdmin console only.
 * Send visitors straight to the admin login; the dashboard layout
 * will forward already-authenticated users on to /admin/dashboard.
 */
export default function HomePage() {
  redirect('/admin/login')
}
