'use client'

import { useState } from 'react'
import { Button, Input } from '@/shared/ui'
import { type PlanLimits, type PlanFeatureRow, type PlanDetail, LIMIT_LABELS, PLAN_COLOR } from '@/entities/plan'
import type { IEditDrawerProps } from '../interfaces'

export function EditDrawer({ detail, onSave, onClose }: IEditDrawerProps) {
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
