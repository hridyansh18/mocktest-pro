CREATE TABLE IF NOT EXISTS refresh_token_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti UUID NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by_jti UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user ON refresh_token_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_expiry ON refresh_token_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_active ON refresh_token_sessions(token_jti) WHERE revoked_at IS NULL;
