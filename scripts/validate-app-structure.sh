#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

echo "Validating app structure..."

required_dirs=(
  "src/models"
  "src/types"
  "src/store/slices"
  "src/services"
  "src/hooks"
  "src/screens"
  "src/components/atoms"
  "src/components/molecules"
  "src/components/organisms"
  "src/navigation"
  "src/i18n"
)

for dir in "${required_dirs[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "ERROR: Required directory is missing: $dir"
    exit 1
  fi
done

echo "Checking architectural boundaries in UI layers..."

ui_network_matches="$(rg -n --no-heading "(axios|fetch\\(|new WebSocket|socket\\.io|io\\()" src/components src/screens src/hooks || true)"
if [[ -n "$ui_network_matches" ]]; then
  echo "ERROR: Direct network/realtime usage found in UI layers."
  echo "Move network/socket calls to services/facades."
  echo "$ui_network_matches"
  exit 1
fi

echo "Checking for explicit any usage..."

any_matches="$(rg -n --no-heading "(:\\s*any\\b|<any>|\\bas\\s+any\\b)" src || true)"
if [[ -n "$any_matches" ]]; then
  echo "ERROR: Explicit 'any' usage found."
  echo "$any_matches"
  exit 1
fi

echo "App structure validation passed."
