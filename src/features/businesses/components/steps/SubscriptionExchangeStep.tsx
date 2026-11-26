'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Toggle } from '@/shared/ui'
import type { IRegisterToggles } from '../../interfaces'

interface Props {
  toggles: IRegisterToggles
  setToggles: Dispatch<SetStateAction<IRegisterToggles>>
  disabled: boolean
}

/** One toggle row with a label + description. */
function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-notion-line2 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-notion-text">{title}</p>
        <p className="text-xs text-notion-faint">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

/** Wizard step 3 — choose which external registrations run after the business is created. */
export function SubscriptionExchangeStep({ toggles, setToggles, disabled }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-notion-sub">Subscription &amp; Exchange</p>
      <p className="text-sm text-notion-sub">
        After the business is created it can be registered on the external servers. These run
        best-effort — if a server is unreachable the business is still created and the failed
        step is reported on the next screen.
      </p>
      <ToggleRow
        title="Register on Exchange server"
        description="Lets the Exchange track this business's SMS / Email / WhatsApp usage."
        checked={toggles.registerExchange}
        onChange={v => setToggles(t => ({ ...t, registerExchange: v }))}
        disabled={disabled}
      />
      <ToggleRow
        title="Register on Subscription server"
        description="Registers the subscription client so a plan and bills can be managed. A plan can be assigned on the next screen."
        checked={toggles.registerSubscription}
        onChange={v => setToggles(t => ({ ...t, registerSubscription: v }))}
        disabled={disabled}
      />
    </div>
  )
}
