/**
 * Pure, unit-testable auth-guard logic.
 *
 * The edge proxy (`proxy.ts`) is a thin executor over this module so the
 * decision table can be tested without a Next.js runtime.
 *
 * Decision table:
 *   - Public routes (/, /auth/signin, /auth/signup) → pass through
 *   - Everything else requires a session cookie → dashboard, API, etc.
 *   - Signed-in users hitting signin/signup bounce to /dashboard
 *   - Unauthenticated users hitting guarded routes → /auth/signin?next=<path>
 */

/** Routes reachable without a session. */
export const PUBLIC_ROUTES = new Set(['/', '/auth/signin', '/auth/signup', '/auth/callback'])

/**
 * Route prefixes exempt from the edge guard entirely.
 *
 * API routes enforce authorization in their handlers (JSON 401/403 — see
 * lib/features/auth/handlers/*), so the proxy must never turn an API
 * request into an HTML signin redirect. `/auth/callback` is also public:
 * the caller is, by definition, not signed in yet when the IdP bounces
 * back with the code.
 */
export const PUBLIC_PREFIXES = ['/api/', '/auth/callback']

/** Routes a signed-in user should not sit on (bounce to dashboard). */
export const GUEST_ONLY_ROUTES = new Set(['/auth/signin', '/auth/signup'])

/** The route the proxy redirects unauthenticated users to. */
export const SIGNIN_ROUTE = '/auth/signin'

/** Session cookie names shared with lib/features/auth/session.ts. */
export const SESSION_FLAG_COOKIE = 'tm_session'
export const ACCESS_TOKEN_COOKIE = 'tm_at'

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.has(pathname)
}

/** Same-origin relative path guard (open-redirect defense). */
export function safeNextPath(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export type ProxyDecision =
  | { action: 'allow' }
  | { action: 'redirect'; location: string }

export function decide(
  pathname: string,
  search: string,
  cookies: { get(name: string): { value: string } | undefined },
): ProxyDecision {
  const hasSession =
    cookies.get(SESSION_FLAG_COOKIE)?.value === '1' &&
    Boolean(cookies.get(ACCESS_TOKEN_COOKIE)?.value)

  if (isPublicPath(pathname)) {
    // Guest-only bounce applies to pages only — never to API/callback paths.
    if (hasSession && isGuestOnlyPath(pathname)) {
      return { action: 'redirect', location: '/dashboard' }
    }
    return { action: 'allow' }
  }

  if (hasSession) return { action: 'allow' }

  const next = encodeURIComponent(`${pathname}${search || ''}`)
  return { action: 'redirect', location: `${SIGNIN_ROUTE}?next=${next}` }
}
