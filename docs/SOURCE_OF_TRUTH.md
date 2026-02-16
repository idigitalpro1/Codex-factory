# Source Of Truth

## Project
Next-Gen Digital Factory monorepo for:
- empire-courier.com
- VillagerMediaGroup.com

## Canonical Local Runtime
- Backend API: `http://localhost:8080`
- Backend Health: `http://localhost:8080/api/v1/health`
- Backend Feed: `http://localhost:8080/api/v1/feed/articles`
- Backend Mock AI: `http://localhost:8080/api/v1/ai/mock`
- Frontend Beta: `http://localhost:8090`

## Canonical Commands
From repo root (`/Users/Ace/Codex`):
```bash
make down || true
make up
make status
make health
```

## Process/Listener Rules
- PID files:
  - `.run/backend.pid`
  - `.run/frontend.pid`
- PID values must represent real listeners on configured ports.
- Listener checks use `lsof -tiTCP:<port> -sTCP:LISTEN`.
- Port ownership conflicts should fail fast instead of silently reusing unknown processes.

## Security Rules
- No secrets in repository.
- No hardcoded credentials.
- Use environment variables and cloud identity/OIDC for deployment.
