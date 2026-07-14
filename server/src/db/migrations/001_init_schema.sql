-- ============================================================================
-- MockTest Pro — Initial Database Schema
-- PostgreSQL 14+
-- ============================================================================
-- Run with: psql "$DATABASE_URL" -f 001_init_schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('admin', 'student');

CREATE TYPE test_category AS ENUM (
  'quantitative_aptitude',
  'logical_reasoning',
  'verbal_ability',
  'technical_mcq',
  'programming',
  'dbms',
  'dsa',
  'computer_networks',
  'operating_systems',
  'custom'
);

CREATE TYPE test_visibility AS ENUM ('public', 'private');

CREATE TYPE test_status AS ENUM ('draft', 'scheduled', 'active', 'expired', 'archived');

CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'auto_submitted', 'expired', 'terminated');

CREATE TYPE result_visibility AS ENUM ('immediate', 'after_expiry', 'hidden');

CREATE TYPE violation_type AS ENUM (
  'TAB_SWITCH',
  'WINDOW_BLUR',
  'FULLSCREEN_EXIT',
  'COPY_ATTEMPT',
  'PASTE_ATTEMPT',
  'CUT_ATTEMPT',
  'DEVTOOLS_SHORTCUT',
  'PAGE_REFRESH',
  'RIGHT_CLICK'
);

CREATE TYPE question_status_type AS ENUM ('not_visited', 'not_answered', 'answered', 'marked_for_review', 'answered_marked_for_review');

-- ----------------------------------------------------------------------------
-- USERS (base identity table — admins & students both reference this)
-- ----------------------------------------------------------------------------

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  role              user_role NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);

-- ----------------------------------------------------------------------------
-- ADMINS (profile extension of users where role = 'admin')
-- ----------------------------------------------------------------------------

CREATE TABLE admins (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name         VARCHAR(150) NOT NULL,
  institution       VARCHAR(200),
  designation       VARCHAR(150),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- STUDENTS
-- Students authenticate per-attempt via test access flow (name + roll + email
-- + test code), not necessarily via a persistent login. A `users` row with
-- role='student' is created/reused on first access so we have a stable FK
-- target for attempts, security logs, and cross-test history.
-- ----------------------------------------------------------------------------

CREATE TABLE students (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name         VARCHAR(150) NOT NULL,
  enrollment_number VARCHAR(100) NOT NULL,
  email             VARCHAR(255) NOT NULL,
  college_domain    VARCHAR(150),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_number, email)
);

CREATE INDEX idx_students_email ON students (email);
CREATE INDEX idx_students_enrollment ON students (enrollment_number);

-- ----------------------------------------------------------------------------
-- TESTS
-- ----------------------------------------------------------------------------

CREATE TABLE tests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code_id          VARCHAR(30) NOT NULL UNIQUE, -- e.g. APT-2026-X7K92 (public identifier / URL slug)
  access_code           VARCHAR(20) NOT NULL,        -- secret code required to enter (hashed at rest not required; low sensitivity, but kept short-lived)
  created_by            UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,

  title                 VARCHAR(200) NOT NULL,
  description           TEXT,
  subject               VARCHAR(150),
  category              test_category NOT NULL DEFAULT 'custom',

  duration_minutes      INTEGER NOT NULL CHECK (duration_minutes > 0),
  total_marks           NUMERIC(8,2) NOT NULL DEFAULT 0,
  marks_per_question    NUMERIC(6,2) NOT NULL DEFAULT 1,
  negative_marking      BOOLEAN NOT NULL DEFAULT FALSE,
  negative_marks_value  NUMERIC(6,2) NOT NULL DEFAULT 0,

  start_at              TIMESTAMPTZ NOT NULL,
  expires_at             TIMESTAMPTZ NOT NULL,
  max_attempts           INTEGER NOT NULL DEFAULT 1 CHECK (max_attempts > 0),
  passing_percentage     NUMERIC(5,2) NOT NULL DEFAULT 40,
  instructions            TEXT,

  visibility              test_visibility NOT NULL DEFAULT 'private',
  require_test_code       BOOLEAN NOT NULL DEFAULT TRUE,
  restrict_to_allowed_list BOOLEAN NOT NULL DEFAULT FALSE,
  college_email_domain    VARCHAR(150), -- e.g. '@college.edu', null = no restriction
  max_student_limit       INTEGER,      -- null = unlimited

  shuffle_questions        BOOLEAN NOT NULL DEFAULT FALSE,
  shuffle_options           BOOLEAN NOT NULL DEFAULT FALSE,

  result_visibility          result_visibility NOT NULL DEFAULT 'after_expiry',
  show_question_review       BOOLEAN NOT NULL DEFAULT FALSE,
  leaderboard_enabled         BOOLEAN NOT NULL DEFAULT TRUE,

  status                       test_status NOT NULL DEFAULT 'draft',

  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_test_window CHECK (expires_at > start_at)
);

