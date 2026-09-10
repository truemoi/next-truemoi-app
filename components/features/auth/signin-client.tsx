'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { startSignIn } from '@/lib/features/auth/client-auth'

/**
 * Auto-starts the authorize redirect on mount. A manual button is kept
 * as fallback for strict browsers/environments that block scripted
 * top-level navigation.
 */
export function SignInClient() {
  const params = useSearchParams()
  const next = params.get('next') || undefined
  const started = useRef(false)
  const [autoBlocked, setAutoBlocked] = useState(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    try {
      startSignIn(next)
    } catch {
      setAutoBlocked(true)
    }
  }, [next])

  return (
    <div style={{ marginTop: 24 }}>
      {autoBlocked ? (
        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => startSignIn(next)}>
          Continue to sign-in
        </button>
      ) : (
        <p className="muted" style={{ fontSize: '.9rem' }}>Redirecting…</p>
      )}
    </div>
  )
}
