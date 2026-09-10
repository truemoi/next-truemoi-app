import { Suspense } from 'react'
import { AuthShell } from '@/components/features/auth/auth-shell'
import { CallbackClient } from '@/components/features/auth/callback-client'

export const metadata = { title: 'Signing in…' }

/**
 * /auth/callback — the OAuth redirect landing page.
 *
 * Keycloak sends the browser here with ?code=…&state=…. This page is a
 * client component that POSTs them to /api/auth/callback (the server-side
 * exchange), then follows the 307 to `next`. Keeping the exchange out of
 * the page render means tokens are set as httpOnly cookies server-side.
 */
export default function CallbackPage() {
  return (
    <AuthShell title="Completing sign-in…" subtitle="Exchanging your authorization code.">
      <Suspense fallback={<p className="mt-6 text-sm text-neutral-400">Loading…</p>}>
        <CallbackClient />
      </Suspense>
    </AuthShell>
  )
}
