#!/bin/sh
set -e

if [ "$RUN_SEED" = "true" ]; then
  echo "[START] Running database seed..."
  node dist/database/seed.js || echo "[START] Seed skipped or already applied"
fi

echo "[START] Starting API..."
exec node dist/main.js