CREATE INDEX idx_tests_created_by ON tests (created_by);
CREATE INDEX idx_tests_test_code_id ON tests (test_code_id);
CREATE INDEX idx_tests_status ON tests (status);
CREATE INDEX idx_tests_start_expires ON tests (start_at, expires_at);

-- ----------------------------------------------------------------------------
-- QUESTIONS
-- ----------------------------------------------------------------------------

CREATE TABLE questions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id           UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text     TEXT NOT NULL,
  explanation       TEXT,
  marks             NUMERIC(6,2) NOT NULL DEFAULT 1,
  negative_marks    NUMERIC(6,2) NOT NULL DEFAULT 0,
  difficulty        difficulty_level NOT NULL DEFAULT 'medium',
  order_index       INTEGER NOT NULL DEFAULT 0, -- admin-defined canonical order
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_test_id ON questions (test_id);
CREATE INDEX idx_questions_test_order ON questions (test_id, order_index);

-- ----------------------------------------------------------------------------
-- QUESTION OPTIONS
-- ----------------------------------------------------------------------------

CREATE TABLE question_options (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id       UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text       TEXT NOT NULL,
  is_correct        BOOLEAN NOT NULL DEFAULT FALSE, -- NEVER sent to student frontend during active attempt
  order_index       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_options_question_id ON question_options (question_id);

-- Enforce exactly-one-correct-answer per question at the application layer
-- (a partial unique index approximates it at the DB layer):
CREATE UNIQUE INDEX uq_one_correct_option_per_question
  ON question_options (question_id)
  WHERE is_correct = TRUE;

-- ----------------------------------------------------------------------------
-- TEST ALLOWED STUDENTS (private test allow-list)
-- ----------------------------------------------------------------------------

CREATE TABLE test_allowed_students (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id           UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  email             VARCHAR(255) NOT NULL,
  enrollment_number VARCHAR(100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, email)
);

CREATE INDEX idx_allowed_students_test_id ON test_allowed_students (test_id);

-- ----------------------------------------------------------------------------
-- TEST ATTEMPTS
-- ----------------------------------------------------------------------------

CREATE TABLE test_attempts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id               UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id            UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attempt_number        INTEGER NOT NULL DEFAULT 1,

  question_order        JSONB NOT NULL DEFAULT '[]', -- stable per-attempt array of question_id (shuffled or not)
  option_order           JSONB NOT NULL DEFAULT '{}', -- { question_id: [option_id,...] } stable per-attempt

  started_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at              TIMESTAMPTZ NOT NULL, -- started_at + duration, server-authoritative
  submitted_at             TIMESTAMPTZ,

  status                    attempt_status NOT NULL DEFAULT 'in_progress',

  score                     NUMERIC(8,2),
  total_marks_snapshot      NUMERIC(8,2), -- snapshot of test.total_marks at attempt time
  correct_count             INTEGER,
  incorrect_count           INTEGER,
  unattempted_count         INTEGER,
  percentage                NUMERIC(5,2),
  passed                    BOOLEAN,
  time_taken_seconds        INTEGER,

  violation_count           INTEGER NOT NULL DEFAULT 0,
  terminated_reason         VARCHAR(100),

  ip_address                VARCHAR(64),
  user_agent                TEXT,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (test_id, student_id, attempt_number)
);

CREATE INDEX idx_attempts_test_id ON test_attempts (test_id);
CREATE INDEX idx_attempts_student_id ON test_attempts (student_id);
CREATE INDEX idx_attempts_status ON test_attempts (status);
CREATE INDEX idx_attempts_test_status ON test_attempts (test_id, status);

-- ----------------------------------------------------------------------------
-- ATTEMPT ANSWERS
-- ----------------------------------------------------------------------------

CREATE TABLE attempt_answers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id            UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id    UUID REFERENCES question_options(id) ON DELETE SET NULL,

  status                question_status_type NOT NULL DEFAULT 'not_visited',
  is_correct            BOOLEAN, -- computed server-side at scoring time only
  marks_awarded         NUMERIC(6,2),

  answered_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_answers_attempt_id ON attempt_answers (attempt_id);
CREATE INDEX idx_answers_question_id ON attempt_answers (question_id);

-- ----------------------------------------------------------------------------
-- SECURITY LOGS
-- ----------------------------------------------------------------------------

CREATE TABLE security_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id        UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  test_id           UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  violation_type    violation_type NOT NULL,
  violation_count_at_time INTEGER NOT NULL,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seclogs_attempt_id ON security_logs (attempt_id);
CREATE INDEX idx_seclogs_test_id ON security_logs (test_id);
CREATE INDEX idx_seclogs_created_at ON security_logs (created_at);

-- ----------------------------------------------------------------------------
-- updated_at auto-touch trigger
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tests_updated_at BEFORE UPDATE ON tests FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attempts_updated_at BEFORE UPDATE ON test_attempts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_answers_updated_at BEFORE UPDATE ON attempt_answers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
