# Feature-first architecture

This example app is a scaffold for an enterprise platform where **auth is
the first feature** — Truemoi's core product — but not the last one. The
project is organized so every feature is a self-contained vertical slice:

```
app/                        # Next.js App Router (URL contracts only)
  api/auth/…/route.ts       # thin re-exports of feature handlers
  auth/…/page.tsx           # auth pages (signin/signup/callback)
  dashboard/page.tsx        # guarded page consuming auth + verification
lib/
  features/
    auth/                   # ← the auth feature
      config.ts             # env → typed config
      sdk.ts                # @truemoi/sdk singletons (server-only)
      pkce.ts               # RFC 7636 S256 helpers
      session.ts            # cookie session layer
      handlers/             # API route handler logic (login/callback/…)
      client-auth.ts        # browser helpers (fetch wrappers)
      identity.ts           # server-side identity/verification checks
      verification.ts       # verification status mapping + gating rules
    payment/                # ← future feature: created by another dev,
      …                     #    never touching lib/features/auth/**
components/
  features/
    auth/                   # auth UI (buttons, shells, verification views)
  ui/                       # shared primitives (brand, layout bits)
proxy.ts                    # edge auth guard (thin — logic in proxy-logic.ts)
proxy-logic.ts              # pure, unit-testable guard logic
```

## Rules

1. **Feature code lives under its feature folder.** Never write auth code
   in `lib/` root — it goes in `lib/features/auth/`. A payment developer
   creates `lib/features/payment/` and `components/features/payment/`.
2. **Cross-feature imports go through public APIs.** `dashboard` imports
   `lib/features/auth/session` — that's fine (consumer). Auth never
   imports from payment.
3. **`app/` holds only URL contracts.** Pages and `route.ts` files are
   thin wrappers; all logic lives in the feature folder. This keeps
   routes reviewable at a glance and logic unit-testable.
4. **Upgrades are feature-scoped.** An auth bug fix happens entirely
   inside `features/auth/**`; a payment feature never modifies auth
   files. Shared UI primitives go in `components/ui/`.
5. **Server/client boundary.** `server-only` files (`sdk.ts`, `session.ts`)
   are imported only from route handlers and server components. Browser
   code uses `client-auth.ts` fetch wrappers — tokens never reach client JS.
