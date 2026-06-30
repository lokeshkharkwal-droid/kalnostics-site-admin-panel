import type { IReadFieldProps } from '../interfaces'

export function ReadField({ label, value }: IReadFieldProps) {
  return (
    <div>
      <p className="text-xs text-notion-sub mb-0.5">{label}</p>
      <p className="text-sm text-notion-text">{value || <span className="text-notion-faint">—</span>}</p>
    </div>
  )
}
