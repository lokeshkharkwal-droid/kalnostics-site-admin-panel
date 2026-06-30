import axios from 'axios'
import { toast } from 'sonner'

/**
 * Per-request toast controls. Augment Axios's config type so they're type-safe
 * at call sites — e.g. `api.post(url, body, { successMessage: 'Saved' })`.
 *
 *  - `skipErrorToast`   — suppress the automatic error snackbar.
 *  - `skipSuccessToast` — suppress the automatic success snackbar.
 *  - `successMessage`   — override the default success message for this call.
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    skipErrorToast?: boolean
    skipSuccessToast?: boolean
    successMessage?: string
  }
}

/** Default success snackbar copy by HTTP verb (used when no successMessage is given). */
function defaultSuccessMessage(method?: string): string {
  switch (method?.toLowerCase()) {
    case 'post':
      return 'Created successfully'
    case 'put':
    case 'patch':
      return 'Saved successfully'
    case 'delete':
      return 'Deleted successfully'
    default:
      return 'Done'
  }
}

/**
 * Pull a human-readable message out of a failed request, handling every shape
 * the backend can emit:
 *  - KaltrosException envelope: { success: false, error: { code, message } }
 *  - NestJS validation pipe:    { message: string | string[] }
 *  - no response at all (network/timeout) → generic fallback
 */
function extractErrorMessage(error: any): string {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'Request timed out. Please try again.'
      : 'Network error — please check your connection.'
  }
  const data = error.response.data
  const raw =
    data?.error?.message ?? // KaltrosException envelope
    data?.message ?? // NestJS validation pipe
    'Something went wrong. Please try again.'
  return Array.isArray(raw) ? raw[0] : String(raw)
}

/**
 * Base Axios instance for all API calls.
 * Reads the token from localStorage on each request so it always uses the latest value.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the correct token before every request
api.interceptors.request.use((config) => {
  // Determine which token to use based on the request path
  if (typeof window !== 'undefined') {
    const token = config.url?.startsWith('/api/v1/siteadmin')
      ? localStorage.getItem('siteadmin_token')
      : localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Unwrap the Kaltros response envelope { success, data, meta } → return data directly.
// Pagination meta (total, page, limit, totalPages) is preserved on res.meta so paginated
// list pages can read it as (r as any).meta.total without losing the count.
api.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      // Hoist meta before overwriting res.data
      if (res.data.meta) {
        ;(res as any).meta = res.data.meta
      }
      res.data = res.data.data
    }

    // Success snackbar for state-changing calls (POST/PUT/PATCH/DELETE). GETs are
    // skipped on purpose — toasting every list/detail fetch would spam the screen
    // on each page load and refetch. Opt out per-call with `skipSuccessToast`, or
    // pass a meaningful `successMessage`.
    if (typeof window !== 'undefined') {
      const method = res.config?.method?.toLowerCase()
      const isMutation = !!method && ['post', 'put', 'patch', 'delete'].includes(method)
      if (isMutation && !res.config?.skipSuccessToast) {
        toast.success(res.config?.successMessage ?? defaultSuccessMessage(method))
      }
    }

    return res
  },
  (error) => {
    const status = error.response?.status
    const url: string = error.config?.url ?? ''

    // A 401 from the LOGIN endpoint means "wrong credentials" — the user should
    // stay on the login page and see the error. A 401 from anything else means
    // an existing session token is invalid/expired → bounce to login. Without
    // this exclusion, a bad-password login would just silently reload the page.
    const isLoginRequest = url.includes('/auth/login')
    const isAuthRedirect = status === 401 && typeof window !== 'undefined' && !isLoginRequest

    if (isAuthRedirect) {
      if (url.startsWith('/api/v1/siteadmin')) {
        localStorage.removeItem('siteadmin_token')
        window.location.href = '/login'
      } else {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    // Surface the failure to the user as a snackbar. Skipped when:
    //  - we're already redirecting on a 401 (the page is navigating away), or
    //  - the caller opted out via `{ skipErrorToast: true }` (renders it inline).
    if (typeof window !== 'undefined' && !isAuthRedirect && !error.config?.skipErrorToast) {
      toast.error(extractErrorMessage(error))
    }

    return Promise.reject(error)
  },
)
