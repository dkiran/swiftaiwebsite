#!/usr/bin/env bash
# Deploy FROM the server itself, from a clone of the repository (alternative to uploading a package).
# Needs Node 20+, git, and the one-time setup in docs/deployment.md. Run: scripts/deploy-local.sh
# Override paths for testing: WEB_DIR=/tmp/web API_DIR=/tmp/api SKIP_RESTART=1 scripts/deploy-local.sh
set -euo pipefail
cd "$(dirname "$0")/.."
WEB_DIR="${WEB_DIR:-/var/www/swiftai}"
API_DIR="${API_DIR:-/opt/swiftai-api}"

npm ci
npm run build
npm run check
npm run build:server
cp server/package.deploy.json server/dist/package.json

mkdir -p "$WEB_DIR" "$API_DIR"
find "$WEB_DIR" -mindepth 1 -delete
cp -a dist/. "$WEB_DIR/"
find "$API_DIR" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
cp -a server/dist/. "$API_DIR/"
(cd "$API_DIR" && npm install --omit=dev --no-audit --no-fund)

if [ -z "${SKIP_RESTART:-}" ]; then
  sudo systemctl restart swiftai-api
  sleep 2
  curl -fsS http://127.0.0.1:3100/api/health && echo
fi
echo "Deployed website to $WEB_DIR and API to $API_DIR"
