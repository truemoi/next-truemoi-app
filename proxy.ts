import { NextRequest, NextResponse } from 'next/server'
import { decide } from './proxy-logic'

/**
 * Edge auth guard (Next.js "proxy" — the middleware file in Next 16).
 *
 * Thin executor over `proxy-logic.ts` (pure, tested). It only:
 *   1. feeds the request into `decide()`
 *   2. applies the resulting allow/redirect
 *
 * Auth feature logic never lives here — see FEATURES.md.
 */

export function proxy(request: NextRequest) {
  const decision = decide(
    request.nextUrl.pathname,
    request.nextUrl.search,
    request.cookies,
  )

  if (decision.action === 'redirect') {
    return NextResponse.redirect(new URL(decision.location, request.url))
  }
  return NextResponse.next()
}

export const config = {
  // Guard everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
