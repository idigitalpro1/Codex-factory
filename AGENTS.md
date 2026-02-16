# AGENTS Rules

This file defines repository-local guardrails for human and AI contributors.

## Scope
- Applies to the full monorepo at `/Users/Ace/Codex`.

## Safety
- Never add secrets, API keys, tokens, or credentials to source control.
- Use environment variables for runtime configuration.
- Prefer least-privilege actions and non-destructive commands.
- Do not use sudo unless a human explicitly requests it.

## Change Policy
- Keep changes minimal and targeted to the requested outcome.
- Preserve module boundaries (`backend`, `frontend`, `docs`, `.github`).
- Avoid unrelated refactors while fixing operational issues.
- Update docs when behavior or run commands change.

## Local Dev Expectations
- Backend API listens on port `8080`.
- Frontend dev static host listens on port `8090` by default.
- `make up`, `make down`, `make status`, and `make health` are canonical lifecycle commands.

## Validation
- Verify listeners with `lsof -tiTCP:<port> -sTCP:LISTEN`.
- Verify backend health with `GET /api/v1/health`.
- Keep PID files under `.run/` and ensure they point to real listening processes.
