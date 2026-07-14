# Phase 4 — Results, Leaderboard, Security Logs and Live Monitor

Implemented:
- Admin test results endpoint
- Ranked leaderboard endpoint
- Student result visibility rules
- Security violation logging with authoritative server count
- Warning at 1, final warning at 2, and server-side automatic submission at 3+ violations
- Admin security log endpoint
- Live monitor bootstrap endpoint
- Socket.IO `/live-monitor` namespace with admin JWT authentication
- Per-test Socket.IO rooms
- `attempt:update`, `attempt:violation`, and `attempt:submitted` events

Note: browser anti-cheat event detection is completed in the student frontend phase; the third logged violation is already auto-submitted by the server. Browser controls cannot guarantee complete cheating prevention.
