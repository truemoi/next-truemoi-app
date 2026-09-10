/** Shared brand primitives (components/ui — cross-feature). */

export function TruemoiMark({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0EA5E9" />
      <path d="M9 10h14M16 10v13" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  )
}

export function TruemoiWordmark() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <TruemoiMark size={26} />
      <span style={{ fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.01em' }}>Truemoi</span>
    </span>
  )
}
