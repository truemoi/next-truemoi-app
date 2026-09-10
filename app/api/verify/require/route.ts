import { NextRequest, NextResponse } from 'next/server'
import { readAccessToken } from '@/lib/features/auth/session'
import { serverIdentity } from '@/lib/features/auth/sdk'
import { isVerified } from '@/lib/features/auth/verification'

/**
 * GET /api/verify/require — example verification-GATED API.
 *
 * The enterprise pattern for third-party developers:
 *
 *   1. read the session's access token (httpOnly cookie)
 *   2. call the SDK's `TruemoiIdentity.checkUser(token)` — one call that
 *      validates authentication AND returns KYC/AML verification status
 *   3. gate the business logic on `isVerified(...)`
 *
 * 401 = not signed in · 403 = signed in but not verified · 200 = proceed.
 */
export async function GET(request: NextRequest) {
  const cookies = new Map<string, string>()
  request.cookies.getAll().forEach(({ name, value }) => cookies.set(name, value))

  const accessToken = readAccessToken(cookies)
  if (!accessToken) {
    return NextResponse.json(
      { error: 'unauthenticated', message: 'Sign in first.' },
      { status: 401 },
    )
  }

  const identity = await serverIdentity.checkUser(accessToken)

  if (!identity.authenticated) {
    return NextResponse.json(
      { error: 'unauthenticated', message: identity.error || 'Invalid or expired token.' },
      { status: 401 },
    )
  }

  if (!isVerified(identity.verification?.status)) {
    return NextResponse.json(
      {
        error: 'verification_required',
        message: 'This resource requires identity verification.',
        verification: identity.verification,
      },
      { status: 403 },
    )
  }

  // ── Your business logic goes here ────────────────────────────────
  return NextResponse.json({
    ok: true,
    user: identity.user,
    verification: identity.verification,
    data: { premium: 'This payload is only for verified users.' },
  })
}
