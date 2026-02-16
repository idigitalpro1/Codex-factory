# Next-Gen Digital Factory

Bootstrap structure for:
- empire-courier.com
- VillagerMediaGroup.com

## Project Layout
- `backend/`: Flask API (`/api/v1/health`, `/api/v1/feed/articles`, `/api/v1/ai/mock`)
- `frontend/beta/`: static beta app
- `docs/workflows/`: cloud deployment runbooks
- `.github/workflows/`: minimal CI/CD pipeline

## Local Run (One Command Lifecycle)
From repo root (`/Users/Ace/Codex`):

```bash
make down || true
make up
make status
make health
```

## Expected Local URLs
- Frontend beta: `http://localhost:8090`
- Backend API base: `http://localhost:8080/api/v1`
- Health endpoint: `http://localhost:8080/api/v1/health`

## Frontend API Resolution
`frontend/beta/app.js` uses:
1. `window.API_BASE` if provided.
2. Fallback probes in order:
   - `http://localhost:8080/api/v1`
   - `http://127.0.0.1:8080/api/v1`
   - `http://[::1]:8080/api/v1`

## Docker Mode

Run the same stack via Docker Compose (same ports, no native dependencies needed):

```bash
docker compose up -d --build
docker compose ps
curl -sS http://127.0.0.1:8080/api/v1/health
open http://127.0.0.1:8090
docker compose down
```

Or use Make targets:

```bash
make docker-up
make docker-status
make docker-health
make docker-down
```

## Security Notes
- No secrets checked into source control.
- No hardcoded credentials.
- Use environment variables and cloud identity federation for deployment authentication.
