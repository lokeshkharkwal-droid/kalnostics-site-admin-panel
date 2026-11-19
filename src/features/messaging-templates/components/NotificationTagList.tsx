'use client'

import { useQuery } from '@tanstack/react-query'
import { cn } from '@/shared/utils'
import { listNotificationTags } from '../services/messaging-templates.api'

/**
 * The GLOBAL notification tag catalogue (`GET /siteadmin/templates/tags`),
 * grouped, as clickable chips. Every tag works in every messaging template —
 * any channel, any feature — and renders blank when a message has no data for
 * it. Clicking a chip calls `onInsert("{tag}")`.
 */
export function NotificationTagList({
  onInsert,
  className,
}: {
  onInsert: (token: string) => void
  className?: string
}) {
  const { data: groups = [], isLoading, isError } = useQuery({
    queryKey: ['siteadmin-notification-tags'],
    queryFn: listNotificationTags,
    staleTime: 30 * 60_000,
  })

  return (
    <div className={cn('space-y-1.5 rounded-md bg-notion-panel p-2 text-xs text-notion-sub', className)}>
      <p>
        <span className="font-medium text-notion-text">Available tags</span> — work in every
        template; a tag with no data for a message is left blank. Click a tag to insert it.
      </p>
      {isLoading && <p className="text-notion-faint">Loading tags…</p>}
      {isError && <p className="text-notion-red">Could not load the tag list.</p>}
      {groups.map((g) => (
        <div key={g.label} className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[10px] uppercase tracking-wide text-notion-faint">{g.label}</span>
          {g.tags.map((t) => {
            const token = `{${t.key}}`
            const hint = `${t.label} — ${t.description}`
            return (
              <button
                key={t.key}
                type="button"
                title={hint}
                aria-label={`Insert ${token}: ${hint}`}
                onClick={() => onInsert(token)}
                className="rounded bg-notion-blue/10 px-1.5 py-0.5 font-mono text-[10px] text-notion-blue hover:bg-notion-blue/20"
              >
                {token}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
