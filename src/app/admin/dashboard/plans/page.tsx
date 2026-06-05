'use client'

import { useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  MOCK_PLANS,
  type Plan,
  type PlanLimits,
  type PlanFeatureRow,
  type PlanDetail,
} from '@/lib/mock/plans'

// ── NOTE ────────────────────────────────────────────────────────────────────
// kalnostics-new has no subscription-plans API yet, so this screen runs off the
// in-memory fixture in `@/lib/mock/plans`. Edits update local React state only
// (they are NOT persisted). When the backend module lands, swap MOCK_PLANS for a
// React Query `useQuery` and replace the in-memory save with `api.patch` /
// `api.put` calls — the UI below does not otherwise need to change.

// ── Constants ─────────────────────────────────────────────────────────────────

const LIMIT_LABELS: Record<string, string> = {
  users:               'Staff Users',
  branches:            'Branches',
  analyzer_count:      'Analyzers',
  b2b_logins:          'B2B Logins',
  collection_centers:  'Collection Centers',
  training_sessions:   'Training Sessions',
  inventory_branches:  'Inventory Branches',
  support_level:       'Support Level',
}

const PLAN_COLOR: Record<string, string> = {
  standard: 'bg-notion-line text-notion-text',
  silver:   'bg-sky-100 text-notion-bluedk',
  gold:     'bg-amber-100 text-amber-700',
  platinum: 'bg-violet-100 text-violet-700',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatLimit(val: number | string): string {
  if (val === -1) return '∞'
  if (val === 0)  return '—'
  return String(val)
}

function formatPrice(plan: Plan): string {
  if (plan.isContactSales) return 'Contact Sales'
  return `₹${Number(plan.priceMonthly).toLocaleString('en-IN')}/mo`
}

// ── Edit Drawer ───────────────────────────────────────────────────────────────

function EditDrawer({
  detail,
  onSave,
  onClose,
}: {
  detail: PlanDetail
  onSave: (updated: PlanDetail) => void
  onClose: () => void
}) {
  const { plan, features } = detail

  const [tab, setTab]                   = useState<'pricing' | 'features'>('pricing')
  const [name, setName]                 = useState(plan.name)
  const [tagline, setTagline]           = useState(plan.tagline ?? '')
  const [priceMonthly, setPriceMonthly] = useState(String(plan.priceMonthly))
  const [priceYearly, setPriceYearly]   = useState(String(plan.priceYearly ?? ''))
  const [graceDays, setGraceDays]       = useState(String(plan.gracePeriodDays))
  const [isActive, setIsActive]         = useState(plan.isActive)
  const [isContactSales, setIsContactSales] = useState(plan.isContactSales)

  // Limits state — initialize from plan
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const l: Record<string, string> = {}
    for (const [k, v] of Object.entries(plan.limits)) {
      l[k] = String(v)
    }
    return l
  })

  // Features state
  const [featureState, setFeatureState] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {}
    for (const f of features) s[f.featureKey] = f.isIncluded
    return s
  })

  function handleSave() {
    // Build the updated PlanDetail entirely client-side (dummy data, no API).
    const parsedLimits: PlanLimits = { ...plan.limits }
    for (const key of Object.keys(parsedLimits) as (keyof PlanLimits)[]) {
      const raw = limits[key]
      if (key === 'support_level') {
        parsedLimits.support_level = raw ?? plan.limits.support_level
      } else {
        parsedLimits[key] = raw === '' || raw === undefined ? 0 : Number(raw)
      }
    }

    const updated: PlanDetail = {
      plan: {
        ...plan,
        name: name.trim() || plan.name,
        tagline: tagline.trim() || null,
        priceMonthly: priceMonthly ? Number(priceMonthly) : plan.priceMonthly,
        priceYearly: priceYearly ? Number(priceYearly) : null,
        gracePeriodDays: graceDays ? Number(graceDays) : plan.gracePeriodDays,
        isActive,
        isContactSales,
        limits: parsedLimits,
      },
      features: features.map(f => ({ ...f, isIncluded: featureState[f.featureKey] ?? false })),
    }
    onSave(updated)
    onClose()
  }

  // Group features by category
  const categories = Array.from(new Set(features.map(f => f.category ?? 'other'))).sort()
  const byCategory: Record<string, PlanFeatureRow[]> = {}
  for (const f of features) {
    const cat = f.category ?? 'other'
    byCategory[cat] = byCategory[cat] ?? []
    byCategory[cat].push(f)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-notion-line px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_COLOR[plan.key] ?? 'bg-notion-line text-notion-text'}`}>
                {plan.key}
              </span>
              <h2 className="text-base font-semibold text-notion-text">{plan.name}</h2>
            </div>
            <p className="text-xs text-notion-faint mt-0.5">Edit plan configuration · demo data (not persisted)</p>
          </div>
          <button onClick={onClose} className="text-notion-faint hover:text-notion-sub">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-notion-line px-6">
          {(['pricing', 'features'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-1 mr-6 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
                tab === t
                  ? 'border-notion-blue text-notion-blue'
                  : 'border-transparent text-notion-sub hover:text-notion-text'
              }`}
            >
              {t === 'pricing' ? 'Pricing & Limits' : 'Features'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {tab === 'pricing' && (
            <>
              {/* Meta */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-faint">Plan Info</h3>
                <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
                <Input label="Tagline" value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Short marketing description" />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-notion-text cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-notion-text cursor-pointer">
                    <input type="checkbox" checked={isContactSales} onChange={e => setIsContactSales(e.target.checked)} className="rounded" />
                    Contact Sales (hide price)
                  </label>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-faint">Pricing (INR)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Monthly price" value={priceMonthly} onChange={e => setPriceMonthly(e.target.value)} type="number" min="0" />
                  <Input label="Yearly price" value={priceYearly} onChange={e => setPriceYearly(e.target.value)} type="number" min="0" placeholder="optional" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Grace period (days)" value={graceDays} onChange={e => setGraceDays(e.target.value)} type="number" min="0" />
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-faint">
                  Limits <span className="font-normal text-notion-line2 normal-case">(-1 = unlimited, 0 = not included)</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(limits).map(([key, val]) => (
                    key === 'support_level' ? (
                      <div key={key}>
                        <label className="block text-xs font-medium text-notion-sub mb-1">{LIMIT_LABELS[key] ?? key}</label>
                        <select
                          value={val}
                          onChange={e => setLimits(prev => ({ ...prev, [key]: e.target.value }))}
                          className="h-9 w-full rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
                        >
                          <option value="call_whatsapp">Call & WhatsApp</option>
                          <option value="24_7_all">24/7 All Channels</option>
                        </select>
                      </div>
                    ) : (
                      <Input
                        key={key}
                        label={LIMIT_LABELS[key] ?? key}
                        value={val}
                        onChange={e => setLimits(prev => ({ ...prev, [key]: e.target.value }))}
                        type="number"
                      />
                    )
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'features' && (
            <div className="space-y-6">
              {categories.map(cat => (
                <div key={cat}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-notion-faint mb-2 capitalize">{cat}</h3>
                  <div className="space-y-1">
                    {(byCategory[cat] ?? []).map(f => (
                      <label key={f.featureKey} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-notion-panel cursor-pointer">
                        <input
                          type="checkbox"
                          checked={featureState[f.featureKey] ?? false}
                          onChange={e => setFeatureState(prev => ({ ...prev, [f.featureKey]: e.target.checked }))}
                          className="h-4 w-4 rounded accent-notion-blue"
                        />
                        <span className="text-sm text-notion-text flex-1">{f.label}</span>
                        <span className="text-[10px] font-mono text-notion-line2">{f.featureKey}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-notion-line px-6 py-4 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </>
  )
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  detail,
  onEdit,
}: {
  detail: PlanDetail
  onEdit: () => void
}) {
  const { plan, features } = detail
  const includedCount = features.filter(f => f.isIncluded).length
  const totalCount    = features.length

  const keyLimits = ['users', 'branches', 'analyzer_count', 'collection_centers'] as const

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_COLOR[plan.key] ?? 'bg-notion-line text-notion-text'}`}>
                {plan.key}
              </span>
              {!plan.isActive && (
                <Badge variant="default">Inactive</Badge>
              )}
              {plan.planCategory === 'listing' && (
                <Badge variant="info">Listing</Badge>
              )}
            </div>
            <h3 className="text-base font-semibold text-notion-text">{plan.name}</h3>
            {plan.tagline && (
              <p className="text-xs text-notion-faint mt-0.5 line-clamp-2">{plan.tagline}</p>
            )}
          </div>
          <button
            onClick={onEdit}
            className="ml-2 shrink-0 flex items-center gap-1 rounded-lg border border-notion-line px-3 py-1.5 text-xs font-medium text-notion-sub hover:bg-notion-panel transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit
          </button>
        </div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-notion-text">{formatPrice(plan)}</p>
          {plan.priceYearly && (
            <p className="text-xs text-notion-faint">₹{Number(plan.priceYearly).toLocaleString('en-IN')}/yr available</p>
          )}
        </div>

        {/* Key limits */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {keyLimits.map(key => (
            <div key={key} className="rounded-lg bg-notion-panel px-3 py-2">
              <p className="text-[10px] text-notion-faint uppercase tracking-wide">{LIMIT_LABELS[key]}</p>
              <p className="text-sm font-semibold text-notion-text">{formatLimit(plan.limits[key])}</p>
            </div>
          ))}
        </div>

        {/* Feature summary */}
        <div className="flex items-center justify-between text-xs text-notion-sub">
          <span>{includedCount} / {totalCount} features enabled</span>
          <span className="text-notion-faint">{plan.gracePeriodDays}d grace period</span>
        </div>

        {/* Feature bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-notion-line overflow-hidden">
          <div
            className="h-full rounded-full bg-notion-blue transition-all"
            style={{ width: totalCount ? `${(includedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlansPage() {
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
