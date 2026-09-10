import 'server-only'

/**
 * Cookie-based session layer.
 *
 * Cookie map:
 *   tm_at            access token (httpOnly, signed when secret set)
 *   tm_rt            refresh token (httpOnly)
 *   tm_id_token      ID token — used as id_token_hint at logout (httpOnly)
 *   tm_session       presence flag for the edge proxy guard (not httpOnly)
 *   tm_pkce_verifier transient PKCE verifier (login → callback)
 *   tm_oauth_state   transient OAuth state nonce (login → callback)
 *   tm_oauth_next    transient return path (login → callback)
 *
 * Transient cookies are cleared by /api/auth/callback and /api/auth/logout.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import type { TokenResponse } from '@truemoi/sdk'
import { config } from './config'

export const COOKIE = {
  accessToken: 'tm_at',
  refreshToken: 'tm_rt',
  idToken: 'tm_id_token',
  sessionFlag: 'tm_session',
  pkceVerifier: 'tm_pkce_verifier',
  oauthState: 'tm_oauth_state',
  oauthNext: 'tm_oauth_next',
} as const

/** 7 days — matches the platform refresh-token TTL. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

const baseCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

// ── Optional HMAC signing of the access-token cookie ─────────────
// Without TM_SESSION_SECRET the app still works (the token is already a
// signed JWT the API validates); the signature only hardens the cookie
// against tampering-by-opportunity in the browser store.

function sessionSecret(): string | null {
  return process.env.TM_SESSION_SECRET || null
}

function sign(value: string): string {
  const secret = sessionSecret()
  if (!secret) return value
  const mac = createHmac('sha256', secret).update(value).digest('base64url')
  return `${value}.${mac}`
}

function unsign(signed: string): string | null {
  const secret = sessionSecret()
  if (!secret) return signed
  const i = signed.lastIndexOf('.')
  if (i < 0) return null
  const value = signed.slice(0, i)
  const mac = signed.slice(i + 1)
  const expected = createHmac('sha256', secret).update(value).digest('base64url')
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return value
}

/** Serialize one Set-Cookie header line. */
function cookieLine(name: string, value: string, maxAge: number): string {
  const parts = [
    `${name}=${value}`,
    `Path=${baseCookie.path}`,
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
  ]
  if (baseCookie.httpOnly) parts.push('HttpOnly')
  if (baseCookie.secure) parts.push('Secure')
  return parts.join('; ')
}

/**
 * Persist the session after a successful token exchange.
 * Returns the Set-Cookie headers to attach to the response.
 */
export function sessionSetCookies(tokens: TokenResponse): string[] {
  const lines = [
    cookieLine(COOKIE.accessToken, sign(tokens.access_token), SESSION_MAX_AGE),
    cookieLine(COOKIE.sessionFlag, '1', SESSION_MAX_AGE),
  ]
  if (tokens.refresh_token) {
    lines.push(cookieLine(COOKIE.refreshToken, tokens.refresh_token, SESSION_MAX_AGE))
  }
  if (tokens.id_token) {
    lines.push(cookieLine(COOKIE.idToken, tokens.id_token, SESSION_MAX_AGE))
  }
  // Clear transient PKCE/state/next cookies (single use).
  lines.push(cookieLine(COOKIE.pkceVerifier, '', 0))
  lines.push(cookieLine(COOKIE.oauthState, '', 0))
  lines.push(cookieLine(COOKIE.oauthNext, '', 0))
  return lines
}

/** Clear the session (logout / refresh failure). */
export function sessionClearCookies(): string[] {
  return [
    cookieLine(COOKIE.accessToken, '', 0),
    cookieLine(COOKIE.refreshToken, '', 0),
    cookieLine(COOKIE.idToken, '', 0),
    cookieLine(COOKIE.sessionFlag, '', 0),
  ]
}

/**
 * Transient cookies set by /api/auth/login.
 *
 * `state` is a pure random nonce (CSRF binding). The return path travels in
 * its OWN cookie (`next`) rather than embedded in the state value — mixing
 * the two creates encoding asymmetries between the cookie round-trip and
 * the IdP's URL-encoding of the state query param, which can break the
 * comparison at callback time.
 */
export function oauthTransientCookies(verifier: string, state: string, next: string): string[] {
  return [
    cookieLine(COOKIE.pkceVerifier, verifier, 600),
    cookieLine(COOKIE.oauthState, state, 600),
    cookieLine(COOKIE.oauthNext, next, 600),
  ]
}

/** Read + unsign the access token from a cookie map (route handlers). */
export function readAccessToken(cookieMap: Map<string, string>): string | null {
  const raw = cookieMap.get(COOKIE.accessToken)
  if (!raw) return null
  return unsign(raw)
}

/** Verify the OAuth state cookie matches the callback's state param. */
export function verifyOAuthState(cookieMap: Map<string, string>, state: string): boolean {
  const expected = cookieMap.get(COOKIE.oauthState)
  if (!expected || expected !== state) return false
  return true
}

/**
 * Read the return path for a completed sign-in. Only same-origin relative
 * paths are honored (open-redirect guard) — anything else falls back to
 * /dashboard.
 */
export function readNextPath(cookieMap: Map<string, string>): string {
  const raw = cookieMap.get(COOKIE.oauthNext)
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export function readPkceVerifier(cookieMap: Map<string, string>): string | null {
  return cookieMap.get(COOKIE.pkceVerifier) || null
}

export function readIdToken(cookieMap: Map<string, string>): string | null {
  return cookieMap.get(COOKIE.idToken) || null
}

export function readRefreshToken(cookieMap: Map<string, string>): string | null {
  return cookieMap.get(COOKIE.refreshToken) || null
}

/** Origin resolution helper shared by route handlers. */
export function requestOrigin(headers: Headers): string {
  if (config.appUrl) return config.appUrl
  const proto = headers.get('x-forwarded-proto') || 'http'
  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost:3000'
  return `${proto}://${host}`
}
