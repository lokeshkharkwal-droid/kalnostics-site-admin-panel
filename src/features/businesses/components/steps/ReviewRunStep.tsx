'use client'

import { Button, Spinner } from '@/shared/ui'
import type { ISubscriptionPlan } from '../../services/businesses.api'
import type {
  ICreateTenantForm,
  IRegisterToggles,
  IRunResults,
  IRunStepKey,
  IRunStatus,
} from '../../interfaces'

interface Props {
  form: ICreateTenantForm
  toggles: IRegisterToggles
  results: IRunResults
  hasRun: boolean
  /** Subscription registration succeeded — a plan can be assigned. */
  canAssignPlan: boolean
  plans: ISubscriptionPlan[]
  plansLoading: boolean
  selectedPlanId: string
  onSelectPlan: (id: string) => void
  onAssignPlan: () => void
  assigningPlan: boolean
}

const STEP_LABELS: Record<IRunStepKey, string> = {
  create: 'Create business',
  exchange: 'Register on Exchange server',
  subscription: 'Register on Subscription server',
  plan: 'Assign subscription plan',
}

const STEP_ORDER: IRunStepKey[] = ['create', 'exchange', 'subscription', 'plan']

function StatusIcon({ status }: { status: IRunStatus }) {
  if (status === 'running') return <Spinner />
  if (status === 'success') return <span className="text-green-600">✓</span>
  if (status === 'failed') return <span className="text-red-600">✗</span>
  if (status === 'skipped') return <span className="text-notion-faint">—</span>
  return <span className="text-notion-line2">○</span>
}

/** Wizard step 4 — review the entered details, run the registration, see results. */
export function ReviewRunStep({
  form,
  toggles,
  results,
  hasRun,
  canAssignPlan,
  plans,
  plansLoading,
  selectedPlanId,
  onSelectPlan,
  onAssignPlan,
  assigningPlan,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-md border border-notion-line2 px-4 py-3 text-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-notion-sub">Review</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="text-notion-faint">Business</dt>
          <dd className="text-notion-text">{form.name || '—'}</dd>
          <dt className="text-notion-faint">Email / Phone</dt>
          <dd className="text-notion-text">
            {[form.email, form.phone].filter(Boolean).join(' / ') || '—'}
          </dd>
          <dt className="text-notion-faint">Admin</dt>
          <dd className="text-notion-text">
            {[form.adminFirstName, form.adminLastName].filter(Boolean).join(' ') || '—'}
          </dd>
          <dt className="text-notion-faint">Register on</dt>
          <dd className="text-notion-text">
            {[
              toggles.registerExchange ? 'Exchange' : null,
              toggles.registerSubscription ? 'Subscription' : null,
            ]
              .filter(Boolean)
              .join(', ') || 'None'}
          </dd>
        </dl>
      </div>

      {/* Per-step results */}
      {hasRun && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">Progress</p>
          {STEP_ORDER.map(key => {
            const step = results[key]
            if (step.status === 'pending' && (key === 'plan' || key === 'exchange' || key === 'subscription')) {
              // Hide not-yet-reached optional steps until they start.
              if (key === 'plan' && !canAssignPlan) return null
            }
            return (
              <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-notion-line2 px-3 py-2 text-sm">
                <span className="text-notion-text">{STEP_LABELS[key]}</span>
                <span className="flex items-center gap-2 text-right">
                  {step.message && (
                    <span className={step.status === 'failed' ? 'text-red-600' : 'text-notion-faint'}>
                      {step.message}
                    </span>
                  )}
                  <StatusIcon status={step.status} />
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Inline plan assignment — once the subscription is registered */}
      {canAssignPlan && (
        <div className="space-y-2 rounded-md border border-notion-line2 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">Assign a plan (optional)</p>
          {plansLoading ? (
            <div className="flex justify-center py-3"><Spinner /></div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-notion-faint">No plans available on the subscription server.</p>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedPlanId}
                onChange={e => onSelectPlan(e.target.value)}
                disabled={assigningPlan}
                className="h-9 flex-1 rounded-md border border-notion-line2 bg-white px-3 text-sm text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-blue"
              >
                <option value="">Select a plan…</option>
                {plans.map(p => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {p.title ?? p.slug ?? `Plan ${p.id}`}
                    {p.price != null ? ` — ${p.price}` : ''}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                loading={assigningPlan}
                disabled={!selectedPlanId}
                onClick={onAssignPlan}
              >
                Assign plan
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
