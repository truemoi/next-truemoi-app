import { NextRequest, NextResponse } from 'next/server'
import type { TokenResponse } from '@truemoi/sdk'
import { config } from '@/lib/features/auth/config'
import {
  readRefreshToken,
  sessionClearCookies,
  sessionSetCookies,
} from '@/lib/features/auth/session'

/**
 * POST /api/auth/refresh
 *
 * Rotates the access token via the platform's refresh endpoint
 * (`/api/auth/refresh` → IdP refresh grant). On failure the session is
 * cleared so the proxy guard sends the user through a fresh sign-in.
 */
export async function POST(request: NextRequest) {
  const cookies = new Map<string, string>()
  request.cookies.getAll().forEach(({ name, value }) => cookies.set(name, value))

  const refreshToken = readRefreshToken(cookies)
  if (!refreshToken) {
    const response = NextResponse.json({ error: 'no_refresh_token' }, { status: 401 })
    for (const line of sessionClearCookies()) response.headers.append('Set-Cookie', line)
    return response
  }

  const upstream = await fetch(`${config.apiUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!upstream.ok) {
    const response = NextResponse.json(
      { error: 'refresh_failed', status: upstream.status },
      { status: 401 },
    )
    for (const line of sessionClearCookies()) response.headers.append('Set-Cookie', line)
    return response
  }

  const tokens: TokenResponse = await upstream.json()
  const response = NextResponse.json({ ok: true })
  for (const line of sessionSetCookies(tokens)) response.headers.append('Set-Cookie', line)
  return response
}
