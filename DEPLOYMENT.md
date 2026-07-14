# Production Deployment

## Recommended split deployment
- Frontend: Netlify using `client/netlify.toml`
- API + Socket.IO: Render using `render.yaml`
- PostgreSQL: managed PostgreSQL provider

## Database
Run:
1. `server/src/db/migrations/001_init_schema.sql`
2. `server/src/db/migrations/002_security_hardening.sql`

## API environment
Set `NODE_ENV=production`, `DATABASE_URL`, three unique 64+ character JWT secrets, `ALLOWED_ORIGINS`, and `PGSSL=true` when required by the database provider.

## Frontend environment
Set `VITE_API_URL` to the public API URL ending in `/api`.

## Verification
From `server`: `npm ci && npm test`
From `client`: `npm ci && npm run build`

Then verify `/api/health`, admin login/logout, refresh rotation, test creation, student access, timer, autosave, reconnect, submission, results and live monitoring.

## Docker alternative
Copy `.env.production.example` to `.env`, fill real secrets, then run `docker compose up --build -d`.

Do not deploy example secrets.
