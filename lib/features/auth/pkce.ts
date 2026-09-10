/**
 * PKCE (RFC 7636) helpers — S256 code challenge.
 *
 * Runs on the server inside route handlers (Node crypto) so the verifier
 * never touches client JS. The verifier lives in a short-lived httpOnly
 * cookie between /api/auth/login and /api/auth/callback.
 */

import { createHash, randomBytes } from 'node:crypto'

/** 64 bytes → 86-char base64url string (RFC 7636 §4.1 allows 43–128). */
export function generateCodeVerifier(): string {
  return randomBytes(64).toString('base64url')
}

/** S256 challenge = BASE64URL(SHA256(ASCII(verifier))). */
export function codeChallengeS256(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}
