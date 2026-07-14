# MockTest Pro — Architecture (Phase 1)

## 1. Stack decisions

| Layer      | Choice |
|------------|--------|
| Frontend   | React 18 + Vite, JavaScript only, Tailwind CSS, Framer Motion, Lucide React |
| Backend    | Node.js + Express.js, REST API |
| Realtime   | Socket.IO (live test monitor) |
| Database   | PostgreSQL (raw SQL via `pg`, no heavy ORM — keeps scoring/timer logic auditable) |
| Auth       | JWT (access + refresh) for admins; short-lived attempt-scoped JWT for students during an active test |
| Security   | bcrypt, helmet, cors, express-rate-limit, express-validator |

Supabase is optional: since Supabase is Postgres underneath, the same schema and raw SQL work unchanged against a Supabase connection string. The app does not depend on Supabase-specific client SDKs, so it stays portable to any managed Postgres.

## 2. Monorepo layout

```
mocktest-pro/
├── client/                      # React SPA
│   └── src/
│       ├── components/          # Reusable UI (buttons, cards, modals, charts)
│       ├── pages/                # Route-level pages (admin/*, student/*, auth/*)
│       ├── layouts/              # AdminLayout, StudentTestLayout, AuthLayout
│       ├── hooks/                 # useTimer, useAntiCheat, useAutoSave, useSocket
│       ├── services/               # API clients (axios instances per resource)
│       ├── context/                 # AuthContext, TestAttemptContext
│       └── utils/                    # formatters, validators, constants
│
└── server/                      # Express API
    └── src/
        ├── config/               # db pool, env loader, constants
        ├── controllers/          # request handlers per resource
        ├── routes/                 # Express routers, mounted in app.js
        ├── middleware/              # auth, rbac, rateLimit, errorHandler, validate
        ├── services/                  # business logic (scoring, timer, testCode gen)
        ├── models/                     # SQL query modules per table
        ├── sockets/                     # Socket.IO namespace for live monitor
        ├── utils/                        # helpers (asyncHandler, logger)
        └── db/migrations/                # .sql migration files (001_init_schema.sql done)
```

Rationale: `models/` holds parameterized SQL per table (no ORM magic, so score/timer-critical queries are easy to audit for injection safety and correctness). `services/` holds logic that spans multiple models (e.g. "start attempt" touches tests, students, and test_attempts).

## 3. Core entity relationships

```
users (1) ──< admins (1)
users (1) ──< students (1)         [nullable link; students can exist pre-login]

admins (1) ──< tests (many)
tests (1) ──< questions (many) ──< question_options (many)
tests (1) ──< test_allowed_students (many)
tests (1) ──< test_attempts (many) >── students (1)
test_attempts (1) ──< attempt_answers (many) >── questions (1)
test_attempts (1) ──< security_logs (many)
```

Full DDL: `server/src/db/migrations/001_init_schema.sql`.

## 4. Key architectural decisions & why

**Server-authoritative timer.** `test_attempts.started_at` and `expires_at` are written once, server-side, when the attempt is created (`started_at = now()`, `expires_at = started_at + test.duration_minutes`). The frontend never sets these; it only polls/reads them and renders a countdown. Submit requests arriving after `expires_at` are still accepted but flagged `auto_submitted`/`expired` rather than trusted as on-time.

**Answers never reveal correctness to the client during an attempt.** The "fetch attempt questions" endpoint joins `questions` + `question_options` but strips `is_correct` from the payload while `test_attempts.status = 'in_progress'`. Scoring happens in `services/scoringService.js` against the DB copy of `is_correct` only after submission.

**Stable per-attempt randomization.** When an attempt is created, if `shuffle_questions`/`shuffle_options` is on, the server computes a shuffled order once and persists it to `test_attempts.question_order` (JSONB array of question ids) and `option_order` (JSONB map). Every subsequent fetch (including after refresh/reconnect) re-reads this stored order instead of re-shuffling.

**Test code vs test ID.** `tests.test_code_id` (e.g. `APT-2026-X7K92`) is the public URL slug (`/test/APT-2026-X7K92`), safe to share. `tests.access_code` is the separate secret required to actually start the test, checked at "test access" time — this two-factor split (link + code) matches the requirement that a leaked link alone shouldn't grant entry when `require_test_code` is true.

**Violation handling is server-tracked, not just client-tracked.** The client detects violations (tab switch, devtools shortcut, etc.) and POSTs each one; the server increments `test_attempts.violation_count` and inserts into `security_logs` atomically, and returns the authoritative new count so the client's 1st/2nd-warning/3rd-auto-submit logic is driven by server state, not a value that could be tampered with in the browser.

**Honesty about anti-cheat limits.** All of the above raises the bar against casual cheating (tab-switching, copy-paste, devtools) but cannot detect a second physical device, a screen being recorded from outside the browser, or a proxy user typing on the student's behalf. This is documented explicitly in the final deliverable's "Security Limitations" section rather than implied away.

## 5. Planned REST API surface (implemented in Phase 2–4)

```
POST   /api/auth/admin/register
POST   /api/auth/admin/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/admin/dashboard/stats
GET    /api/admin/dashboard/charts

POST   /api/admin/tests
GET    /api/admin/tests
GET    /api/admin/tests/:id
PATCH  /api/admin/tests/:id
DELETE /api/admin/tests/:id
POST   /api/admin/tests/:id/allowed-students

POST   /api/admin/tests/:id/questions
POST   /api/admin/tests/:id/questions/bulk-import
PATCH  /api/admin/questions/:id
DELETE /api/admin/questions/:id
POST   /api/admin/questions/:id/duplicate
PATCH  /api/admin/tests/:id/questions/reorder

GET    /api/admin/tests/:id/attempts
GET    /api/admin/tests/:id/results
GET    /api/admin/tests/:id/leaderboard
GET    /api/admin/tests/:id/security-logs
GET    /api/admin/tests/:id/live-monitor        (bootstrap; live deltas via Socket.IO)

POST   /api/public/tests/:testCodeId/access      (validate name/roll/email/code)
GET    /api/public/tests/:testCodeId/instructions

POST   /api/attempts/start
GET    /api/attempts/:attemptId/questions
POST   /api/attempts/:attemptId/answers          (autosave, upsert)
POST   /api/attempts/:attemptId/violations
POST   /api/attempts/:attemptId/submit
GET    /api/attempts/:attemptId/result

Socket.IO namespace: /live-monitor  (rooms per testId; events: attempt:update, attempt:violation, attempt:submitted)
```

## 6. What's next

- **Phase 2:** Express app bootstrap, config, middleware (auth/RBAC/rate-limit/helmet/cors/error handler), admin auth + test/question CRUD.
- **Phase 3:** Test-taking engine (access validation, start attempt, timer, randomized fetch, autosave, submit, server-side scoring).
- **Phase 4:** Results, leaderboard, security log endpoints, Socket.IO live monitor.
- **Phase 5+:** Frontend, in the same phase order as the user-facing flows.
