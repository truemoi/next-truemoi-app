import Link from 'next/link'
import { TruemoiWordmark } from '@/components/ui/brand'
import { SignOutButton } from '@/components/features/auth/signout-button'
import { VerificationBadge } from '@/components/features/auth/verification-badge'
import { getCurrentUser } from '@/lib/features/auth/session-user'
import { isVerified, verificationMeta } from '@/lib/features/auth/verification'

export const metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

/**
 * /dashboard — the auth-guarded page.
 *
 * Double protection:
 *   1. the edge proxy requires a session cookie before this renders,
 *   2. getCurrentUser() re-checks the token against the platform (a
 *      revoked/expired token yields null → bounced to sign-in).
 */
export default async function DashboardPage() {
  const identity = await getCurrentUser()

  if (!identity?.authenticated || !identity.user) {
    return (
      <main className="center-screen">
        <div className="panel card-narrow">
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Session expired</h1>
          <p className="muted" style={{ marginTop: 8, fontSize: '.9rem' }}>
            Sign in again to view your dashboard.
          </p>
          <p style={{ marginTop: 16 }}>
            <Link className="btn btn-primary" href="/auth/signin?next=%2Fdashboard">Sign in</Link>
          </p>
        </div>
      </main>
    )
  }

  const { user, verification } = identity
  const status = verification?.status
  const verified = isVerified(status)
  const meta = verificationMeta(status)

  return (
    <main className="container">
      <header className="header-row">
        <TruemoiWordmark />
        <SignOutButton />
      </header>

      <section className="panel" style={{ marginTop: 40 }}>
        <div className="header-row">
          <div>
            <p className="muted" style={{ margin: 0, fontSize: '.85rem' }}>Signed in as</p>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.3rem', fontWeight: 600 }}>
              {user.name || user.preferred_username || user.email || user.sub}
            </h1>
            {user.email ? <p className="muted" style={{ margin: '4px 0 0', fontSize: '.9rem' }}>{user.email}</p> : null}
          </div>
          <VerificationBadge status={status} />
        </div>

        <dl className="grid-3" style={{ marginTop: 24, marginBottom: 0 }}>
          <div className="kv">
            <dt>User ID</dt>
            <dd className="mono">{user.sub}</dd>
          </div>
          <div className="kv">
            <dt>Role</dt>
            <dd>{user.role || 'member'}</dd>
          </div>
          <div className="kv">
            <dt>Verification</dt>
            <dd>
              {meta.label}
              {verification?.level ? ` · ${verification.level}` : ''}
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid-2" style={{ marginTop: 24 }}>
        <div className="panel">
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Identity verification</h2>
          <p className="muted" style={{ fontSize: '.9rem' }}>
            {verified
              ? 'Your identity is verified — verification-gated features are unlocked.'
              : 'Some features require identity verification.'}
          </p>
          <Link className="btn" href="/dashboard/verify">
            {verified ? 'View verification details' : 'Start verification'}
          </Link>
        </div>

        <div className="panel">
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Verification-gated feature</h2>
          <p className="muted" style={{ fontSize: '.9rem' }}>
            {verified
              ? 'This panel represents a feature only verified users can access.'
              : 'This panel is locked until your identity is verified.'}
          </p>
          <div className={verified ? 'notice-ok' : 'notice-locked'}>
            {verified ? '✓ Premium feature unlocked' : '🔒 Locked — verify your identity'}
          </div>
        </div>
      </section>
    </main>
  )
}
