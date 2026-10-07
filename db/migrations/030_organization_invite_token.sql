BEGIN;

ALTER TYPE auth_token_purpose ADD VALUE IF NOT EXISTS 'ORGANIZATION_INVITE';

ALTER TABLE auth_tokens
  ADD COLUMN IF NOT EXISTS membership_id uuid REFERENCES memberships(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS auth_tokens_membership_purpose_idx
  ON auth_tokens(membership_id, purpose)
  WHERE membership_id IS NOT NULL;

COMMIT;
