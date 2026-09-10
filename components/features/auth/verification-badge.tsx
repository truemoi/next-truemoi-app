import { verificationMeta } from '@/lib/features/auth/verification'

/** Compact verification status badge. */
export function VerificationBadge({ status }: { status: string | null | undefined }) {
  const meta = verificationMeta(status)
  return <span className={`badge badge-${meta.tone}`}>{meta.label}</span>
}
