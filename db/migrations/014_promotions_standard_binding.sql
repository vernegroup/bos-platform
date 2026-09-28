BEGIN;

-- PROM-WEB-04 — Standard Binding
-- Every Promotions process is bound to one exact target StandardVersion.
-- Shared Standard/StandardVersion are reused; Promotions does not clone them.

ALTER TABLE promotion_processes
  ADD COLUMN standard_id uuid,
  ADD COLUMN standard_version_id uuid;

-- Existing legacy Promotions rows predate target Standard binding. They cannot
-- be truthfully inferred from role text, so keep them explicit legacy records.
-- New Web 1.0 processes must satisfy the binding through the guard below.
ALTER TABLE promotion_processes
  ADD CONSTRAINT promotion_processes_standard_org_fk
    FOREIGN KEY (standard_id, organization_id)
    REFERENCES standards(id, organization_id),
  ADD CONSTRAINT promotion_processes_version_standard_org_fk
    FOREIGN KEY (standard_version_id, standard_id, organization_id)
    REFERENCES standard_versions(id, standard_id, organization_id);

CREATE INDEX promotion_processes_standard_version_idx
  ON promotion_processes(organization_id, standard_version_id);

CREATE OR REPLACE FUNCTION bos_guard_promotion_standard_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_status standard_version_status;
BEGIN
  -- Legacy rows are allowed to remain unbound until an explicit legacy mapping
  -- policy exists. A new Promotions Web 1.0 row is never allowed unbound.
  IF TG_OP = 'INSERT' AND (NEW.standard_id IS NULL OR NEW.standard_version_id IS NULL) THEN
    RAISE EXCEPTION 'PromotionProcess requires target Standard and StandardVersion.';
  END IF;

  -- Once a process has a target binding, it is immutable for its entire life.
  IF TG_OP = 'UPDATE'
     AND OLD.standard_id IS NOT NULL
     AND OLD.standard_version_id IS NOT NULL
     AND (
       NEW.standard_id IS DISTINCT FROM OLD.standard_id
       OR NEW.standard_version_id IS DISTINCT FROM OLD.standard_version_id
     ) THEN
    RAISE EXCEPTION 'Cannot change target Standard or StandardVersion of a PromotionProcess.';
  END IF;

  -- Do not permit partial binding, including on a legacy row.
  IF (NEW.standard_id IS NULL) <> (NEW.standard_version_id IS NULL) THEN
    RAISE EXCEPTION 'PromotionProcess Standard binding must contain both Standard and StandardVersion.';
  END IF;

  IF NEW.standard_id IS NOT NULL THEN
    SELECT status INTO v_status
    FROM standard_versions
    WHERE id = NEW.standard_version_id
      AND standard_id = NEW.standard_id
      AND organization_id = NEW.organization_id;

    IF v_status IS DISTINCT FROM 'PUBLISHED' THEN
      RAISE EXCEPTION 'PromotionProcess requires a PUBLISHED target StandardVersion.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_process_standard_binding_guard
BEFORE INSERT OR UPDATE OF standard_id, standard_version_id, organization_id
ON promotion_processes
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_standard_binding();

COMMENT ON COLUMN promotion_processes.standard_id IS
  'Shared target-role Standard. Required for new Promotions Web 1.0 processes.';
COMMENT ON COLUMN promotion_processes.standard_version_id IS
  'Exact published target-role StandardVersion; immutable once bound.';

INSERT INTO bos_schema_migrations(name)
VALUES ('014_promotions_standard_binding.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
