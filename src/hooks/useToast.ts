'use client'

import { toast as sonnerToast } from 'sonner'

/**
 * Compatibility shim for the ported Advance PDF module, which was written
 * against a `useToast()` hook returning `{ toast, toasts, dismiss }`. This repo
 * uses Sonner (a `<Toaster/>` is mounted globally in `QueryProvider`), so we
 * back `toast(message, kind)` onto Sonner and expose no-op `toasts`/`dismiss`
 * (the visible outlet is global — see `components/ui/Toast`).
 */
export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export function useToast() {
  const toast = (message: string, kind: ToastKind = 'info') => {
    if (kind === 'success') sonnerToast.success(message)
    else if (kind === 'error') sonnerToast.error(message)
    else if (kind === 'warning') sonnerToast.warning(message)
    else sonnerToast(message)
  }
  return { toast, toasts: [] as unknown[], dismiss: (_id?: unknown) => {} }
}
