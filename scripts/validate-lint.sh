#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

lint_script="$(node -p "const p=require('./package.json'); p.scripts && p.scripts.lint ? p.scripts.lint : ''")"

if [[ -z "$lint_script" ]]; then
  echo "ERROR: Missing 'lint' script in package.json."
  echo "Add it before committing, for example:"
  echo '  "lint": "eslint . --ext .ts,.tsx"'
  exit 1
fi

echo "Running lint..."
npm run lint
