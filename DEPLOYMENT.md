# Production Deployment

## 1. Render API + PostgreSQL
Use `render.yaml` from the repository root. Set `DATABASE_URL`, three unique JWT secrets, and `ALLOWED_ORIGINS=https://<your-vercel-domain>` in Render. `PGSSL_MODE=require` is configured for a managed Render-style PostgreSQL connection; use `verify-full` only when the provider CA is installed and trusted by Node.

Render build: `npm ci && npm run migrate`
Render start: `npm start`
Health check: `/api/health`

## 2. Create the first Super Admin
Temporarily set `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` (12+ chars), and optionally `ADMIN_BOOTSTRAP_NAME` on Render. In a Render shell run:

`npm run bootstrap:admin`

Then remove the bootstrap password environment variable.

## 3. Vercel frontend
Set the Vercel Root Directory to `client` and add:

`VITE_API_URL=https://<your-render-service>.onrender.com/api`

Build command: `npm run build`
Output directory: `dist`

`client/vercel.json` provides the React Router SPA rewrite.

## 4. Local verification
Server: `cd server && npm ci && npm run migrate && npm test && npm start`
Client: `cd client && npm ci && npm run build && npm run dev`

Do not deploy `.env` files or example secrets.
