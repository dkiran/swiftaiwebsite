#!/usr/bin/env bash
# Restore the version saved by the last scripts/deploy-local.sh run (website files and the API bundle).
set -euo pipefail
WEB_DIR="${WEB_DIR:-/var/www/swiftai}"
API_DIR="${API_DIR:-/opt/swiftai-api}"
PREV_DIR="${PREV_DIR:-$HOME/.swiftai-prev}"
[ -d "$PREV_DIR/web" ] || { echo "No previous version saved in $PREV_DIR"; exit 1; }
find "$WEB_DIR" -mindepth 1 -delete
cp -a "$PREV_DIR/web/." "$WEB_DIR/"
[ -f "$PREV_DIR/api/main.mjs" ] && cp -a "$PREV_DIR/api/main.mjs" "$API_DIR/main.mjs"
[ -z "${SKIP_RESTART:-}" ] && sudo systemctl restart swiftai-api
echo "Rolled back to the previous version."
