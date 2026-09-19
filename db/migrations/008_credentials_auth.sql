BEGIN;

-- Local credentials are separate from external OAuth identities.
-- password_hash stores only a password hash; plaintext passwords are never persisted.
CREATE TABLE user_credentials (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users
  ADD COLUMN email_verified_at timestamptz;

CREATE TYPE auth_token_purpose AS ENUM ('VERIFY_EMAIL','RESET_PASSWORD');

CREATE TABLE auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose auth_token_purpose NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auth_tokens_user_purpose_idx
  ON auth_tokens(user_id, purpose);

CREATE INDEX auth_tokens_active_lookup_idx
  ON auth_tokens(token_hash, purpose, expires_at)
  WHERE consumed_at IS NULL;

COMMIT;
