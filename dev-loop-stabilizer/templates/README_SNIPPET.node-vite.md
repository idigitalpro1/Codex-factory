## Dev Loop Stabilizer Kit (Node/Vite)

Vite-oriented deterministic lifecycle:

```bash
make down || true
make up
make status
make health
```

Defaults:
- Frontend (Vite): auto-negotiated, preferred `5173`
- Backend (optional): auto-negotiated, preferred `8080`

Notes:
- Uses `ports.env` for persisted chosen ports.
- Supports npm/pnpm/yarn auto-detection.
