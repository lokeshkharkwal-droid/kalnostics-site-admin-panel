import { DashboardShell } from '@/widgets/DashboardShell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
