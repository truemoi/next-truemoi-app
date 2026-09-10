import { NextRequest, NextResponse } from 'next/server'
import { COOKIE } from '@/lib/features/auth/session'

/**
 * GET /api/auth/session → { authenticated: boolean }
 *
 * Presence-only probe (no upstream call) — useful for the client to
 * decide between rendering nav actions vs. triggering a refresh.
 */
export async function GET(request: NextRequest) {
  const hasSession = request.cookies.get(COOKIE.sessionFlag)?.value === '1'
    && Boolean(request.cookies.get(COOKIE.accessToken)?.value)
  return NextResponse.json({ authenticated: hasSession })
}
