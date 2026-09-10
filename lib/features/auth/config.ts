/**
 * Central runtime configuration for the Truemoi example app.
 *
 * One place that turns env vars into typed, normalized values so no other
 * module ever touches `process.env` directly. NEXT_PUBLIC_* values are
 * baked into the bundle at build time — see .env.example + README.
 */

function normDomain(domain: string): string {
  if (/^https?:\/\//i.test(domain)) return domain.replace(/\/+$/, '')
  const isLocal =
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$|\.local(:\d+)?$|\.localhost(:\d+)?$|\.app\.github\.dev(:\d+)?$/i.test(domain)
  return `${isLocal ? 'http' : 'https'}://${domain}`
}

function normUrl(url: string, fallback: string): string {
  if (!url) return fallback
  return url.replace(/\/+$/, '')
}

export const config = {
  /** IdP origin, e.g. https://auth.truemoi.com */
  authDomain: normDomain(process.env.NEXT_PUBLIC_AUTH_DOMAIN || 'auth.truemoi.com'),
  /** Keycloak realm (default platform realm: truemoi) */
  authRealm: process.env.NEXT_PUBLIC_AUTH_REALM || 'truemoi',
  /** This app's registered public OAuth client_id */
  clientId: process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || '',
  /** Platform API origin (token exchange, /me, refresh) */
  apiUrl: normUrl(process.env.NEXT_PUBLIC_OAUTH_API_URL || '', 'https://api.truemoi.com'),
  /** This app's public origin (fallback when request origin unavailable) */
  appUrl: normUrl(process.env.NEXT_PUBLIC_APP_URL || '', ''),
  /** Server-only verify API key for direct SDK identity checks */
  verifyApiKey: process.env.VERIFY_API_KEY || '',
} as const

/** Where Keycloak sends the user back after auth. */
export function redirectUri(origin: string): string {
  return `${origin}/auth/callback`
}

/** Where Keycloak returns after end-session. */
export function postLogoutRedirectUri(origin: string): string {
  return origin
}

/**
 * Scopes requested by this app. `offline_access` asks Keycloak for a
 * refresh token; omit it for access-token-only apps.
 */
export const OAUTH_SCOPE = 'openid email profile offline_access'
