#!/usr/bin/env bash
# Builds everything and bundles it into release/swiftai-release.tar.gz (website files + API + config + schema).
# Upload that one file to the server (see docs/deployment.md "Option 0") so the server never has to build anything.
set -euo pipefail
cd "$(dirname "$0")/.."

npm ci
npm run build
npm run check
npm run test:server
npm run build:server

rm -rf release && mkdir -p release/pkg/site release/pkg/api release/pkg/db release/pkg/config release/pkg/docs
cp -a dist/. release/pkg/site/
cp server/dist/main.mjs release/pkg/api/main.mjs
cp server/package.deploy.json release/pkg/api/package.json
cp server/schema.sql release/pkg/db/
cp deploy/nginx-swiftai.conf deploy/swiftai-api.service deploy/server.env.example release/pkg/config/
cp docs/deployment.md release/pkg/docs/
tar -C release/pkg -czf release/swiftai-release.tar.gz .
echo "Built release/swiftai-release.tar.gz"
