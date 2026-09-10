import { Suspense } from 'react'
import { AuthShell } from '@/components/features/auth/auth-shell'
import { SignInClient } from '@/components/features/auth/signin-client'

export const metadata = { title: 'Sign in' }

/**
 * /auth/signin — the branded sign-in entry.
 *
 * The page immediately hands off to /api/auth/login (which builds the
 * PKCE authorize URL and redirects to the IdP's hosted, Truemoi-themed
 * login form). No credentials ever touch this app.
 */
export default function SignInPage() {
  return (
    <AuthShell title="Sign in to Truemoi" subtitle="You'll be redirected to the secure Truemoi sign-in page.">
      <Suspense fallback={<p className="mt-6 text-sm text-neutral-400">Loading…</p>}>
        <SignInClient />
      </Suspense>
    </AuthShell>
  )
}
