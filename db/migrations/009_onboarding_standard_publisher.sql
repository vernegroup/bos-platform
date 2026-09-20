BEGIN;

ALTER TABLE standard_versions
  ADD COLUMN IF NOT EXISTS published_by_user_id uuid REFERENCES users(id);

ALTER TABLE standard_versions
  ADD CONSTRAINT standard_versions_publisher_membership_fk
    FOREIGN KEY (organization_id, published_by_user_id)
    REFERENCES memberships(organization_id, user_id);

CREATE OR REPLACE FUNCTION bos_guard_published_standard_version()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'PUBLISHED' THEN
    IF NEW.standard_id IS DISTINCT FROM OLD.standard_id
       OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
       OR NEW.version_number IS DISTINCT FROM OLD.version_number
       OR NEW.version_label IS DISTINCT FROM OLD.version_label
       OR NEW.change_note IS DISTINCT FROM OLD.change_note
       OR NEW.published_at IS DISTINCT FROM OLD.published_at
       OR NEW.published_by_user_id IS DISTINCT FROM OLD.published_by_user_id
       OR NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Published StandardVersion is immutable; create a new version.';
    END IF;
    IF NEW.status NOT IN ('PUBLISHED','ARCHIVED') THEN
      RAISE EXCEPTION 'Published StandardVersion can only remain PUBLISHED or become ARCHIVED.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

INSERT INTO bos_schema_migrations(name)
VALUES ('009_onboarding_standard_publisher.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
