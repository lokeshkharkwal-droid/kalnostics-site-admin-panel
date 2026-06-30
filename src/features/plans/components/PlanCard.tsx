'use client'

import { Card, CardContent, Badge } from '@/shared/ui'
import { LIMIT_LABELS, PLAN_COLOR, formatLimit, formatPrice } from '@/entities/plan'
import type { IPlanCardProps } from '../interfaces'

export function PlanCard({ detail, onEdit }: IPlanCardProps) {
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
