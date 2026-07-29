'use client'

/**
 * Compatibility shim for the ported Advance PDF module. The real toast outlet
 * is Sonner's `<Toaster/>`, mounted once globally in `QueryProvider`, so this
 * container renders nothing — it exists only so the ported components can keep
 * their `<ToastContainer toasts={…} onDismiss={…} />` JSX unchanged.
 */
export function ToastContainer(_props: {
  toasts?: unknown[]
  onDismiss?: (id: unknown) => void
}) {
  return null
}
