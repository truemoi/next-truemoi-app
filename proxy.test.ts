import { describe, expect, it } from 'vitest'
import {
  decide,
  isPublicPath,
  safeNextPath,
  SESSION_FLAG_COOKIE,
  ACCESS_TOKEN_COOKIE,
} from './proxy-logic'

function jar(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries))
  return { get: (name: string) => (map.has(name) ? { value: map.get(name)! } : undefined) }
}

const signedIn = jar({ [SESSION_FLAG_COOKIE]: '1', [ACCESS_TOKEN_COOKIE]: 'tok' })

describe('auth guard decision table', () => {
  it('public home passes signed-out', () => {
    expect(decide('/', '', jar())).toEqual({ action: 'allow' })
  })

  it('public home passes signed-in', () => {
    expect(decide('/', '', signedIn)).toEqual({ action: 'allow' })
  })

  it('always allows the OAuth flow endpoints', () => {
    // The login API starts the flow — callers are by definition unauthenticated.
    expect(decide('/api/auth/login', '?next=%2Fdashboard', jar())).toEqual({ action: 'allow' })
    // IdP callback, anonymous or re-login with an existing session.
    expect(decide('/auth/callback', '?code=abc&state=xyz', jar())).toEqual({ action: 'allow' })
    expect(decide('/auth/callback', '?code=abc&state=xyz', signedIn)).toEqual({ action: 'allow' })
  })

  it('never HTML-redirects API routes (handlers return JSON 401s)', () => {
    for (const p of ['/api/auth/me', '/api/auth/session', '/api/auth/refresh', '/api/verify/require']) {
      expect(decide(p, '', jar()).action).toBe('allow')
    }
  })

  it('guarded dashboard redirects signed-out to signin with next', () => {
    const d = decide('/dashboard', '', jar())
    expect(d).toEqual({ action: 'redirect', location: '/auth/signin?next=%2Fdashboard' })
  })

  it('guarded API redirects signed-out preserving query', () => {
    const d = decide('/dashboard/verify', '?tab=identity', jar())
    expect(d).toEqual({
      action: 'redirect',
      location: '/auth/signin?next=%2Fdashboard%2Fverify%3Ftab%3Didentity',
    })
  })

  it('signed-in user on signin bounces to dashboard', () => {
    expect(decide('/auth/signin', '', signedIn)).toEqual({
      action: 'redirect',
      location: '/dashboard',
    })
  })

  it('signed-in user on signup bounces to dashboard', () => {
    expect(decide('/auth/signup', '', signedIn)).toEqual({
      action: 'redirect',
      location: '/dashboard',
    })
  })

  it('flag alone is not a session (needs access token too)', () => {
    expect(decide('/dashboard', '', jar({ [SESSION_FLAG_COOKIE]: '1' })).action).toBe('redirect')
  })

  it('public routes are exactly the documented set', () => {
    expect(isPublicPath('/')).toBe(true)
    expect(isPublicPath('/auth/signin')).toBe(true)
    expect(isPublicPath('/auth/signup')).toBe(true)
    expect(isPublicPath('/auth/callback')).toBe(true) // prefix-exempt
    expect(isPublicPath('/api/auth/login')).toBe(true) // prefix-exempt
    expect(isPublicPath('/dashboard')).toBe(false)
  })

  it('safeNextPath rejects protocol-relative and absolute URLs', () => {
    expect(safeNextPath(null)).toBe('/dashboard')
    expect(safeNextPath('//evil.example')).toBe('/dashboard')
    expect(safeNextPath('https://evil.example')).toBe('/dashboard')
    expect(safeNextPath('/dashboard?x=1')).toBe('/dashboard?x=1')
  })
})
