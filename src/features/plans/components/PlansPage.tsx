'use client'

import { useState } from 'react'
import { AdminHeader } from '@/widgets/AdminHeader'
import { MOCK_PLANS, type PlanDetail } from '@/entities/plan'
import { PlanCard } from './PlanCard'
import { EditDrawer } from './EditDrawer'

// ── NOTE ────────────────────────────────────────────────────────────────────
// kalnostics-new has no subscription-plans API yet, so this screen runs off the
// in-memory fixture in `@/entities/plan`. Edits update local React state only
// (they are NOT persisted). When the backend module lands, add a
// `plans/services/plans.api.ts`, swap MOCK_PLANS for a React Query `useQuery`,
// and replace the in-memory save with `api.patch` / `api.put` — the UI below
// does not otherwise need to change.

export function PlansPage() {
  // Local, in-memory copy of the dummy plans. Edits mutate this state only.
  const [plans, setPlans] = useState<PlanDetail[]>(MOCK_PLANS)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingDetail = plans.find(p => p.plan.id === editingId) ?? null

  function handleSave(updated: PlanDetail) {
    setPlans(prev => prev.map(p => (p.plan.id === updated.plan.id ? updated : p)))
  }

  return (
    <div className="flex flex-col overflow-auto">
      <AdminHeader
        title="Subscription Plans"
        subtitle="Configure pricing, limits, and feature access per plan · demo data"
      />

      <main className="flex-1 p-6">
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          Showing sample plans. The subscription-plans API is not yet implemented in
          kalnostics-new, so edits here are not saved.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map(detail => (
            <PlanCard
              key={detail.plan.id}
              detail={detail}
              onEdit={() => setEditingId(detail.plan.id)}
            />
          ))}
        </div>
      </main>

      {editingDetail && (
        <EditDrawer
          detail={editingDetail}
          onSave={handleSave}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  )
}
