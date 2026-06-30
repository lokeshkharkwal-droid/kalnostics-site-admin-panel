'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useSiteAdminAuthStore } from '@/store'
import { Button, Input, PasswordInput } from '@/shared/ui'
import { login } from '../services/auth.api'

export function LoginPage() {
  const router = useRouter()
  const { setToken, token, init } = useSiteAdminAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (token) router.replace('/dashboard')
  }, [token, router])

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken }) => {
      setToken(accessToken)
      router.push('/dashboard')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error?.message ?? 'Invalid credentials'
      setFormError(Array.isArray(msg) ? msg[0] : msg)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!email.trim()) { setFormError('Email is required'); return }
    if (!password)     { setFormError('Password is required'); return }
    loginMutation.mutate({ email: email.trim(), password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-notion-sidebar px-4">
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-notion-text text-base font-bold text-white">
            K
          </div>
          <h1 className="text-lg font-semibold text-notion-text">Kalnostics Admin</h1>
          <p className="mt-1 text-sm text-notion-faint">Sign in to manage the platform</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-notion-line bg-white p-6 shadow-notion">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => { setEmail(e.target.value); setFormError('') }}
              placeholder="admin@kalnostics.com"
              disabled={loginMutation.isPending}
            />

            <PasswordInput
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFormError('') }}
              placeholder="••••••••"
              disabled={loginMutation.isPending}
            />

            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-notion-red/30 bg-[#fbeceb] px-3 py-2 text-sm text-[#c0392b]">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {formError}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loginMutation.isPending}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-notion-faint">
          Kalnostics · Admin access only
        </p>
      </div>
    </div>
  )
}
