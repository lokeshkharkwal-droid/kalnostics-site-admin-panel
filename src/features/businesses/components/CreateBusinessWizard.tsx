'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal, Button } from '@/shared/ui'
import {
  changeTenantSubscriptionPlan,
  createTenant,
  getTenantSubscriptionPlans,
  registerTenantWithExchange,
  registerTenantWithSubscription,
} from '../services/businesses.api'
import type {
  ICreateBusinessModalProps,
  ICreateTenantForm,
  ICreatedCredentials,
  IRegisterToggles,
  IRunResults,
} from '../interfaces'
import { BusinessDetailsStep } from './steps/BusinessDetailsStep'
import { AdminAccountStep } from './steps/AdminAccountStep'
import { SubscriptionExchangeStep } from './steps/SubscriptionExchangeStep'
import { ReviewRunStep } from './steps/ReviewRunStep'

const EMPTY_FORM: ICreateTenantForm = {
  name: '', email: '', phoneCountryCode: '+91', phone: '',
  shortName: '', addressLine: '', pincode: '',
  country: null, state: null, city: null, area: null,
  logoUrl: '', photoUrl: '',
  timezone: 'Asia/Kolkata', currency: 'INR',
  adminFirstName: '', adminMiddleName: '', adminLastName: '', adminPhoneCountryCode: '+91', adminPhone: '', adminEmail: '',
  adminPassword: '',
}

const INIT_RESULTS: IRunResults = {
  create: { status: 'pending' },
  exchange: { status: 'pending' },
  subscription: { status: 'pending' },
  plan: { status: 'pending' },
}

const STEPS = ['Business', 'Admin', 'Subscription', 'Review']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Password policy (mirrors backend §5.3): min 8, ≥1 uppercase, ≥1 digit. */
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters long'
  if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter'
  if (!/[0-9]/.test(pw)) return 'Password must contain at least one number'
  return null
}

/** Pull a human-readable message out of an Axios/ApiError. */
function errMsg(e: unknown): string {
  const anyE = e as {
    response?: { data?: { message?: unknown; error?: { message?: unknown } } }
    message?: string
  }
  const m =
    anyE?.response?.data?.error?.message ??
    anyE?.response?.data?.message ??
    anyE?.message
  if (Array.isArray(m)) return String(m[0])
  return typeof m === 'string' ? m : 'Failed'
}

/**
 * Create-business wizard. Walks Business → Admin → Subscription & Exchange →
 * Review, then runs a sequential, best-effort registration: create the tenant,
 * then (per the toggles) register it on the Exchange and Subscription servers and
 * optionally assign a plan. The business is created even if the external steps
 * fail; each step's outcome is shown on the Review screen. Reuses the SiteAdmin
 * tenant endpoints (create + register-exchange + register-subscription).
 */
