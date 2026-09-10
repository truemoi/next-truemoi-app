import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { redirectUri, OAUTH_SCOPE } from '@/lib/features/auth/config'
import { serverOAuth } from '@/lib/features/auth/sdk'
import { generateCodeVerifier, codeChallengeS256 } from '@/lib/features/auth/pkce'
import { oauthTransientCookies, requestOrigin } from '@/lib/features/auth/session'

/**
 * GET /api/auth/login?next=/dashboard
 *
 * Starts the OAuth 2.1 authorization-code flow with PKCE (S256):
 *   1. mint verifier + challenge
 *   2. mint a single-use state nonce (CSRF binding); the return path
 *      travels in its own transient cookie
 *   3. drop transient cookies and 307 the browser to the IdP authorize URL
 *
 * `next` is the in-app path to return to after the callback. Only
 * same-origin relative paths are accepted (open-redirect guard).
 */

function safeNext(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request.headers)
  const next = safeNext(request.nextUrl.searchParams.get('next'))

  const verifier = generateCodeVerifier()
  const state = randomUUID()

  const authorizeUrl = serverOAuth.getAuthorizationUrl({
    redirectUri: redirectUri(origin),
    scope: OAUTH_SCOPE,
    state,
    codeChallenge: codeChallengeS256(verifier),
    codeChallengeMethod: 'S256',
  })

  const response = NextResponse.redirect(authorizeUrl, 307)
  for (const line of oauthTransientCookies(verifier, state, next)) {
    response.headers.append('Set-Cookie', line)
  }
  return response
}
