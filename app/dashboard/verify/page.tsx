import Link from 'next/link'
import { TruemoiWordmark } from '@/components/ui/brand'
import { SignOutButton } from '@/components/features/auth/signout-button'
import { VerificationBadge } from '@/components/features/auth/verification-badge'
import { getCurrentUser } from '@/lib/features/auth/session-user'
import { isActionable, isVerified } from '@/lib/features/auth/verification'

export const metadata = { title: 'Verification' }
export const dynamic = 'force-dynamic'

/**
 * /dashboard/verify — full verification view with history.
 *
 * Demonstrates the SDK's `checkUser(token, { includeHistory: true })`
 * data through the platform: current status, level/tier, and every past
 * KYC attempt with its outcome.
 */
export default async function VerifyPage() {
  const identity = await getCurrentUser({ includeHistory: true })

  if (!identity?.authenticated || !identity.user) {
    return (
      <main className="center-screen">
        <div className="panel card-narrow">
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Session expired</h1>
          <p style={{ marginTop: 16 }}>
            <Link className="btn btn-primary" href="/auth/signin?next=%2Fdashboard%2Fverify">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    )
  }

  const { verification, history } = identity
  const verified = isVerified(verification?.status)
  const actionable = isActionable(verification?.status)

  return (
    <main className="container">
      <header className="header-row">
        <TruemoiWordmark />
        <SignOutButton />
      </header>

      <section className="panel" style={{ marginTop: 40 }}>
        <div className="header-row">
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600 }}>Identity verification</h1>
          <VerificationBadge status={verification?.status} />
        </div>

        {verification ? (
          <dl className="grid-2" style={{ marginTop: 24, marginBottom: 0 }}>
            <div className="kv">
              <dt>Level</dt>
              <dd>{verification.level ?? '—'}</dd>
            </div>
            <div className="kv">
              <dt>Tier</dt>
              <dd>{verification.tier ?? '—'}</dd>
            </div>
            <div className="kv">
              <dt>Completed at</dt>
              <dd>{verification.completed_at ?? '—'}</dd>
            </div>
            <div className="kv">
              <dt>Resubmission</dt>
              <dd>{verification.requires_resubmission ? 'Required' : 'Not required'}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted" style={{ marginTop: 16, fontSize: '.9rem' }}>
            No verification on file yet for this account.
          </p>
        )}

        {actionable && !verified ? (
          <div className="notice-warn" style={{ marginTop: 24 }}>
            Your verification is <strong>{verification?.status ?? 'unverified'}</strong>. Complete
            the KYC flow in the Truemoi platform to unlock verification-gated features.
          </div>
        ) : null}
      </section>

      {history && history.length > 0 ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Verification history</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0' }}>
            {history.map((entry) => (
              <li
                key={entry.id ?? `${entry.type}-${entry.completed_at}`}
                className="header-row kv"
                style={{ marginBottom: 12 }}
              >
                <span className="mono">{entry.type}</span>
                <span className="row">
                  {entry.completed_at ? <span className="faint">{entry.completed_at}</span> : null}
                  <VerificationBadge status={entry.status} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p style={{ marginTop: 24 }}>
        <Link href="/dashboard">← Back to dashboard</Link>
      </p>
    </main>
  )
}
