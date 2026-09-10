'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { startSignUp } from '@/lib/features/auth/client-auth'

export function SignUpClient() {
  const params = useSearchParams()
  const next = params.get('next') || undefined
  const started = useRef(false)
  const [autoBlocked, setAutoBlocked] = useState(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    try {
      startSignUp(next)
    } catch {
      setAutoBlocked(true)
    }
  }, [next])

  return (
    <div style={{ marginTop: 24 }}>
      {autoBlocked ? (
        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => startSignUp(next)}>
          Continue to sign-up
        </button>
      ) : (
        <p className="muted" style={{ fontSize: '.9rem' }}>Redirecting…</p>
      )}
    </div>
  )
}
