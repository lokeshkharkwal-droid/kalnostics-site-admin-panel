'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { SupportInfoForm } from '@/features/support-info'

/** Edit by default; `?mode=view` opens the record read-only. */
export default function Page() {
  const params = useParams<{ id: string }>()
  const mode = useSearchParams().get('mode') === 'view' ? 'view' : 'edit'
  return <SupportInfoForm mode={mode} id={params.id} />
}
