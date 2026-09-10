# AGENTS.md — conventions for this example app

- **Next.js 16.2.1 / React 19.2.4** (pinned — `next@16.3.x` has an
  upstream `/_global-error` prerender bug). Next 16 renamed middleware to
  **`proxy.ts`** (with `proxy(request)` + `config.matcher`).
- **Feature-first layout** — see FEATURES.md. Auth code lives only under
  `lib/features/auth/**` + `components/features/auth/**`; `app/` holds
  thin URL contracts (pages and `route.ts` re-exports of
  `lib/features/auth/handlers/*`).
- **Never import `@truemoi/sdk` in client components.** Browser code uses
  `lib/features/auth/client-auth.ts` fetch wrappers.
- **Env access only through `lib/features/auth/config.ts`.**
- Tests: `npx vitest run` (guard decision table in `proxy.test.ts`).
- Typecheck: `npx tsc --noEmit`; build: `npx next build`.
- Do not commit `.env.local` or real secrets.
