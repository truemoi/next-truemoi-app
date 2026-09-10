'use client'

/**
 * Browser-side auth helpers.
 *
 * Deliberately thin fetch wrappers — the SDK is a server dependency here
 * so access tokens never exist in client JS. All cookie/session work is
 * done by the app's own route handlers.
 */

export type MeResponse = {
  authenticated: boolean
  user: {
    sub: string
    email?: string
    name?: string
    preferred_username?: string
    role?: string
  } | null
  verification: {
    id: string | null
    status: string
    level: string | null
  } | null
  error?: string
}

/** Fetch the signed-in user's profile + verification status. */
export async function fetchMe(options?: { history?: boolean }): Promise<MeResponse> {
  const res = await fetch(`/api/auth/me${options?.history ? '?history=1' : ''}`, {
    cache: 'no-store',
  })
  if (res.status === 401) return { authenticated: false, user: null, verification: null }
  if (!res.ok) throw new Error(`me failed: ${res.status}`)
  return res.json()
}

/** Navigate to sign-in, preserving the current page as `next`. */
export function startSignIn(next?: string) {
  const params = next ? `?next=${encodeURIComponent(next)}` : ''
  window.location.href = `/api/auth/login${params}`
}

/** Navigate to sign-up. */
export function startSignUp(next?: string) {
  const params = next ? `?next=${encodeURIComponent(next)}` : ''
  window.location.href = `/api/auth/login${params}`
}

/** Full logout (app session + IdP session). */
export function startSignOut() {
  window.location.href = '/api/auth/logout'
}
