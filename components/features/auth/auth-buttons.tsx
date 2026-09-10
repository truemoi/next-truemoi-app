'use client'

import { startSignIn, startSignUp } from '@/lib/features/auth/client-auth'

export function SignInButton({ next }: { next?: string }) {
  return (
    <button type="button" className="btn btn-primary" onClick={() => startSignIn(next)}>
      Sign in
    </button>
  )
}

export function SignUpButton({ next }: { next?: string }) {
  return (
    <button type="button" className="btn" onClick={() => startSignUp(next)}>
      Create account
    </button>
  )
}
