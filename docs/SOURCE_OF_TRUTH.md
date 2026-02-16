# Source Of Truth

## Project
Next-Gen Digital Factory monorepo for:
- empire-courier.com
- VillagerMediaGroup.com

## Canonical Local Runtime
- Backend API: `http://localhost:8080`
- Backend Health: `http://localhost:8080/api/v1/health`
- Backend Brands: `http://localhost:8080/api/v1/brands`
- Backend Brand Detail: `http://localhost:8080/api/v1/brands/<slug>`
- Backend Feed: `http://localhost:8080/api/v1/feed/articles`
- Backend Admin: `http://localhost:8080/api/v1/admin/articles`
- Backend Mock AI: `http://localhost:8080/api/v1/ai/mock`
- Frontend Beta: `http://localhost:8090`

## Brand Registry
Brands are defined in `backend/app/services/brand_registry.py`.
Each brand has: slug, name, site_domain, tagline, primary_color, logo_text, enabled.

```bash
# List all brands with metadata + counts
curl -sS http://localhost:8080/api/v1/brands

# Get single brand config
curl -sS http://localhost:8080/api/v1/brands/empire-courier
```

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
