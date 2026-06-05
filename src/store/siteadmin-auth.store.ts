import { create } from 'zustand'
import { decodeJwt } from '@/lib/utils'

export type SiteAdminRole = 'super_owner' | 'full_admin' | 'operations_admin' | 'content_admin'

/** Role hierarchy — higher index = more permissions */
const ROLE_LEVELS: Record<SiteAdminRole, number> = {
  content_admin:    1,
  operations_admin: 2,
  full_admin:       3,
  super_owner:      4,
}

/**
 * Normalise the role string coming from the backend. kalnostics-new emits
 * Prisma enum values in SCREAMING_SNAKE_CASE (e.g. "SUPER_OWNER"), but this UI
 * works in lower_snake_case ("super_owner") throughout. Lowercase on the way in.
 */
export function normalizeRole(role: string): SiteAdminRole {
  return String(role).toLowerCase() as SiteAdminRole
}

export interface SiteAdminUser {
  siteadmin_id: string
  email: string
  role: SiteAdminRole
}

interface SiteAdminAuthState {
  token: string | null
  user: SiteAdminUser | null

  /** Load token from localStorage on app boot */
  init: () => void

  /** Called after successful login API response */
  setToken: (token: string) => void

  /** Clear session */
  logout: () => void

  /** Check if the current user has at least the given role level */
  hasRole: (required: SiteAdminRole) => boolean
}

export const useSiteAdminAuthStore = create<SiteAdminAuthState>((set, get) => ({
  token: null,
  user: null,

  init() {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('siteadmin_token')
    if (!token) return

    const payload = decodeJwt<SiteAdminUser & { exp: number }>(token)
    if (!payload) return

    // Discard expired tokens immediately
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('siteadmin_token')
      return
    }

    set({ token, user: { siteadmin_id: payload.siteadmin_id, email: payload.email, role: normalizeRole(payload.role) } })
  },

  setToken(token: string) {
    localStorage.setItem('siteadmin_token', token)
    const payload = decodeJwt<SiteAdminUser>(token)
    if (payload) {
      set({ token, user: { siteadmin_id: payload.siteadmin_id, email: payload.email, role: normalizeRole(payload.role) } })
    }
  },

  logout() {
    localStorage.removeItem('siteadmin_token')
    set({ token: null, user: null })
  },

  hasRole(required: SiteAdminRole): boolean {
    const { user } = get()
    if (!user) return false
    return ROLE_LEVELS[user.role] >= ROLE_LEVELS[required]
  },
}))
