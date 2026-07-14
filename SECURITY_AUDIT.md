# MockTest Pro — Phase 8 Security Audit

## Hardened in Phase 8
- Refresh JWTs now use database-backed sessions, JTI identifiers, rotation and logout revocation.
- JWT issuer and audience validation added for admin, refresh and attempt tokens.
- CORS changed to an explicit comma-separated production origin allowlist.
- `X-Powered-By` disabled and request IDs added.
- HSTS enabled in production; strict referrer policy added.
- Admin registration password policy now requires upper/lowercase, number and special character.
- Existing Helmet, bcrypt, rate limiting, RBAC, server-side scoring, server timer and attempt-scoped JWT controls retained.
- Third logged exam violation remains server-side auto-submit.
- PostgreSQL migration `002_security_hardening.sql` adds refresh-token sessions.

## Audit findings / limitations
1. Browser anti-cheat is deterrence, not proof of a cheat-free exam. It cannot detect a second device or another person.
2. Access codes are stored in the tests table. For high-stakes exams, migrate them to a slow password hash and compare with bcrypt/Argon2.
3. The current test suite is unit-focused. Add PostgreSQL integration tests and browser E2E tests before high-stakes institutional use.
4. Add managed backups, database point-in-time recovery, uptime monitoring and centralized logs in production.
5. Rotate JWT secrets if exposed. Never commit `.env` files.
6. Add MFA for administrators before exposing sensitive institutional exam data at scale.
7. Consider CSP at the frontend reverse proxy after final production domains and third-party assets are fixed.

## Deployment gate
Run both SQL migrations in order, configure production secrets, restrict allowed origins, run `npm audit`, run backend tests, build frontend, then smoke-test login, test creation, attempt resume, autosave, expiry, violation auto-submit, result visibility and Socket.IO monitor.
