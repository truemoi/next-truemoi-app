import Link from 'next/link'
import { TruemoiWordmark } from '@/components/ui/brand'

/** Shared shell for the auth pages (signin/signup/callback). */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <main className="center-screen">
      <Link href="/" style={{ color: 'inherit' }}>
        <TruemoiWordmark />
      </Link>
      <div className="panel card-narrow">
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{title}</h1>
        {subtitle ? <p className="muted" style={{ marginTop: 8, fontSize: '.9rem' }}>{subtitle}</p> : null}
        {children}
      </div>
      <p className="faint">Secured by Truemoi Identity · OAuth 2.1 + PKCE</p>
    </main>
  )
}
