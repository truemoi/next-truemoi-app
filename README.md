# Truemoi Example — Next.js OAuth + Identity Verification

A production-shaped reference app for the **Truemoi identity platform**:
OAuth 2.1 authorization-code flow with PKCE, an auth-guarded dashboard,
identity-verification gating, and a feature-first project structure you
can scale into a full enterprise app.

Built on the official [`@truemoi/sdk`](https://www.npmjs.com/package/@truemoi/sdk)
— the same SDK your developers use. **Everything here works immediately;
advanced options are documented as "uncomment to enable" blocks.**

## What the app demonstrates

| Flow | Where |
|---|---|
| Sign-in (PKCE + state, httpOnly cookie session) | `/auth/signin` → `/api/auth/login` → IdP → `/auth/callback` |
| Sign-up | `/auth/signup` (platform-owned registration) |
| Auth-guarded dashboard | `/dashboard` (edge guard + server re-check) |
| Logout (app + IdP session) | `/api/auth/logout` → end-session → back to app |
| Verification status + history | `/dashboard/verify` |
| Verification-gated API (401/403/200 pattern) | `GET /api/verify/require` |
| Silent token refresh | `POST /api/auth/refresh` |
| Edge auth guard | `proxy.ts` (pure logic in `proxy-logic.ts`, unit-tested) |

## Project structure (feature-first)

```
app/                        # Next.js App Router — URL contracts only
  api/auth/…/route.ts       # thin re-exports of feature handlers
  api/verify/require/       # verification-gated API example
  auth/{signin,signup,callback}/page.tsx
  dashboard/{page,verify/page}.tsx
lib/features/auth/          # ← the auth feature (everything auth lives here)
  config.ts  sdk.ts  pkce.ts  session.ts
  handlers/                 # login/callback/logout/refresh/me/session logic
  client-auth.ts            # browser helpers (no tokens in client JS)
  session-user.ts           # server-component current-user resolver
  verification.ts           # status mapping + gating rules
components/features/auth/   # auth UI
components/ui/              # shared primitives (brand)
proxy.ts + proxy-logic.ts   # edge guard + pure decision logic
```

See [FEATURES.md](./FEATURES.md) for the full convention — a payments
developer would add `lib/features/payment/` and never touch auth.

## Quick start

### 1. Register an OAuth client

Use the platform console, or run the provided script against a Keycloak
admin endpoint. From the platform repo root it reads the admin
credentials from `.env`; anywhere else, pass them explicitly:

```bash
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback \
KEYCLOAK_INTERNAL_ENDPOINT=http://localhost:8080 \
KEYCLOAK_ADMIN_PASSWORD=… \
  ./scripts/register-client.sh
```

The script registers `truemoi-example` as a public PKCE client with:

- Redirect URI: `http://localhost:3000/auth/callback`
- Web origins: `http://localhost:3000`

### 2. Configure and run

```bash
pnpm install
cp .env.example .env.local    # defaults target a local stack
pnpm dev                      # http://localhost:3000
```

### 3. Walk the flow

1. Open `http://localhost:3000` → **Sign in**
2. You're redirected to the Truemoi-hosted, Truemoi-branded login page
3. After auth you land on `/dashboard` with your profile + verification badge
4. **Sign out** clears both the app session and the IdP session

## Repository relationship (monorepo ↔ standalone)

This app lives in **two places**, and only one of them is edited:

- **Source of truth:** `examples/nextjs-oauth/` inside the
  [truemoi-dev](https://github.com/truemoi/truemoi-dev) platform
  repository. All development happens here.
- **Published copy:** [truemoi/next-truemoi-app](https://github.com/truemoi/next-truemoi-app)
  — a standalone repo for developers who want just the example.

The published copy is generated with:

```bash
# from the truemoi-dev repo root
examples/nextjs-oauth/scripts/export-standalone.sh /tmp/next-truemoi-app
cd /tmp/next-truemoi-app
git remote add origin https://github.com/truemoi/next-truemoi-app.git
git push -u origin main
```

The export switches the SDK dependency from the monorepo `file:../../sdk`
path to the published npm package (`^0.0.1` by default — override with
`SDK_VERSION`). **Do not edit the standalone repo directly** — change the
source in `truemoi-dev` and re-export, otherwise the two drift apart.

## Environment

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_AUTH_DOMAIN` | no | default `auth.truemoi.com` |
| `NEXT_PUBLIC_AUTH_CLIENT_ID` | yes | your registered client (`truemoi-example`) |
| `NEXT_PUBLIC_AUTH_REALM` | no | default `truemoi` |
| `NEXT_PUBLIC_OAUTH_API_URL` | yes | platform API (`http://localhost:4001` locally) |
| `NEXT_PUBLIC_APP_URL` | no | public origin override (behind proxies) |
| `VERIFY_API_KEY` | server-only | for direct SDK identity checks |
| `TM_SESSION_SECRET` | no | HMAC-signs the session cookie (recommended in prod) |

> `NEXT_PUBLIC_*` values are baked in at build time — restart dev / rebuild
> after changing them.

## Security model

- **PKCE (S256) + single-use state** on every authorization request;
  the verifier and state live in transient httpOnly cookies and are
  validated at the callback (state mismatch → 403).
- **Tokens never reach client JS.** Access/refresh/ID tokens are httpOnly
  cookies set by the server-side exchange; the browser only sees a
  presence flag for the edge guard.
- **Two-layer guard.** The edge proxy checks session presence; server
  pages re-validate the token against the platform (`getCurrentUser`).
- **Open-redirect guard.** `next` parameters must be same-origin relative
  paths (`safeNextPath`).
- **Optional cookie signing.** Set `TM_SESSION_SECRET` to HMAC-sign the
  access-token cookie.

## Advanced flows (uncomment to enable)

- **Silent refresh on 401** — in `lib/features/auth/client-auth.ts`,
  uncomment the `fetchWithRefresh` wrapper and use it instead of `fetch`
  for authenticated calls.
- **Role-based gating** — `/api/auth/me` returns `user.role`; see the
  commented `requireRole` helper in `lib/features/auth/verification.ts`.
- **Direct SDK identity checks** — set `VERIFY_API_KEY` and use
  `serverIdentity.checkUsers([...])` for batch/compliance flows; see
  `app/api/verify/require/route.ts`.

## Registering clients in production

Create the client in the platform console (OAuth apps) or via the admin
API. Public SPA/native clients use PKCE only; confidential (web server)
clients additionally receive a client secret — this example is a public
client by design.

## Learn more

- Platform docs: `docs/startups/keycloak-production-mode.md` in the
  [truemoi-dev](https://github.com/truemoi/truemoi-dev) repository —
  auth domain model, clean browser routes, branded login theme, and
  URL masking.
- SDK: [`@truemoi/sdk` on npm](https://www.npmjs.com/package/@truemoi/sdk)
