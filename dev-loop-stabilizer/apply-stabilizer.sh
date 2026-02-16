#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
MODE="${2:-python}"
KIT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "$MODE" in
  python|node-vite|mixed) ;;
  *)
    echo "[error] mode must be one of: python | node-vite | mixed" >&2
    exit 1
    ;;
esac

mkdir -p "$ROOT/templates" "$ROOT/docs" "$ROOT/.github/workflows" "$ROOT/.run" "$ROOT/bin" >/dev/null 2>&1 || true

# Copy protocol docs
cp -f "$KIT_DIR/templates/AGENTS.md" "$ROOT/AGENTS.md"
mkdir -p "$ROOT/docs"
cp -f "$KIT_DIR/templates/docs/SOURCE_OF_TRUTH.md" "$ROOT/docs/SOURCE_OF_TRUTH.md"

# Install all makefile templates so mode can be switched later
cp -f "$KIT_DIR/templates/Makefile.stabilizer" "$ROOT/Makefile.stabilizer"
cp -f "$KIT_DIR/templates/Makefile.node-vite" "$ROOT/Makefile.node-vite"

# Shared helper + ports config
cp -f "$KIT_DIR/bin/portpick.sh" "$ROOT/bin/portpick.sh"
chmod +x "$ROOT/bin/portpick.sh"
cp -f "$KIT_DIR/templates/ports.env.example" "$ROOT/ports.env.example"
if [ ! -f "$ROOT/ports.env" ]; then
  cp -f "$ROOT/ports.env.example" "$ROOT/ports.env"
fi

# Ensure ports.env is gitignored
if [ -f "$ROOT/.gitignore" ]; then
  grep -qxF 'ports.env' "$ROOT/.gitignore" || echo 'ports.env' >> "$ROOT/.gitignore"
else
  echo 'ports.env' > "$ROOT/.gitignore"
fi

# Create root Makefile only if missing
if [ ! -f "$ROOT/Makefile" ]; then
  case "$MODE" in
    python)
      cat > "$ROOT/Makefile" <<'MAKE_EOF'
BACKEND_START_CMD ?= cd backend && .venv/bin/python run.py
FRONTEND_START_CMD ?= cd frontend/beta && python3 -m http.server "$${FRONTEND_PORT}"

include Makefile.stabilizer
MAKE_EOF
      cp -f "$KIT_DIR/templates/README_SNIPPET.md" "$ROOT/templates/README_SNIPPET.md"
      ;;
    node-vite)
      cat > "$ROOT/Makefile" <<'MAKE_EOF'
BACKEND_ENABLED ?= 0
FRONTEND_DIR ?= frontend

include Makefile.node-vite
MAKE_EOF
      cp -f "$KIT_DIR/templates/README_SNIPPET.node-vite.md" "$ROOT/templates/README_SNIPPET.node-vite.md"
      ;;
    mixed)
      cat > "$ROOT/Makefile" <<'MAKE_EOF'
BACKEND_ENABLED ?= 1
BACKEND_START_CMD ?= cd backend && .venv/bin/python run.py
FRONTEND_DIR ?= frontend

include Makefile.node-vite
MAKE_EOF
      cp -f "$KIT_DIR/templates/README_SNIPPET.node-vite.md" "$ROOT/templates/README_SNIPPET.node-vite.md"
      ;;
  esac
else
  # Non-destructive: provide snippets only
  cp -f "$KIT_DIR/templates/README_SNIPPET.md" "$ROOT/templates/README_SNIPPET.md"
  cp -f "$KIT_DIR/templates/README_SNIPPET.node-vite.md" "$ROOT/templates/README_SNIPPET.node-vite.md"
fi

# Playbook + changelog
cp -f "$KIT_DIR/PLAYBOOK.md" "$ROOT/PLAYBOOK.md"
cp -f "$KIT_DIR/CHANGELOG.md" "$ROOT/CHANGELOG.md"

# CI enforcement workflow
cp -f "$KIT_DIR/.github/workflows/stabilizer-enforce.yml" "$ROOT/.github/workflows/stabilizer-enforce.yml"

echo "[ok] Installed Dev Loop Stabilizer Kit into: $ROOT"
echo "[mode] $MODE"
echo "[next] Run: make up"
