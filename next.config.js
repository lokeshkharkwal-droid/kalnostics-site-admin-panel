/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── API proxy ─────────────────────────────────────────────────────
  // In development, proxy /api calls to the kalnostics-new NestJS backend.
  // This keeps the browser same-origin (no CORS needed) while the frontend
  // runs on :3001 and the backend on :3000.
  // In production, your reverse proxy (Nginx) should route /api directly.
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL ?? 'http://localhost:3000'}/api/:path*`,
      },
    ]
  },

  // ── Environment variables exposed to the browser ──────────────────
  // Leave NEXT_PUBLIC_API_URL empty so Axios issues same-origin /api/v1/*
  // requests that the rewrite above proxies to the backend.
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.APP_NAME ?? 'Kalnostics',
    NEXT_PUBLIC_APP_URL:  process.env.APP_URL  ?? 'http://localhost:3001',
    NEXT_PUBLIC_API_URL:  process.env.NEXT_PUBLIC_API_URL ?? '',
  },

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
}

module.exports = nextConfig
