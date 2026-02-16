# Dev Loop Stabilizer Playbook

## Objective
Keep local development deterministic with listener-backed process checks and explicit runbook commands.

## Required Artifacts
- `AGENTS.md`
- `docs/SOURCE_OF_TRUTH.md`
- `Makefile` with `up`, `down`, `status`, `health`
- `ports.env` (persisted selected ports when conflicts occur)

## Operator Flow (Aileen)
1. Keep edits narrow and scoped to the stabilization request.
2. Validate in this order:
   - `make down || true`
   - `make up`
   - `make status`
   - `make health`
3. Capture proof:
   - selected ports from `ports.env`
   - listener output from `lsof`
   - health output (or backend-disabled message)
4. Stop before release actions and provide manual git commands only.

## Validation Checklist
1. `make down || true`
2. `make up`
3. `make status`
4. `make health`

## Triage
- Port occupied:
  - Confirm with `lsof -nP -iTCP:<port> -sTCP:LISTEN`.
  - If unknown owner, renegotiate to a free port and rewrite `ports.env`.
- Frontend cannot reach backend:
  - Verify backend health endpoint.
  - Check frontend API fallback order and `window.API_BASE` override.
  - Verify CORS origin list.
- PID drift:
  - Regenerate PID files from live listeners via `lsof`.

## Scope Discipline
- Keep changes minimal and focused on local stability.
- Avoid unrelated refactoring during stabilization work.
