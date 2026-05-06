#!/usr/bin/env bash

set -euo pipefail

commit_msg_file="${1:-}"
if [[ -z "$commit_msg_file" || ! -f "$commit_msg_file" ]]; then
  echo "ERROR: Commit message file not found."
  exit 1
fi

commit_msg="$(tr -d '\r' < "$commit_msg_file" | sed -e '/^#/d' -e '/^$/d' | head -n 1)"

if [[ -z "$commit_msg" ]]; then
  echo "ERROR: Empty commit message."
  exit 1
fi

conventional_regex='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9._/-]+\))?!?: .{1,}$'

if [[ ! "$commit_msg" =~ $conventional_regex ]]; then
  echo "ERROR: Commit message must follow Conventional Commits."
  echo "Expected: type(scope): subject"
  echo "Example: docs(websocket): standardize English docs structure"
  echo "Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo "Received: $commit_msg"
  exit 1
fi

echo "Commit message validation passed."
