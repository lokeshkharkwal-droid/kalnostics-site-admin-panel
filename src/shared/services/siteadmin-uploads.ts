import { api } from '@/shared/services/api'

/** SiteAdmin image/attachment upload (tenant-less; S3-backed). */
const UPLOAD_URL = '/api/v1/siteadmin/uploads/attachment'

/**
 * Upload a single file to S3 via the SiteAdmin upload endpoint and return its
 * public URL. Mirrors `uploadTemplateImage`: multipart form (field `file`),
 * no success toast — the caller reports its own feedback. The request
 * interceptor on the main `api` client attaches the `siteadmin_token` for
 * `/api/v1/siteadmin/*` paths and unwraps the envelope so `res.data` is `{ url }`.
 *
 * @param file - the file to upload.
 * @returns the resolved public URL of the uploaded file.
 */
export async function uploadSiteAdminImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await api.post<{ url: string }>(UPLOAD_URL, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipSuccessToast: true,
  })
  return res.data.url
}
