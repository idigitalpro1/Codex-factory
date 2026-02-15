# Next-Gen Digital Factory

Bootstrap structure for:
- empire-courier.com
- VillagerMediaGroup.com

## Project Layout
- `backend/`: Flask API (`/api/v1/health`, `/api/v1/feed/articles`, `/api/v1/ai/mock`)
- `frontend/beta/`: static beta app
- `docs/workflows/`: cloud deployment runbooks
- `.github/workflows/`: minimal CI/CD pipeline

## Local Backend Run
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

## Endpoint Checks
```bash
curl http://localhost:8080/api/v1/health
curl http://localhost:8080/api/v1/feed/articles
curl -X POST http://localhost:8080/api/v1/ai/mock -H 'Content-Type: application/json' -d '{"prompt":"daily editorial plan"}'
```

## Security Notes
- No secrets checked into source control.
- Use environment variables and cloud identity federation for deployment authentication.
