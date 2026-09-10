/**
 * Verification status mapping + gating rules (auth feature).
 *
 * The platform reports a NEUTRAL public lifecycle (see @truemoi/sdk types):
 *   verified | in_review | in_progress | resubmission_required | failed |
 *   unverified | unavailable
 *
 * Whether the platform reviews submissions manually, automatically, or in a
 * hybrid mode is an internal operator concern and is deliberately not part
 * of the contract — so there are no manual/auto review labels here.
 *
 * Map every status to a user-facing label + color, and define which
 * statuses count as "verified enough" for gated features.
 */

export type VerificationStatus =
  | 'verified'
  | 'in_review'
  | 'in_progress'
  | 'resubmission_required'
  | 'failed'
  | 'unverified'
  | 'unavailable'

export const VERIFICATION_META: Record<
  VerificationStatus,
  { label: string; tone: 'ok' | 'warn' | 'bad' | 'muted' }
> = {
  verified: { label: 'Verified', tone: 'ok' },
  in_review: { label: 'In review', tone: 'warn' },
  in_progress: { label: 'In progress', tone: 'warn' },
  resubmission_required: { label: 'Action required', tone: 'warn' },
  failed: { label: 'Failed', tone: 'bad' },
  unverified: { label: 'Not verified', tone: 'muted' },
  unavailable: { label: 'Unavailable', tone: 'muted' },
}

/** Statuses that satisfy a verification gate. */
export function isVerified(status: string | null | undefined): boolean {
  return status === 'verified'
}

/** Statuses where a retry/resubmission is still possible. */
export function isActionable(status: string | null | undefined): boolean {
  return (
    status === 'unverified' ||
    status === 'failed' ||
    status === 'resubmission_required' ||
    status === 'in_progress' ||
    status === 'in_review'
  )
}

export function verificationMeta(status: string | null | undefined) {
  const key = (status || 'unverified') as VerificationStatus
  return VERIFICATION_META[key] ?? VERIFICATION_META.unverified
}

export const TONE_CLASSES: Record<string, string> = {
  ok: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  warn: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  bad: 'bg-red-500/10 text-red-400 border-red-500/30',
  muted: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
}
