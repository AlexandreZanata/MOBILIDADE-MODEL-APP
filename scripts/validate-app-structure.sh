#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

echo "Validating app structure..."

required_dirs=(
  "src/models"
  "src/types"
  "src/services"
  "src/hooks"
  "src/screens"
  "src/components/atoms"
  "src/components/molecules"
  "src/components/organisms"
  "src/i18n"
)

for dir in "${required_dirs[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "ERROR: Required directory is missing: $dir"
    exit 1
  fi
done

# Global state can be implemented with Redux slices or Context.
if [[ ! -d "src/store/slices" && ! -d "src/context" ]]; then
  echo "ERROR: Missing global state structure."
  echo "Expected at least one of: src/store/slices or src/context"
  exit 1
fi

# Navigation can be folder-based or app-entry based.
if [[ ! -d "src/navigation" && ! -f "App.tsx" ]]; then
  echo "ERROR: Missing navigation entrypoint."
  echo "Expected src/navigation directory or App.tsx at repository root."
  exit 1
fi

echo "Checking architectural boundaries in UI layers..."

mapfile -t staged_src_files < <(git diff --cached --name-only --diff-filter=ACMRTUXB -- "src/**" | tr -d '\r')

if [[ ${#staged_src_files[@]} -eq 0 ]]; then
  echo "No staged source files found for architecture checks."
  echo "App structure validation passed."
  exit 0
fi

ui_layer_files=()
for file in "${staged_src_files[@]}"; do
  if [[ "$file" == src/components/* || "$file" == src/screens/* || "$file" == src/hooks/* ]]; then
    ui_layer_files+=("$file")
  fi
done

if [[ ${#ui_layer_files[@]} -gt 0 ]]; then
  ui_network_matches="$(git grep -nE "(axios|fetch\\(|new WebSocket|socket\\.io|io\\()" -- "${ui_layer_files[@]}" || true)"
  if [[ -n "$ui_network_matches" ]]; then
    echo "ERROR: Direct network/realtime usage found in staged UI-layer files."
    echo "Move network/socket calls to services/facades."
    echo "$ui_network_matches"
    exit 1
  fi
fi

echo "Checking for explicit any usage in staged source files..."

any_matches="$(git grep -nE "(:[[:space:]]*any\\b|<any>|\\bas[[:space:]]+any\\b)" -- "${staged_src_files[@]}" || true)"
if [[ -n "$any_matches" ]]; then
  echo "ERROR: Explicit 'any' usage found in staged files."
  echo "$any_matches"
  exit 1
fi

echo "App structure validation passed."
