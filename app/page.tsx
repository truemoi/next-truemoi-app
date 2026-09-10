import Link from 'next/link'
import { TruemoiWordmark } from '@/components/ui/brand'
import { SignInButton, SignUpButton } from '@/components/features/auth/auth-buttons'

export default function HomePage() {
  return (
    <main className="center-screen">
      <TruemoiWordmark />
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
          Auth-guarded Next.js starter
        </h1>
        <p className="muted" style={{ marginTop: 12 }}>
          OAuth 2.1 + PKCE sign-in, identity verification gating, and a protected
          dashboard — powered by the <code>@truemoi/sdk</code>.
        </p>
      </div>
      <div className="row">
        <SignInButton next="/dashboard" />
        <SignUpButton next="/dashboard" />
      </div>
      <p className="faint">
        Already signed in? <Link href="/dashboard">Go to your dashboard</Link>
      </p>
    </main>
  )
}
