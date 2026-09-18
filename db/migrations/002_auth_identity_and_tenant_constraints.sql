BEGIN;

CREATE TABLE auth_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_account_id)
);
CREATE INDEX auth_identities_user_idx ON auth_identities(user_id);

ALTER TABLE memberships
  ADD CONSTRAINT memberships_id_org_unique UNIQUE (id, organization_id);

COMMIT;
