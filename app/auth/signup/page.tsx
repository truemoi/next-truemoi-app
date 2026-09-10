import { Suspense } from 'react'
import { AuthShell } from '@/components/features/auth/auth-shell'
import { SignUpClient } from '@/components/features/auth/signup-client'

export const metadata = { title: 'Create account' }

/**
 * /auth/signup — branded sign-up entry.
 *
 * Truemoi owns registration: the platform's sign-up flow creates the
 * user in the IdP (with email verification when enabled), then the new
 * user signs in through the standard PKCE flow. This page simply hands
 * off to the same authorize redirect with `next` preserved.
 */
export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your Truemoi account"
      subtitle="You'll be redirected to the secure Truemoi registration page."
    >
      <Suspense fallback={<p className="mt-6 text-sm text-neutral-400">Loading…</p>}>
        <SignUpClient />
      </Suspense>
    </AuthShell>
  )
}
