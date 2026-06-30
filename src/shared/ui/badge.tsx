import { cn } from '@/shared/utils'

// Notion-style tags: soft warm/tinted fills with darker text, no borders.
const variants = {
  default:     'bg-notion-hover text-notion-sub',
  secondary:   'bg-notion-hover text-notion-faint',
  primary:     'bg-blue-50 text-notion-blue',
  success:     'bg-[#edf5ee] text-[#448361]',
  warning:     'bg-[#faf3dd] text-[#9f6b1f]',
  danger:      'bg-[#fbeceb] text-[#c0392b]',
  destructive: 'bg-[#fbeceb] text-[#c0392b]',
  info:        'bg-[#e7f3f8] text-[#337ea9]',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium capitalize',
      variants[variant],
      className,
    )}>
      {children}
    </span>
  )
}
