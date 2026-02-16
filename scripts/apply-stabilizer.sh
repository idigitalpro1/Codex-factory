#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-$(pwd)}"
TEMPLATES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/templates"

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "[error] target directory does not exist: $TARGET_DIR" >&2
  exit 1
fi

copy_if_missing() {
  local src="$1"
  local dst="$2"

  if [[ -f "$dst" ]]; then
    echo "[skip] exists: $dst"
  else
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "[add] $dst"
  fi
}

copy_if_missing "$TEMPLATES_DIR/AGENTS.md.template" "$TARGET_DIR/AGENTS.md"
copy_if_missing "$TEMPLATES_DIR/SOURCE_OF_TRUTH.md.template" "$TARGET_DIR/docs/SOURCE_OF_TRUTH.md"
copy_if_missing "$TEMPLATES_DIR/Makefile.stabilizer" "$TARGET_DIR/Makefile"

SNIPPET_TARGET="$TARGET_DIR/docs/README_STABILIZER_SNIPPET.md"
mkdir -p "$(dirname "$SNIPPET_TARGET")"
cp "$TEMPLATES_DIR/README_STABILIZER_SNIPPET.md" "$SNIPPET_TARGET"
echo "[write] $SNIPPET_TARGET"

echo "[done] stabilizer templates applied"
