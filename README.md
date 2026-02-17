# Next-Gen Digital Factory

Multi-brand publishing engine for:
- empire-courier.com
- VillagerMediaGroup.com

## Production

- **Live:** https://5280.menu
- **API:** https://5280.menu/api/v1/health
- **Server:** AWS Lightsail (`44.236.197.183`, Plesk)
- **SSL:** Let's Encrypt via Plesk
- **Routing:** Apache reverse proxy → Docker containers (internal only)

## Project Layout
- `backend/`: Flask API (`/api/v1/health`, `/api/v1/brands`, `/api/v1/feed/articles`, `/api/v1/admin/articles`, `/api/v1/ai/mock`)
- `frontend/beta/`: static beta app with admin panel
- `docs/`: SOURCE_OF_TRUTH, PLAYBOOK, deployment docs
- `.github/workflows/`: CI/CD pipeline with auto-deploy

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Service health check |
| `/api/v1/brands` | GET | All brands with metadata + counts |
| `/api/v1/brands/<slug>` | GET | Single brand config |
| `/api/v1/feed/articles` | GET | Published articles (supports `?brand=`, `?limit=`, `?offset=`) |
| `/api/v1/admin/articles` | GET | All articles (supports `?brand=`, `?status=`) |
| `/api/v1/admin/articles` | POST | Create draft article |
| `/api/v1/admin/articles/<id>` | PATCH | Update article (title, body, status) |
| `/api/v1/ai/mock` | POST | Mock AI endpoint |

## Brand Identity Layer

The stack serves multiple brands from a single API. Brand metadata (name, tagline, color) is defined in `backend/app/services/brand_registry.py`.

- Frontend dynamically themes (header, color, tagline) when a brand is selected

## Local Run

From repo root (`/Users/Ace/Codex`):

```bash
make down || true
make up
make status
make health
```

### Expected Local URLs
- Frontend beta: `http://localhost:8090`
- Backend API: `http://localhost:8080/api/v1`

## Docker Mode

```bash
docker compose up -d --build
docker compose ps
curl -sS http://127.0.0.1:8080/api/v1/health
open http://127.0.0.1:8090
docker compose down
```

Or use Make targets: `make docker-up`, `make docker-status`, `make docker-health`, `make docker-down`

## Production Deploy

Push to `main` triggers auto-deploy (CI must pass). Manual deploy on server:

```bash
ssh lightsail
cd ~/apps/codex-factory
~/deploy.sh
```

## Security Notes
- No secrets checked into source control.
- No hardcoded credentials.
- Ports 8080/8090 closed externally — traffic routes through HTTPS only.
- Use environment variables and cloud identity for deployment authentication.
