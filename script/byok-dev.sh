#!/usr/bin/env bash
set -euo pipefail

if [[ -f ".env" ]]; then
  echo "Loading .env..."
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
else
  echo "No .env found. Copy .env.example to .env if you want BYOK variables."
fi

echo "Building development bundle..."
yarn build:dev

echo "Starting Open Desktop..."
yarn start
