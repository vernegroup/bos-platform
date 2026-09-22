BEGIN;

ALTER TABLE standard_versions
  ADD COLUMN IF NOT EXISTS role_description text;

COMMENT ON COLUMN standard_versions.role_description IS
  'Plain-language description of the real work represented by this immutable Standard version.';

INSERT INTO bos_schema_migrations(name)
VALUES ('014_standard_role_description.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
