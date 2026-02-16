## Dev Loop Stabilizer Kit

This repo supports a deterministic local lifecycle:

```bash
make down || true
make up
make status
make health
```

Expected defaults:
- Frontend: `http://localhost:8090`
- Backend health: `http://localhost:8080/api/v1/health`

Guardrails:
- No sudo assumptions.
- No secrets in source.
- Listener-verified PID files.
