#!/bin/bash
set -e

cd "$(dirname "$0")/.."

ZIP="deploy/api.zip"
STAGING="deploy/_stage"

echo "==> Building Lambda package..."
rm -rf "$STAGING" "$ZIP"
mkdir -p "$STAGING"

# Copy code, exclude heavy/unnecessary dirs
rsync -a \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=deploy \
  --exclude=.env* \
  --exclude=server.log \
  --exclude=.husky \
  --exclude='*.md' \
  . "$STAGING/"

# Install only production deps in staging
cd "$STAGING"
npm install --production 2>&1
cd ..

# Zip from staging
cd "$STAGING"
zip -r "../$ZIP" . 2>&1
cd ..

# Clean up
rm -rf "$STAGING"

echo "==> Done: $(ls -lh "$ZIP" | awk '{print $5}')"
