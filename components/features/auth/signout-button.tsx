'use client'

import { startSignOut } from '@/lib/features/auth/client-auth'

export function SignOutButton() {
  return (
    <button type="button" className="btn btn-danger" onClick={() => startSignOut()}>
      Sign out
    </button>
  )
}
