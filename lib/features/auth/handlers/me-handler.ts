import { NextRequest, NextResponse } from 'next/server'
import { readAccessToken } from '@/lib/features/auth/session'
import { serverOAuth } from '@/lib/features/auth/sdk'

/**
 * GET /api/auth/me?history=1
 *
 * Proxies the platform's /api/auth/me through the SDK's
 * `verifyIdentity()` — one call that returns:
 *   { authenticated, user, verification, history? }
 *
 * This is the shape @truemoi/sdk's `TruemoiIdentity.checkUser()`
 * returns; consumers of this route get SDK-compatible data.
 */
export async function GET(request: NextRequest) {
  const cookies = new Map<string, string>()
  request.cookies.getAll().forEach(({ name, value }) => cookies.set(name, value))

  const accessToken = readAccessToken(cookies)
  if (!accessToken) {
    return NextResponse.json({ authenticated: false, user: null, verification: null }, { status: 401 })
  }

  try {
    const includeHistory = request.nextUrl.searchParams.get('history') === '1'
    const result = await serverOAuth.verifyIdentity(accessToken, { includeHistory })
    return NextResponse.json(result, { status: result.authenticated ? 200 : 401 })
  } catch (err) {
    return NextResponse.json(
      { authenticated: false, user: null, verification: null, error: (err as Error).message },
      { status: 502 },
    )
  }
}
