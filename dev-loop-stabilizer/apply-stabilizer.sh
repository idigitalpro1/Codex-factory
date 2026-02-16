#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
KIT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$ROOT/templates" "$ROOT/docs" "$ROOT/.github/workflows" "$ROOT/.run" >/dev/null 2>&1 || true

# Copy protocol docs
cp -f "$KIT_DIR/templates/AGENTS.md" "$ROOT/AGENTS.md"
mkdir -p "$ROOT/docs"
cp -f "$KIT_DIR/templates/docs/SOURCE_OF_TRUTH.md" "$ROOT/docs/SOURCE_OF_TRUTH.md"

# Makefile: install as Makefile.stabilizer + optional include pattern
cp -f "$KIT_DIR/templates/Makefile.stabilizer" "$ROOT/Makefile.stabilizer"

# Optional: if repo has no Makefile, create one that includes stabilizer
if [ ! -f "$ROOT/Makefile" ]; then
  cat > "$ROOT/Makefile" <<'MAKE_EOF'
# Project Makefile
# Customize BACKEND_START_CMD for your repo, then:
#   make up / make down / make status / make health

BACKEND_START_CMD ?=
FRONTEND_START_CMD ?=

include Makefile.stabilizer
MAKE_EOF
fi

# README snippet (does not auto-insert; avoids clobber)
cp -f "$KIT_DIR/templates/README_SNIPPET.md" "$ROOT/templates/README_SNIPPET.md"

# Playbook + changelog
cp -f "$KIT_DIR/PLAYBOOK.md" "$ROOT/PLAYBOOK.md"
cp -f "$KIT_DIR/CHANGELOG.md" "$ROOT/CHANGELOG.md"

# CI enforcement workflow
cp -f "$KIT_DIR/.github/workflows/stabilizer-enforce.yml" "$ROOT/.github/workflows/stabilizer-enforce.yml"

echo "[ok] Installed Dev Loop Stabilizer Kit into: $ROOT"
echo "[next] Set BACKEND_START_CMD in Makefile (or env) and run: make up"
