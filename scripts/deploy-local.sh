#!/usr/bin/env bash
# Run ON THE SERVER from the git clone: pull the latest code, build, publish the website and the API, restart, check health.
# Usage: scripts/deploy-local.sh
# Needs Node 20+, git, and the one-time setup in docs/deployment.md.
# Testing overrides: WEB_DIR=/tmp/web API_DIR=/tmp/api PREV_DIR=/tmp/prev NO_PULL=1 SKIP_RESTART=1 scripts/deploy-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
WEB_DIR="${WEB_DIR:-/var/www/swiftai}"
API_DIR="${API_DIR:-/opt/swiftai-api}"
PREV_DIR="${PREV_DIR:-$HOME/.swiftai-prev}"

# one deploy at a time
exec 9>"${LOCK_FILE:-/tmp/swiftai-deploy.lock}"
flock -n 9 || { echo "Another deploy is already running."; exit 1; }

[ -z "${NO_PULL:-}" ] && git pull --ff-only
echo "Deploying commit $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"

# build first: if anything fails here, nothing live is touched
npm ci --no-audit --no-fund
npm run build
npm run check
npm run build:server
cp server/package.deploy.json server/dist/package.json

# keep the previous version for rollback (scripts/rollback-local.sh)
rm -rf "$PREV_DIR" && mkdir -p "$PREV_DIR/web" "$PREV_DIR/api"
[ -d "$WEB_DIR" ] && cp -a "$WEB_DIR/." "$PREV_DIR/web/" || true
[ -f "$API_DIR/main.mjs" ] && cp -a "$API_DIR/main.mjs" "$PREV_DIR/api/main.mjs" || true

# publish
mkdir -p "$WEB_DIR" "$API_DIR"
find "$WEB_DIR" -mindepth 1 -delete
cp -a dist/. "$WEB_DIR/"
find "$API_DIR" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
cp -a server/dist/. "$API_DIR/"
(cd "$API_DIR" && npm install --omit=dev --no-audit --no-fund)

if [ -z "${SKIP_RESTART:-}" ]; then
  sudo systemctl restart swiftai-api
  sleep 2
  curl -fsS http://127.0.0.1:3100/api/health && echo || echo "WARNING: the API did not answer. See: sudo journalctl -u swiftai-api -n 50 --no-pager"
  curl -fsS -o /dev/null -H "Host: swift-ai.in" http://127.0.0.1/ && echo "Website answers through nginx." || echo "WARNING: nginx did not serve the website yet (check the nginx step in docs/deployment.md)."
fi
echo "Done: website in $WEB_DIR, API in $API_DIR. Previous version saved in $PREV_DIR (roll back with scripts/rollback-local.sh)."
