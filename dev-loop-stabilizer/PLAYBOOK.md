# Dev Loop Stabilizer Kit — PLAYBOOK

## Quickstart (canonical)
From the repo root of the target project:

```bash
make down || true
make up
make status
make health
```

If the frontend is a static beta host:
- open: `http://localhost:${FRONTEND_PORT}` (default `8090`)

If the frontend is Vite:
- open: `http://localhost:${FRONTEND_PORT}` (default `5173`)

## What this kit guarantees
- Deterministic `make up/down/status/health` lifecycle
- Listener-authoritative PID tracking (no wrapper PID drift)
- Port persistence via `ports.env`
- Safe port renegotiation on conflicts (no silent hijacking)
- Clear health diagnostics (what failed + where to look)

## Hard rules
- No secrets or hardcoded credentials.
- No sudo required.
- No port changes unless there is a proven conflict (kit will renegotiate and persist).

## Files & responsibilities

### `ports.env` (persisted ports)
Created on first run and reused thereafter.

Example:

```env
BACKEND_HOST=localhost
BACKEND_PORT=8080
FRONTEND_PORT=8090
```

If a preferred port is occupied, the kit:
1. Chooses a free port via `bin/portpick.sh`
2. Rewrites `ports.env`
3. Continues with the new stable ports

### PID files
- `.run/backend.pid` = PID of the actual listener on `BACKEND_PORT`
- `.run/frontend.pid` = PID of the actual listener on `FRONTEND_PORT`

Authority comes from:

```bash
lsof -tiTCP:<port> -sTCP:LISTEN
```

## Modes

### 1) Python + Static Frontend (`Makefile.stabilizer`)
Use when you have a backend API and a static beta UI.

Expected:
- Backend: `http://localhost:${BACKEND_PORT}` (default `8080`)
- Frontend: `http://localhost:${FRONTEND_PORT}` (default `8090`)

### 2) Node/Vite (`Makefile.node-vite`)
Use when frontend is Vite. Backend may be disabled.

Key env flags:
- `BACKEND_ENABLED=0` (default): backend disabled, `make health` prints "backend disabled"
- `NODE_AUTO_INSTALL=1` (default): attempts dependency install if Vite missing
- `NODE_AUTO_INSTALL=0`: fails fast with instruction to install deps manually
- `NODE_ALLOW_NPX=0` (default): does not use npx fallback
- `NODE_ALLOW_NPX=1`: allows `npx vite ...` fallback

Offline note:
- If machine cannot reach npm registry, auto-install fails with actionable output.
- Fix by installing deps on a connected network or using a local registry/cache.

## Validation checklist (operator)
Run and confirm each line produces expected behavior:

```bash
make down || true
make up
make status
make health
```

Confirm:
- `make status` prints selected ports + listener info
- `make health` prints selected host + JSON payload (or a clean backend-disabled message in node-vite mode)
- Browser UI loads and shows data (no "Failed to fetch")

## Failure triage (fast)

### A) Port already in use
- Kit should renegotiate and rewrite `ports.env`.
- If you need to stay on the original port, free it:

```bash
lsof -nP -iTCP:<port> -sTCP:LISTEN
kill <pid>
```

Then delete `ports.env` and rerun `make up` to re-pick defaults.

### B) Backend listens but health curl fails
Run:

```bash
make status
tail -n 80 .run/backend.log
```

Confirm backend is serving HTTP and not crashing on boot.

### C) Vite missing: `sh: vite: command not found`
Either:
- allow auto-install (default): `NODE_AUTO_INSTALL=1 make up`
- or install manually in frontend dir:

```bash
npm install
npm run dev
```

### D) Frontend loads but shows "Failed to fetch"
- Check backend health:

```bash
make health
```

- Confirm CORS origins allow the active frontend origin(s).
- Confirm frontend API base resolver selected a reachable host.

## Release guardrail
Agents must not run release git commands.
Do not execute: `git add`, `git commit`, `git tag`, `git push`.
For releases, output manual commands only and stop.

## Guide me during operation
If you paste output of these commands, next steps can be provided quickly:

```bash
cd /Users/Ace/Codex
make down || true
make up
make health
```
