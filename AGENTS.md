# AGENTS Rules

This file defines repository-local guardrails for human and AI contributors.

## Scope
- Applies to the full monorepo at `/Users/Ace/Codex`.

## Safety
- Never add secrets, API keys, tokens, or credentials to source control.
- Use environment variables for runtime configuration.
- Prefer least-privilege actions and non-destructive commands.
- Do not use sudo on local machine unless a human explicitly requests it.
- Remote sudo on the production server is OK when scoped to deployment tasks.

## Change Policy
- Keep changes minimal and targeted to the requested outcome.
- Preserve module boundaries (`backend`, `frontend`, `docs`, `.github`).
- Avoid unrelated refactors while fixing operational issues.
- Update docs when behavior or run commands change.

## Production
- Domain: `https://5280.menu`
- Server: AWS Lightsail `44.236.197.183` (Plesk, Apache reverse proxy)
- Ports 8080/8090 are internal only — do not expose publicly.
- SSL is managed by Plesk — do not modify SSL configuration.
- Deploy via `~/deploy.sh` on server or push to `main` (CI auto-deploys).

## Local Dev Expectations
- Backend API listens on port `8080`.
- Frontend dev static host listens on port `8090` by default.
- `make up`, `make down`, `make status`, and `make health` are canonical lifecycle commands.

## Validation
- Verify listeners with `lsof -tiTCP:<port> -sTCP:LISTEN`.
- Verify backend health with `GET /api/v1/health`.
- Keep PID files under `.run/` and ensure they point to real listening processes.

## Build Mode
- In build mode, Claude may execute git commands, modify code, and deploy.
- Build mode is activated by the operator explicitly.
- Outside build mode, output manual commands only and stop.

## Boundaries (Always Apply)
- Do not modify DNS or domain configuration without explicit operator approval.
- Do not change firewall rules or port exposure without explicit operator approval.
- Do not modify Plesk configuration without explicit operator approval.
- Do not create new domains in Plesk.
