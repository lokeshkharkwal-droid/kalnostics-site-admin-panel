import type { ISectionTitleProps } from '../interfaces'

export function SectionTitle({ children }: ISectionTitleProps) {
  return (
    <h3 className="text-xs font-semibold text-notion-sub uppercase tracking-wide mb-3">
      {children}
    </h3>
  )
}
