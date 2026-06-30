import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely — resolves conflicts (e.g. p-2 + p-4 → p-4) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Decode a JWT payload without verifying the signature (client-side only) */
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const base64Payload = token.split('.')[1]
    const payload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(payload) as T
  } catch {
    return null
  }
}

/** Format a date string to DD/MM/YYYY (platform default) */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
