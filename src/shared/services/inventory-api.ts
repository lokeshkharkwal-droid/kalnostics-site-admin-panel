import axios from 'axios'
import { toast } from 'sonner'

/**
 * Axios instance for the **inventory backend** (a separate service from the main
 * Kalnostics API). SiteAdmin manages the global master-product catalogue here.
 *
 * - Always attaches the `siteadmin_token` (the inventory backend validates it
 *   via its `'jwt-siteadmin'` strategy — shared `JWT_SECRET`).
 * - Unwraps the same `{ success, data, meta }` envelope the main api uses, and
 *   shows the same success/error snackbars.
 *
 * Base URL comes from `NEXT_PUBLIC_INVENTORY_API_URL` (e.g. http://localhost:3100).
 */
export const inventoryApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_INVENTORY_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

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

function extractErrorMessage(error: any): string {
  if (!error?.response) {
    return error?.code === 'ECONNABORTED'
      ? 'Request timed out. Please try again.'
      : 'Network error — please check your connection.'
  }
  const data = error.response.data
  const raw =
    data?.error?.message ?? data?.message ?? 'Something went wrong. Please try again.'
  return Array.isArray(raw) ? raw[0] : String(raw)
}

inventoryApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('siteadmin_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

inventoryApi.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'data' in res.data) {
      if (res.data.meta) (res as any).meta = res.data.meta
      res.data = res.data.data
    }
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
    const isAuthExpired = status === 401 && typeof window !== 'undefined'
    if (isAuthExpired) {
      // A rejected SiteAdmin token on the inventory backend → session is invalid.
      localStorage.removeItem('siteadmin_token')
      window.location.href = `${BASE_PATH}/login`
    }
    if (typeof window !== 'undefined' && !isAuthExpired && !error.config?.skipErrorToast) {
      toast.error(extractErrorMessage(error))
    }
    return Promise.reject(error)
  },
)
