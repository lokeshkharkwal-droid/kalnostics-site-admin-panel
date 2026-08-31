/* Minimal inline-SVG icon set (no external icon dependency, matching the
   sidebar's hand-rolled SVG approach). All inherit `currentColor`. */

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
export const PencilIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
)
export const TrashIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" /></svg>
)
export const StarIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21l1.1-6.5L2.6 9.8l6.5-.9L12 3z" /></svg>
)
export const PowerIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M12 2v10M18.4 6.6a9 9 0 11-12.8 0" /></svg>
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
export const GearIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)
export const ChevronUpIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M18 15l-6-6-6 6" /></svg>
)
export const FlaskIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M9 3h6M10 3v6l-5.5 9.5A1 1 0 005.36 20h13.28a1 1 0 00.86-1.5L14 9V3M7.5 15h9" /></svg>
)
export const SigmaIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M17 5H6l6 7-6 7h11" /></svg>
)
export const RulerIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M3 8l8-5 10 10-8 5L3 8z" /><path d="M11.5 6.5L13 8M9 9l1.5 1.5M6.5 11.5L8 13M14 4l1.5 1.5" /></svg>
)
export const NotesIcon = ({ className }: IconProps) => (
  <svg {...base(className)}><path d="M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
)
