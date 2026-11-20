#!/usr/bin/env bash
# Build the API and upload it to the server, then restart it. Run docs/deployment.md "API service" steps once first.
# Usage: scripts/deploy-api.sh ubuntu@YOUR_SERVER_IP [path/to/key.pem]
set -euo pipefail

HOST="${1:?usage: scripts/deploy-api.sh user@host [path/to/key.pem]}"
KEY="${2:-}"
SSH_CMD="ssh"; [ -n "$KEY" ] && SSH_CMD="ssh -i $KEY"

npm ci
npm run test:server
npm run build:server
cp server/package.deploy.json server/dist/package.json
rsync -avz --delete --exclude node_modules -e "$SSH_CMD" server/dist/ "$HOST:/opt/swiftai-api/"
$SSH_CMD "$HOST" "cd /opt/swiftai-api && npm install --omit=dev --no-audit --no-fund && sudo systemctl restart swiftai-api && sleep 2 && curl -fsS http://127.0.0.1:3100/api/health && echo"
