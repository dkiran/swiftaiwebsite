#!/usr/bin/env bash
# Build the site and upload it to an EC2 server running nginx (see docs/deployment.md).
# Usage: scripts/deploy-ec2.sh ubuntu@YOUR_SERVER_IP [path/to/key.pem]
set -euo pipefail

HOST="${1:?usage: scripts/deploy-ec2.sh user@host [path/to/key.pem]}"
KEY="${2:-}"
SSH_CMD="ssh"
[ -n "$KEY" ] && SSH_CMD="ssh -i $KEY"

# PUBLIC_FORM_ENDPOINT / PUBLIC_CHAT_ENDPOINT are read from .env at build time
npm ci
npm run build
npm run check
rsync -avz --delete -e "$SSH_CMD" dist/ "$HOST:/var/www/swiftai/"
echo "Deployed. Visit your site and hard-refresh."
