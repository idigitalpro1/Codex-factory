# Dev Loop Stabilizer Kit Playbook

Quickstart:
`bash dev-loop-stabilizer/apply-stabilizer.sh .`

## Constraints
- No sudo.
- No secrets.
- No port changes unless conflict proven.

## Validation Checklist
1. `make down || true`
2. `make up`
3. `make status` (verify listeners)
4. `make health` (verify JSON)
5. `open http://localhost:8090` (verify UI)

## Failure Triage
### Port already in use
- `lsof -nP -iTCP:<port> -sTCP:LISTEN`
- Decide: stop owned process OR choose alternate port (only if necessary)

### Health fails
- Tail backend log: `.run/backend.log`
- Confirm backend started and binds correct interface/port
- Confirm endpoint path is `/api/v1/health`

### PID drift
- Ensure PID files are written using listener PID from `lsof`, not `$$!`
