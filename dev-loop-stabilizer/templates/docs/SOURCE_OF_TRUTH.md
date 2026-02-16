# Source Of Truth

## Canonical Local Runtime
- Backend: http://localhost:8080
- Health: http://localhost:8080/api/v1/health
- Frontend: http://localhost:8090

## Canonical Commands
```bash
make down || true
make up
make status
make health
```

## Lifecycle Rules
- PID files:
  - `.run/backend.pid`
  - `.run/frontend.pid`
- Listener checks must use:
  - `lsof -tiTCP:<port> -sTCP:LISTEN`
- If a port is in use, fail fast and instruct how to free it.
