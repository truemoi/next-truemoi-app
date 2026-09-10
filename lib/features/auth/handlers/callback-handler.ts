import { NextRequest, NextResponse } from 'next/server'
import type { TokenResponse } from '@truemoi/sdk'
import { config, redirectUri } from '@/lib/features/auth/config'
import { serverOAuth } from '@/lib/features/auth/sdk'
import {
  readNextPath,
  readPkceVerifier,
  sessionSetCookies,
  verifyOAuthState,
} from '@/lib/features/auth/session'

/**
 * POST /api/auth/callback   { code, state }
 *
 * The IdP redirects the browser to /auth/callback (a page). That page's
 * JS POSTs the code + state here (so the exchange happens server-side and
 * tokens never touch client JS). Steps:
 *
 *   1. verify `state` against the tm_oauth_state cookie (CSRF binding)
 *   2. read the PKCE verifier from the transient cookie
 *   3. exchange code+verifier at the platform API (`/api/auth/token`),
 *      which injects client authentication and forwards to the IdP
 *   4. set the httpOnly session cookies and redirect to the return path
 *      stored in the transient next cookie
 */

function originFrom(request: NextRequest): string {
  if (config.appUrl) return config.appUrl
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  let body: { code?: string; state?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { code, state } = body
  if (!code || !state) {
    return NextResponse.json({ error: 'missing_code_or_state' }, { status: 400 })
  }

  const cookies = new Map<string, string>()
  request.cookies.getAll().forEach(({ name, value }) => cookies.set(name, value))

  if (!verifyOAuthState(cookies, state)) {
    return NextResponse.json(
      { error: 'state_mismatch', message: 'OAuth state validation failed. Restart the sign-in flow.' },
      { status: 403 },
    )
  }

  const verifier = readPkceVerifier(cookies)
  if (!verifier) {
    return NextResponse.json(
      { error: 'pkce_verifier_missing', message: 'PKCE verifier cookie expired. Restart the sign-in flow.' },
      { status: 400 },
    )
  }

  const origin = originFrom(request)

  // Token exchange via the platform API (server-to-server).
  const tokenResponse = await fetch(`${config.apiUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(origin),
      code_verifier: verifier,
      client_id: config.clientId,
    }),
  })

  if (!tokenResponse.ok) {
    const detail = (await tokenResponse.text()).slice(0, 300)
    return NextResponse.json(
      { error: 'token_exchange_failed', status: tokenResponse.status, detail },
      { status: 502 },
    )
  }

  const tokens: TokenResponse = await tokenResponse.json()
  if (!tokens.access_token) {
    return NextResponse.json({ error: 'token_exchange_failed' }, { status: 502 })
  }

  const response = NextResponse.redirect(`${origin}${readNextPath(cookies)}`, 307)
  for (const line of sessionSetCookies(tokens)) {
    response.headers.append('Set-Cookie', line)
  }
  return response
}
/** GET on the callback API is a navigation mistake — nudge to the page. */
export async function GET() {
  return NextResponse.redirect('/auth/callback')
}
