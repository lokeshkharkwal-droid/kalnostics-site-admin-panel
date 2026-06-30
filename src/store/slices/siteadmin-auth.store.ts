import { create } from 'zustand'
import { decodeJwt } from '@/shared/utils'
import { normalizeRole, ROLE_LEVELS, type SiteAdminRole } from '@/entities/siteadmin-user'

export type { SiteAdminRole }

/** The SiteAdmin identity carried in the session (decoded from the JWT). */
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
