import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Truemoi Example — Next.js',
    template: '%s · Truemoi Example',
  },
  description:
    'Reference implementation of Truemoi OAuth 2.1 + identity verification for Next.js App Router apps.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  )
}
