/** Format an ISO date as "DD Mon YYYY" (e.g. 05 Jun 2026). Returns null for empty. */
export function formatBusinessDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/** Generate a URL slug from a business name (lowercase, dash-separated, alnum). */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
