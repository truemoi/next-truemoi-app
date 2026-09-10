#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# export-standalone.sh — produce the standalone next-truemoi-app repo
#
# Copies this example (tracked files only, no build artifacts) into a fresh
# git repo at $DST with the SDK dependency switched from the monorepo
# file: path to the published npm package, ready to push to
# github.com/truemoi/next-truemoi-app.
#
# Usage (from any checkout with push access to that repo):
#   examples/nextjs-oauth/scripts/export-standalone.sh /tmp/next-truemoi-app
#   cd /tmp/next-truemoi-app
#   git remote add origin https://github.com/truemoi/next-truemoi-app.git
#   git push -u origin main
#
# The standalone repo is a PUBLISHED COPY — development happens in this
# monorepo; never edit the standalone directly or the two drift apart.
#
# Env:
#   SDK_VERSION   npm spec for @truemoi/sdk (default ^0.0.2 — the version
#                 matching the monorepo SDK's API)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DST="${1:?destination dir required, e.g. /tmp/next-truemoi-app}"
SDK_VERSION="${SDK_VERSION:-^0.0.2}"

rm -rf "$DST"
mkdir -p "$DST"

cd "$SRC"
for f in $(git ls-files); do
  mkdir -p "$DST/$(dirname "$f")"
  cp "$f" "$DST/$f"
done

cd "$DST"
# Standalone: SDK comes from npm, not the monorepo file: path.
sed -i "s#\"@truemoi/sdk\": \"file:../../sdk\"#\"@truemoi/sdk\": \"${SDK_VERSION}\"#" package.json
# Rewrite monorepo-relative doc links to their canonical public locations.
sed -i 's#\([a-zA-Z -]*\)\](\.\./\.\./sdk)#\1](https://www.npmjs.com/package/@truemoi/sdk)#g' README.md || true
sed -i 's#](\.\./\.\./docs/[^)]*)#](https://github.com/truemoi/truemoi-dev/tree/main/docs/startups)#g' README.md || true
# Regenerate the lockfile against the npm dependency (the monorepo lockfile
# pins file:../../sdk and would fail a frozen-lockfile CI install).
pnpm install --lockfile-only >/dev/null 2>&1 || true

git init -q -b main
git add -A
git -c user.name="truemoi" -c user.email="mail.truemoi@gmail.com" commit -q -m \
  "Truemoi Next.js example: OAuth 2.1 + PKCE, auth-guarded dashboard, identity verification

Production-shaped reference app for the Truemoi identity platform:
- OAuth 2.1 authorization-code flow with PKCE (S256) and CSRF state binding
- httpOnly cookie sessions, silent refresh, full IdP logout
- Edge auth guard (pure, unit-tested decision logic)
- Auth-guarded dashboard with live verification status + gated API example
- Feature-first structure (lib/features/auth) ready to scale into other features

Built on @truemoi/sdk. Register the example client with scripts/register-client.sh."

echo "✓ Standalone repo created at $DST (SDK: @truemoi/sdk@${SDK_VERSION})"
echo "  Next:"
echo "    cd $DST"
echo "    git remote add origin https://github.com/truemoi/next-truemoi-app.git"
echo "    git push -u origin main"
