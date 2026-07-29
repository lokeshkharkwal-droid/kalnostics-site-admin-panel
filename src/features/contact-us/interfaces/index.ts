/**
 * One contact-us submission row as returned by
 * `GET /api/v1/siteadmin/contact-us`. The backend projects `companyName` →
 * `organization` and `createdAt` → `createdOn`, and includes the full `message`
 * so the View modal needs no extra fetch.
 */
export interface ContactSubmissionRow {
  id: string
  name: string
  organization: string
  mobileNumber: string
  email: string
  message: string
  createdOn: string
}

/** Query params for the SiteAdmin contact-us list (all optional except pagination). */
export interface IContactListParams {
  page: number
  limit: number
  search?: string
  from?: string
  to?: string
}

/** Normalised list result (pagination hoisted out of the `meta` envelope). */
export interface IContactListResult {
  rows: ContactSubmissionRow[]
  total: number
  totalPages: number
}
