import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/features/auth/config'
import { serverOAuth } from '@/lib/features/auth/sdk'
import {
  readIdToken,
  requestOrigin,
  sessionClearCookies,
} from '@/lib/features/auth/session'

/**
 * POST/GET /api/auth/logout
 *
 * Ends BOTH sessions:
 *   1. the app's cookie session (cleared here), and
 *   2. the IdP session (redirect to the realm end-session endpoint with
 *      id_token_hint + post_logout_redirect_uri).
 *
 * Without step 2 the user would bounce straight back in on the next
 * sign-in (SSO) — that surprises people, so we do the full logout.
 */
export async function POST(request: NextRequest) {
  return logout(request)
}

export async function GET(request: NextRequest) {
  return logout(request)
}

async function logout(request: NextRequest) {
  const origin = requestOrigin(request.headers)

  const cookies = new Map<string, string>()
  request.cookies.getAll().forEach(({ name, value }) => cookies.set(name, value))
  const idTokenHint = readIdToken(cookies) || undefined

  // post_logout_redirect_uri must be registered on the client in the
  // platform console (Valid post-logout redirect URIs).
  const endSessionUrl = serverOAuth.getLogoutUrl({
    postLogoutRedirectUri: origin,
    idTokenHint,
  })

  const response = NextResponse.redirect(
    idTokenHint ? endSessionUrl : endSessionUrl, // IdP-side session end
    303,
  )
  for (const line of sessionClearCookies()) {
    response.headers.append('Set-Cookie', line)
  }
  return response
}

// Reference kept so config stays imported for future policy hooks.
void config
