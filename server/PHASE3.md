# Phase 3 — Test-Taking Engine

Implemented:
- Public test access validation and instructions
- Student identity reuse/create flow
- Allowed-list, college-domain, test-code, attempt-limit, and student-limit checks
- Server-authoritative attempt start/expiry
- Stable per-attempt question and option randomization persisted in PostgreSQL
- Attempt-scoped JWT
- Active-attempt resume/recovery
- Question API that never selects or returns `is_correct`
- Backend answer autosave/upsert semantics
- Option/question ownership validation
- Idempotent submission
- Automatic expiry submission when questions/save/submit detect timeout
- Server-side scoring, negative marks, counts, percentage, pass/fail, and time taken
- Node built-in tests for score percentage and expiry status logic

Phase 4 remains: results visibility, leaderboard, security logs/violations, Socket.IO live monitor.
