import 'server-only'

import { TruemoiIdentity, TruemoiOAuth } from '@truemoi/sdk'
import { config } from './config'

/**
 * Server-side SDK singletons.
 *
 * The SDK is the "remote control" for the platform: its URL builders and
 * API calls mirror the platform client 1:1, so this example is exactly
 * what a third-party developer writes.
 *
 *  - `serverOAuth`    → authorize/logout URL building + token ops (server)
 *  - `serverIdentity` → combined auth + verification checks (server)
 *
 * On the client, use `lib/client-auth.ts` instead (SDK is not imported
 * there so the bundle stays lean).
 */

export const serverOAuth = new TruemoiOAuth({
  clientId: config.clientId,
  authDomain: config.authDomain,
  authRealm: config.authRealm,
  apiUrl: config.apiUrl,
})

export const serverIdentity = new TruemoiIdentity({
  clientId: config.clientId,
  authDomain: config.authDomain,
  authRealm: config.authRealm,
  apiUrl: config.apiUrl,
  apiKey: config.verifyApiKey,
})

export type { IdentityVerification, UserInfo, TokenResponse } from '@truemoi/sdk'
