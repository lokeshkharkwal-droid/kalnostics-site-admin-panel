/**
 * Route-segment loading UI for the dashboard group.
 *
 * Giving the segment a Suspense fallback lets App Router *commit* a navigation
 * immediately — the content area shows this loader right away while the target
 * page's chunk loads — instead of appearing frozen until the whole page is
 * ready. The persistent sidebar/layout stays mounted throughout.
 */
export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-1 items-center justify-center bg-white">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-notion-line2 border-t-notion-text" />
    </div>
  )
}
