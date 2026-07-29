/** @type {import('next').NextConfig} */

// ── Base path ───────────────────────────────────────────────────────────
// This app is served under `/admin` behind Nginx (see deployment-guide.md).
// basePath is baked into the build so every Next-generated URL (assets,
// <Link>, router.push, redirect(), _next/*) is prefixed with `/admin`.
//
// It is read from an env var so a developer can opt out (run at the root)
// with `NEXT_PUBLIC_BASE_PATH=` — otherwise it defaults to `/admin`, which
// matches production. An empty string means "serve at root" (basePath is
// then omitted entirely, because Next rejects `basePath: ''`).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/admin'

const nextConfig = {
  // Serve everything under `/admin` when a basePath is configured.
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),

  // ── Trailing-slash safety behind the reverse proxy ──────────────────
  // Nginx canonicalises the bare `/admin` to `/admin/` (a 301). With Next's
  // default behaviour, a request for `/admin/` is 308-redirected back to
  // `/admin` (trailing slash stripped) — which Nginx then 301s to `/admin/`
  // again: an infinite redirect loop. Disabling Next's own trailing-slash
  // redirect makes it serve `/admin/` (and `/admin`) directly, so the loop
  // can never form regardless of how the proxy normalises the path.
  skipTrailingSlashRedirect: true,

  // ── Bundle / dev-compile optimisation ─────────────────────────────
  // Rewrites barrel imports (e.g. `import { motion } from 'framer-motion'`)
  // into direct deep imports so webpack only pulls the modules actually used.
  // This meaningfully cuts on-demand route compile time in `next dev` and
  // shrinks the production bundle for these large packages.
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'sonner',
    ],
  },

  // ── API proxy (development only) ───────────────────────────────────
  // In development, proxy /api calls to the kalnostics-new NestJS backend so
  // the browser stays same-origin (no CORS) while the frontend runs on :3001
  // and the backend on :3000.
  //
  // `basePath: false` keeps the matched path at the origin root (`/api/...`),
  // NOT `/admin/api/...`. The Axios client calls same-origin `/api/v1/*`, so
  // without this the rewrite would never match once basePath is set.
  //
  // In production this rewrite is inert: Nginx routes `/api/v1/*` straight to
  // the backend, and the browser hits it directly.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL ?? 'http://localhost:3000'}/api/:path*`,
        basePath: false,
      },
    ]
  },

  // ── Environment variables exposed to the browser ──────────────────
  // Leave NEXT_PUBLIC_API_URL empty so Axios issues same-origin /api/v1/*
  // requests (Nginx proxies them to the backend in prod, the rewrite above
  // proxies them in dev). NEXT_PUBLIC_BASE_PATH is exposed so client code
  // that must build absolute paths itself (e.g. `window.location`) can
  // prefix the basePath — Next only auto-prefixes <Link>/router/redirect().
  env: {
    NEXT_PUBLIC_APP_NAME:  process.env.APP_NAME ?? 'Kalnostics',
    NEXT_PUBLIC_APP_URL:   process.env.APP_URL  ?? 'http://localhost:3001',
    NEXT_PUBLIC_API_URL:   process.env.NEXT_PUBLIC_API_URL ?? '',
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
}

module.exports = nextConfig
