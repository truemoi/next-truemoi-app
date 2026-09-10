import 'server-only'

import { cookies } from 'next/headers'
import { readAccessToken } from './session'
import { serverOAuth } from './sdk'
import type { IdentityVerification } from '@truemoi/sdk'

/**
 * Server-side current-user resolution for server components.
 *
 * Returns null when there is no session; the proxy guard already
 * redirects unauthenticated visitors, so this is a defense-in-depth
 * read (and the data source for the dashboard).
 */
export async function getCurrentUser(options?: {
  includeHistory?: boolean
}): Promise<IdentityVerification | null> {
  const cookieStore = await cookies()
  const map = new Map<string, string>()
  for (const c of cookieStore.getAll()) map.set(c.name, c.value)

  const accessToken = readAccessToken(map)
  if (!accessToken) return null

  try {
    return await serverOAuth.verifyIdentity(accessToken, {
      includeHistory: options?.includeHistory,
    })
  } catch {
    return null
  }
}
