#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# register-client.sh — register the example's OAuth client in Keycloak
#
# Run from the truemoi repo root (reads KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD
# from .env) or with explicit env vars. Mirrors exactly what the platform
# console does when a developer creates an OAuth app.
#
# Usage:
#   ./scripts/register-client.sh                       # uses repo .env
#   KEYCLOAK_ADMIN_PASSWORD=... ./scripts/register-client.sh
#
# Env overrides:
#   NEXT_PUBLIC_REDIRECT_URI   callback URL (default http://localhost:3000/auth/callback)
#   KEYCLOAK_INTERNAL_ENDPOINT admin API base (default http://localhost:8080)
#   KEYCLOAK_REALM             target realm (default truemoi)
#   NEW_CLIENT_ID              client id (default truemoi-example)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load .env without eval-sourcing surprises: only read the two vars we need.
if [[ -z "${KEYCLOAK_ADMIN_PASSWORD:-}" && -f "$REPO_ROOT/.env" ]]; then
  KEYCLOAK_ADMIN="$(grep -E '^KEYCLOAK_ADMIN=' "$REPO_ROOT/.env" | head -1 | cut -d= -f2- || true)"
  KEYCLOAK_ADMIN_PASSWORD="$(grep -E '^KEYCLOAK_ADMIN_PASSWORD=' "$REPO_ROOT/.env" | head -1 | cut -d= -f2- || true)"
fi

KC="${KEYCLOAK_INTERNAL_ENDPOINT:-http://localhost:8080}"
REALM="${KEYCLOAK_REALM:-truemoi}"
CLIENT_ID="${NEW_CLIENT_ID:-truemoi-example}"
REDIRECT_URI="${NEXT_PUBLIC_REDIRECT_URI:-http://localhost:3000/auth/callback}"
ORIGIN="${REDIRECT_URI%/auth/callback}"

: "${KEYCLOAK_ADMIN:=admin}"
: "${KEYCLOAK_ADMIN_PASSWORD:=}"

if [[ -z "$KEYCLOAK_ADMIN_PASSWORD" ]]; then
  echo "✗ KEYCLOAK_ADMIN_PASSWORD not set (export it or run from the truemoi repo root)" >&2
  exit 1
fi

echo "▸ Authenticating against $KC (realm: $REALM)"
TOKEN=$(curl -sf -X POST "$KC/realms/master/protocol/openid-connect/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN}&password=${KEYCLOAK_ADMIN_PASSWORD}" \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [[ -z "$TOKEN" ]]; then
  echo "✗ Could not obtain admin token — check KEYCLOAK_ADMIN_PASSWORD" >&2
  exit 1
fi

PAYLOAD=$(cat <<EOF
{
  "clientId": "${CLIENT_ID}",
  "name": "Truemoi Next.js Example",
  "description": "Reference OAuth 2.1 + PKCE web app from truemoi/next-truemoi-app",
  "protocol": "openid-connect",
  "publicClient": true,
  "rootUrl": "${ORIGIN}",
  "redirectUris": ["${REDIRECT_URI}"],
  "webOrigins": ["${ORIGIN}"],
  "attributes": {
    "pkce.code.challenge.method": "S256",
    "post.logout.redirect.uris": "${ORIGIN}/*"
  },
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false,
  "defaultClientScopes": ["openid", "email", "profile", "offline_access"]
}
EOF
)

STATUS=$(curl -s -o /tmp/rc-body.txt -w '%{http_code}' -X POST \
  "$KC/admin/realms/${REALM}/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD")

case "$STATUS" in
  201) echo "✅ Created client '$CLIENT_ID' (redirect: $REDIRECT_URI)" ;;
  409) echo "ℹ️  Client '$CLIENT_ID' already exists — updating redirect URIs"
       INTERNAL_ID=$(curl -sf "$KC/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}" \
         -H "Authorization: Bearer $TOKEN" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
       curl -sf -X PUT "$KC/admin/realms/${REALM}/clients/$INTERNAL_ID" \
         -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$PAYLOAD" \
         && echo "✅ Updated client '$CLIENT_ID'" ;;
  *)   echo "✗ Failed ($STATUS): $(cat /tmp/rc-body.txt)" >&2; exit 1 ;;
esac

echo
echo "Next steps:"
echo "  cd $SCRIPT_DIR/.."
echo "  cp .env.example .env.local   # NEXT_PUBLIC_AUTH_CLIENT_ID=${CLIENT_ID}"
echo "  pnpm dev                     # open http://localhost:3000"
