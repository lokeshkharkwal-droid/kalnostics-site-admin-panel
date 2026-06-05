'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState } from 'react'

/**
 * Wraps the app with TanStack Query's QueryClientProvider.
 * Client component — cannot live in the root server layout directly.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create one QueryClient per user session (not a module-level singleton)
  // so server-side rendering doesn't share state between requests.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,           // 30s — treat data as fresh for 30s
        retry: 1,                    // retry once on failure
        refetchOnWindowFocus: false, // don't auto-refetch when tab is focused
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/*
        App-wide toast outlet (Sonner). Mounted here in the client provider so
        any component can fire toasts via `import { toast } from 'sonner'`, and
        so the axios interceptor in lib/api.ts can toast every API result.

        We intentionally do NOT pass custom `classNames` here. Sonner injects its
        own (unlayered) stylesheet, which outranks Tailwind's layered utilities —
        so hand-rolled Tailwind classes silently lose and produce a half-styled,
        easy-to-miss toast. `richColors` instead gives proper, high-contrast
        success (green) / error (red) snackbars out of the box.
      */}
      <Toaster position="top-right" theme="light" richColors closeButton />

    </QueryClientProvider>
  )
}
