'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui'
import { copyToClipboard } from '@/shared/utils'
import type { ICredentialsCardProps } from '../interfaces'

/** One-time credentials modal shown after a business is created. */
export function CredentialsCard({ creds, onDone }: ICredentialsCardProps) {
  const [copied, setCopied] = useState<'phone' | 'password' | null>(null)

  async function handleCopy(text: string, field: 'phone' | 'password') {
    const ok = await copyToClipboard(text)
    if (!ok) return
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-notion-line bg-white shadow-xl">
        <div className="px-5 py-4 border-b border-notion-line">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <h2 className="text-sm font-semibold text-notion-text">Business Created</h2>
          </div>
          <p className="text-xs text-notion-sub">
            Share these credentials with <strong>{creds.businessName}</strong> admin.
            The password is shown only once — copy it now.
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Phone */}
          <div className="rounded-lg bg-notion-panel border border-notion-line px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-notion-sub mb-0.5">Login Phone</p>
              <p className="font-mono text-sm font-semibold text-notion-text">{creds.adminPhone}</p>
            </div>
            <button
              onClick={() => void handleCopy(creds.adminPhone, 'phone')}
              className="shrink-0 text-xs text-notion-blue hover:text-notion-bluedk font-medium"
            >
              {copied === 'phone' ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Password */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-amber-700 mb-0.5">Temp Password</p>
              <p className="font-mono text-base font-bold tracking-widest text-notion-text">{creds.tempPassword}</p>
            </div>
            <button
              onClick={() => void handleCopy(creds.tempPassword, 'password')}
              className="shrink-0 text-xs text-notion-blue hover:text-notion-bluedk font-medium"
            >
              {copied === 'password' ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-notion-faint text-center">
            Admin can change this password after first login.
          </p>
        </div>

        <div className="border-t border-notion-line px-5 py-3">
          <Button variant="primary" className="w-full" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
