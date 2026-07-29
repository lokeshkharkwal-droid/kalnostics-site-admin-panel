import type { ReactNode } from 'react'
import { Card as BaseCard, CardHeader as BaseCardHeader, CardTitle } from '@/shared/ui'

/**
 * Compatibility shim for the ported Advance PDF module. The ported code uses
 * `<CardHeader title="…" />` (a `title` prop), whereas the repo's `CardHeader`
 * takes children; this adapter bridges the two while reusing the real `Card`.
 */
export const Card = BaseCard

export function CardHeader({ title }: { title: ReactNode }) {
  return (
    <BaseCardHeader>
      <CardTitle>{title}</CardTitle>
    </BaseCardHeader>
  )
}
