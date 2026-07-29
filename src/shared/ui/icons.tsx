/* Shared inline-SVG icon set (no external icon dependency). All inherit
   `currentColor`. Mirrors the per-feature icon style used elsewhere. */

type IconProps = { className?: string }
const base = (className = 'h-4 w-4') => ({
  className,
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  viewBox: '0 0 24 24',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const PlusIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M12 5v14M5 12h14" /></svg>
)
export const EyeIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
)
export const PencilIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
)
export const TrashIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" /></svg>
)
export const SearchIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
)
export const ChevronLeftIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M15 18l-6-6 6-6" /></svg>
)
export const ChevronRightIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M9 18l6-6-6-6" /></svg>
)
export const CloseIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M6 18L18 6M6 6l12 12" /></svg>
)
export const CopyIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
)