export function CreateBusinessWizard({ onClose, onCreated }: ICreateBusinessModalProps) {
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ICreateTenantForm>(EMPTY_FORM)
  const [adminEmailTouched, setAdminEmailTouched] = useState(false)
  const [toggles, setToggles] = useState<IRegisterToggles>({
    registerExchange: true,
    registerSubscription: true,
  })
  const [stepError, setStepError] = useState('')

  const [running, setRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [results, setResults] = useState<IRunResults>(INIT_RESULTS)
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null)
  const [creds, setCreds] = useState<ICreatedCredentials | null>(null)
  const [subscriptionRegistered, setSubscriptionRegistered] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')

  const plansQuery = useQuery({
    queryKey: ['siteadmin', 'tenant-subscription-plans', createdTenantId],
    queryFn: () => getTenantSubscriptionPlans(createdTenantId as string),
    enabled: !!createdTenantId && subscriptionRegistered,
  })

  const assignPlan = useMutation({
    mutationFn: (planId: string) => changeTenantSubscriptionPlan(createdTenantId as string, planId),
    onMutate: () => setResults(r => ({ ...r, plan: { status: 'running' } })),
    onSuccess: () => {
      setResults(r => ({ ...r, plan: { status: 'success' } }))
      qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
    },
    onError: e => setResults(r => ({ ...r, plan: { status: 'failed', message: errMsg(e) } })),
  })

  function onBusinessEmailChange(email: string) {
    setForm(f => ({ ...f, email, adminEmail: adminEmailTouched ? f.adminEmail : email }))
  }
  function onAdminEmailChange(email: string) {
    setAdminEmailTouched(true)
    setForm(f => ({ ...f, adminEmail: email }))
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!form.name.trim()) return 'Business name is required'
      if (!form.email.trim()) return 'Business email is required'
      if (!EMAIL_RE.test(form.email.trim())) return 'Enter a valid business email'
      if (!form.phone.trim()) return 'Business phone is required'
      if (!form.timezone) return 'Time zone is required'
      if (!form.currency) return 'Currency is required'
    }
    if (s === 2) {
      if (!form.adminFirstName.trim()) return 'First name is required'
      if (!form.adminLastName.trim()) return 'Last name is required'
      if (!form.adminEmail.trim()) return 'Login email is required'
      if (!EMAIL_RE.test(form.adminEmail.trim())) return 'Enter a valid login email'
      const pw = validatePassword(form.adminPassword)
      if (pw) return pw
    }
    return null
  }

  function handleNext() {
    const err = validateStep(step)
    if (err) { setStepError(err); return }
    setStepError('')
    setStep(s => Math.min(4, s + 1))
  }

  function handleClose() {
    if (!running) onClose()
  }

  function finish() {
    if (createdTenantId && creds) onCreated(creds)
    else onClose()
  }

  async function handleRun() {
    setRunning(true)
    setHasRun(true)
    setResults({ ...INIT_RESULTS, create: { status: 'running' } })

    let tenantId: string
    try {
      const res = await createTenant(form)
      tenantId = res.tenant.id
      setCreatedTenantId(res.tenant.id)
      setCreds({ adminPhone: res.adminPhone, password: form.adminPassword, businessName: res.tenant.name })
      setResults(r => ({ ...r, create: { status: 'success', message: res.tenant.name } }))
    } catch (e) {
      setResults(r => ({ ...r, create: { status: 'failed', message: errMsg(e) } }))
      setRunning(false)
      return
    }

    if (toggles.registerExchange) {
      setResults(r => ({ ...r, exchange: { status: 'running' } }))
      try {
        await registerTenantWithExchange(tenantId)
        setResults(r => ({ ...r, exchange: { status: 'success' } }))
      } catch (e) {
        setResults(r => ({ ...r, exchange: { status: 'failed', message: errMsg(e) } }))
      }
    } else {
      setResults(r => ({ ...r, exchange: { status: 'skipped' } }))
    }

    if (toggles.registerSubscription) {
      setResults(r => ({ ...r, subscription: { status: 'running' } }))
      try {
        await registerTenantWithSubscription(tenantId)
        setResults(r => ({ ...r, subscription: { status: 'success' } }))
        setSubscriptionRegistered(true)
      } catch (e) {
        setResults(r => ({ ...r, subscription: { status: 'failed', message: errMsg(e) } }))
      }
    } else {
      setResults(r => ({ ...r, subscription: { status: 'skipped' } }))
    }

    qc.invalidateQueries({ queryKey: ['siteadmin', 'tenants'] })
    setRunning(false)
  }

  const footer = hasRun ? (
    <Button size="sm" onClick={finish} disabled={running || assignPlan.isPending}>
      Done
    </Button>
  ) : (
    <>
      <Button variant="secondary" size="sm" onClick={handleClose} disabled={running}>
        Cancel
      </Button>
      {step > 1 && (
        <Button variant="secondary" size="sm" onClick={() => setStep(s => s - 1)} disabled={running}>
          Back
        </Button>
      )}
      {step < 4 ? (
        <Button size="sm" onClick={handleNext}>Next</Button>
      ) : (
        <Button size="sm" loading={running} onClick={handleRun}>Register Business</Button>
      )}
    </>
  )

  return (
    <Modal title="Create New Business" size="lg" onClose={handleClose} footer={footer}>
      <div className="space-y-4">
        {/* Step indicator */}
        <ol className="flex items-center gap-2 text-xs">
          {STEPS.map((label, i) => {
            const n = i + 1
            const active = n === step
            const done = n < step
            return (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={[
                    'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
                    active
                      ? 'border-notion-blue bg-notion-blue text-white'
                      : done
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-notion-line2 text-notion-faint',
                  ].join(' ')}
                >
                  {done ? '✓' : n}
                </span>
                <span className={active ? 'font-medium text-notion-text' : 'text-notion-faint'}>{label}</span>
                {n < STEPS.length && <span className="text-notion-line2">›</span>}
              </li>
            )
          })}
        </ol>

        {step === 1 && (
          <BusinessDetailsStep
            form={form}
            setForm={setForm}
            onBusinessEmailChange={onBusinessEmailChange}
            disabled={running}
          />
        )}
        {step === 2 && (
          <AdminAccountStep
            form={form}
            setForm={setForm}
            onAdminEmailChange={onAdminEmailChange}
            disabled={running}
          />
        )}
        {step === 3 && (
          <SubscriptionExchangeStep toggles={toggles} setToggles={setToggles} disabled={running} />
        )}
        {step === 4 && (
          <ReviewRunStep
            form={form}
            toggles={toggles}
            results={results}
            hasRun={hasRun}
            canAssignPlan={subscriptionRegistered}
            plans={plansQuery.data ?? []}
            plansLoading={plansQuery.isLoading}
            selectedPlanId={selectedPlanId}
            onSelectPlan={setSelectedPlanId}
            onAssignPlan={() => assignPlan.mutate(selectedPlanId)}
            assigningPlan={assignPlan.isPending}
          />
        )}

        {stepError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {stepError}
          </p>
        )}
      </div>
    </Modal>
  )
}
