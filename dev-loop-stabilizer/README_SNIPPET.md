## Dev Loop Stabilizer Kit

Deterministic local lifecycle:

```bash
make down || true
make up
make status
make health
```

Default URLs:
- Frontend: http://localhost:8090
- Backend health: http://localhost:8080/api/v1/health

Ports are persisted in `ports.env`; conflicts trigger renegotiation and rewrite.
