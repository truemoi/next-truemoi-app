'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Reads code+state from the URL, POSTs to /api/auth/callback, and follows
 * the redirect the handler returns. Errors surface inline with a retry.
 */
export function CallbackClient() {
  const params = useSearchParams()
  const started = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const code = params.get('code')
    const state = params.get('state')

    if (!code || !state) {
      setError('Missing authorization code. Restart the sign-in flow.')
      return
    }

    fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    })
      .then(async (res) => {
        if (res.redirected) {
          window.location.href = res.url
          return
        }
        const body = await res.json().catch(() => ({}))
        setError(body?.message || body?.error || `Exchange failed (${res.status}).`)
      })
      .catch((err) => setError(String(err)))
  }, [params])

  if (error) {
    return (
      <div style={{ marginTop: 24 }}>
        <p className="error-text">{error}</p>
        <p style={{ marginTop: 12 }}>
          <a href="/auth/signin">Back to sign-in</a>
        </p>
      </div>
    )
  }

  return (
    <p className="muted" style={{ marginTop: 24, fontSize: '.9rem' }}>
      <span className="spinner" aria-hidden /> Please wait…
    </p>
  )
}
