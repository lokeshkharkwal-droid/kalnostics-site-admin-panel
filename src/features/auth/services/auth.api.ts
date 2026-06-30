import { api } from '@/shared/services/api'
import type { ILoginCredentials, ILoginResponse } from '../interfaces'

/** Authenticate a SiteAdmin with email + password and return the access token. */
export async function login(credentials: ILoginCredentials): Promise<ILoginResponse> {
  const res = await api.post<ILoginResponse>(
    '/api/v1/siteadmin/auth/login',
    credentials,
    { successMessage: 'Signed in' },
  )
  return res.data
}
