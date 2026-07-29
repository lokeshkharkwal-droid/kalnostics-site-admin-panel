import type { ReactNode } from 'react'
import { Badge as BaseBadge } from '@/shared/ui'

/**
 * Compatibility shim for the ported Advance PDF module, which uses
 * `<Badge label="…" variant="green|gray|blue" />`. The repo's Badge takes
 * `children` + a different variant vocabulary, so this adapter maps between
 * them while reusing the real component's styling.
 */
const VARIANT_MAP = {
  green: 'success',
  gray: 'default',
  blue: 'primary',
  red: 'danger',
  amber: 'warning',
} as const

export function Badge({
  label,
  variant = 'gray',
}: {
  label: ReactNode
  variant?: keyof typeof VARIANT_MAP
}) {
  return <BaseBadge variant={VARIANT_MAP[variant]}>{label}</BaseBadge>
}
