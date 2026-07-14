# Phase 7 — Student Secure Exam Experience

Implemented:
- Shareable `/test/:testCodeId` student access page
- Student name, enrollment, email and test-code validation
- Instructions and rules page with agreement gate
- Fullscreen request at exam start
- Attempt-scoped JWT storage and API client
- Server-authoritative countdown synchronized using server time
- Secure one-question-at-a-time exam UI
- Question navigator and answer state indicators
- Previous, Save & Next, Clear Response and Mark for Review
- Immediate backend autosave plus 10-second autosave heartbeat
- Refresh/reconnect attempt recovery through persisted attempt session and stable backend ordering
- Copy/paste and selected developer-shortcut blocking
- Tab switch, window blur and fullscreen-exit violation reporting
- Server-driven warning/final warning and third-violation auto-submit flow
- Time-expiry automatic submission
- Submission confirmation with answered/unanswered counts
- Result pending/hidden handling
- Result score, percentage, correct, incorrect, unattempted, pass status and time taken
- Developer branding for Hridyansh Chaudhary

Security limitation: browser controls raise the barrier to casual cheating but cannot detect a second physical device, external recording, or another person assisting the student.
