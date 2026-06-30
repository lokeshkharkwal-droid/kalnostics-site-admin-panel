import type { IStatCardProps } from '../interfaces'

/** Flat, Notion-style metric card used on the dashboard overview. */
export function StatCard({ label, value, sub, tint, icon, delay = '0ms' }: IStatCardProps) {
  return (
    <div
      className="animate-fade-in-up rounded-lg border border-notion-line bg-white p-4 transition-colors hover:bg-notion-panel"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${tint}`}>
          {icon}
        </span>
        <p className="text-xs font-medium text-notion-sub">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-notion-text">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-notion-faint">{sub}</p>}
    </div>
  )
}
