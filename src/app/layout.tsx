import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

/**
 * Root layout — applies to all pages.
 * APP_NAME is injected from environment, making rebranding a config change only.
 */
export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_APP_NAME ?? 'Kaltros',
    template: `%s | ${process.env.NEXT_PUBLIC_APP_NAME ?? 'Kaltros'}`,
  },
  description: 'Healthcare Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
