# kalnostics-fe

SiteAdmin console for the **kalnostics-new** backend. A Next.js 14 (App Router)
app ported from `kaltros-master/apps/web`, trimmed to four features:

| Feature | Route | Data source |
| --- | --- | --- |
| **Dashboard** | `/admin/dashboard` | Live — `GET /api/v1/siteadmin/tenants` |
| **Businesses** | `/admin/dashboard/businesses` (+ `/[id]`) | Live — tenant CRUD endpoints |
| **Subscription Plans** | `/admin/dashboard/plans` | **Dummy data** (`src/lib/mock/plans.ts`) — no backend yet |
| **Admin Users** | `/admin/dashboard/admins` | Live — `siteadmin/users` endpoints |

## Stack

- Next.js 14 + React 18 + TypeScript (strict)
- Tailwind CSS, Zustand (auth), TanStack React Query (data), Axios

## Getting started

```bash
npm install
cp .env.example .env   # already present for local dev
npm run dev            # http://localhost:3001
```

The kalnostics-new backend must be running on **http://localhost:3000**
(`API_URL` in `.env`). The dev server proxies all `/api/*` requests to it
(see `next.config.js` → `rewrites`), so the browser stays same-origin and **no
CORS configuration is required** on the backend.

Sign in at `/admin/login` with a SiteAdmin account from kalnostics-new.

## How auth works

- Login posts to `POST /api/v1/siteadmin/auth/login`; the returned `accessToken`
  is stored in `localStorage['siteadmin_token']`.
- `src/lib/api.ts` attaches it as `Authorization: Bearer …` on every
  `/api/v1/siteadmin/*` request and unwraps the `{ success, data, meta }`
  envelope. A `401` clears the token and redirects to `/admin/login`.
- The Zustand store decodes the JWT for `role`-based nav gating. Role hierarchy:
  `content_admin < operations_admin < full_admin < super_owner`.

## Notes / divergences from the source

- **Subscription Plans** is demo-only. kalnostics-new exposes no
  subscription-plan API (just `subscriptionPlanId`/`subscriptionStatus` on the
  Tenant model), so the page runs off `src/lib/mock/plans.ts` and edits are not
  persisted. When the backend lands, replace the fixture with a React Query
  `useQuery` and restore `api.patch`/`api.put` saves (see the comments in
  `app/admin/dashboard/plans/page.tsx`).
- **Admin Users** endpoints were aligned to the live backend:
  `PATCH /siteadmin/users/:id/deactivate` and
  `PATCH /siteadmin/users/:id/password`. These require the `siteadmin:manage`
  permission (**super_owner**), so the "Admin Users" nav item is gated to
  super_owner. The source app's "Auth Roles" sub-page was dropped (no
  `user-roles` resource exists in kalnostics-new).
- Unused source dependencies (Tiptap, jsbarcode, dayjs) and all non-ported
  pages/components were left out.
