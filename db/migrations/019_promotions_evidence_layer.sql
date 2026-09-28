BEGIN;

-- PROM-WEB-09 — Evidence Layer
-- Historical BOS data may support a manager's assessment, but evidence is
-- context only: it never changes assessment or verification state automatically.

CREATE TYPE promotion_evidence_source AS ENUM (
  'ONBOARDING',
  'PROMOTIONS',
  'MANUAL'
);

CREATE TABLE promotion_evidence_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  promotion_process_id uuid NOT NULL,
  promotion_assessment_id uuid,

  source_type promotion_evidence_source NOT NULL,
  source_process_id uuid,
  source_closure_id uuid,
  source_standard_id uuid,
  source_standard_version_id uuid,
  source_standard_task_id uuid,

  evidence_type text NOT NULL CHECK (btrim(evidence_type) <> ''),
  source_result_snapshot text,
  source_description_snapshot text NOT NULL
    CHECK (btrim(source_description_snapshot) <> ''),
  source_date timestamptz,

  added_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (id, organization_id),

  FOREIGN KEY (promotion_process_id, organization_id)
    REFERENCES promotion_processes(id, organization_id),
  FOREIGN KEY (promotion_assessment_id, organization_id)
    REFERENCES promotion_assessments(id, organization_id),
  FOREIGN KEY (organization_id, added_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (source_standard_id, organization_id)
    REFERENCES standards(id, organization_id),
  FOREIGN KEY (source_standard_version_id, source_standard_id, organization_id)
    REFERENCES standard_versions(id, standard_id, organization_id),
  FOREIGN KEY (source_standard_task_id, organization_id)
    REFERENCES standard_tasks(id, organization_id)
);

CREATE INDEX promotion_evidence_process_idx
  ON promotion_evidence_references(
    organization_id,
    promotion_process_id,
    created_at DESC
  );

CREATE INDEX promotion_evidence_assessment_idx
  ON promotion_evidence_references(
    organization_id,
    promotion_assessment_id
  )
  WHERE promotion_assessment_id IS NOT NULL;

-- Evidence attached to an assessment must remain inside the same process.
-- Source references are validated against the source module and tenant below.
CREATE OR REPLACE FUNCTION bos_guard_promotion_evidence_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_assessment_process uuid;
  v_source_org uuid;
  v_source_standard uuid;
  v_source_version uuid;
BEGIN
  IF NEW.promotion_assessment_id IS NOT NULL THEN
    SELECT promotion_process_id INTO v_assessment_process
    FROM promotion_assessments
    WHERE id = NEW.promotion_assessment_id
      AND organization_id = NEW.organization_id;

    IF v_assessment_process IS NULL
       OR v_assessment_process <> NEW.promotion_process_id THEN
      RAISE EXCEPTION 'Evidence assessment must belong to the same PromotionProcess.';
    END IF;
  END IF;

  IF NEW.source_type = 'MANUAL' THEN
    IF NEW.source_process_id IS NOT NULL
       OR NEW.source_closure_id IS NOT NULL THEN
      RAISE EXCEPTION 'MANUAL evidence cannot claim a BOS source process or closure.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.source_process_id IS NULL THEN
    RAISE EXCEPTION 'BOS historical evidence requires source_process_id.';
  END IF;

  IF NEW.source_type = 'ONBOARDING' THEN
    SELECT organization_id, standard_id, standard_version_id
      INTO v_source_org, v_source_standard, v_source_version
    FROM onboarding_processes
    WHERE id = NEW.source_process_id;

    IF v_source_org IS NULL OR v_source_org <> NEW.organization_id THEN
      RAISE EXCEPTION 'Onboarding evidence must belong to the same organization.';
    END IF;

    IF NEW.source_closure_id IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM onboarding_closures oc
      WHERE oc.id = NEW.source_closure_id
        AND oc.onboarding_process_id = NEW.source_process_id
        AND oc.organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'Onboarding evidence closure does not belong to the source process/organization.';
    END IF;

    IF NEW.source_standard_id IS NOT NULL
       AND NEW.source_standard_id <> v_source_standard THEN
      RAISE EXCEPTION 'Onboarding evidence Standard does not match its source process.';
    END IF;

    IF NEW.source_standard_version_id IS NOT NULL
       AND NEW.source_standard_version_id <> v_source_version THEN
      RAISE EXCEPTION 'Onboarding evidence StandardVersion does not match its source process.';
    END IF;

  ELSIF NEW.source_type = 'PROMOTIONS' THEN
    SELECT organization_id, standard_id, standard_version_id
      INTO v_source_org, v_source_standard, v_source_version
    FROM promotion_processes
    WHERE id = NEW.source_process_id;

    IF v_source_org IS NULL OR v_source_org <> NEW.organization_id THEN
      RAISE EXCEPTION 'Promotions evidence must belong to the same organization.';
    END IF;

    -- PROM-WEB-14 will replace legacy PromotionClosure with append-only Web 1.0
    -- history. Until then, do not accept a source_closure_id whose semantics are
    -- still the legacy COMPLETED model.
    IF NEW.source_closure_id IS NOT NULL THEN
      RAISE EXCEPTION 'Promotions closure evidence is unavailable until Web 1.0 append-only closure migration.';
    END IF;

    IF NEW.source_standard_id IS NOT NULL
       AND NEW.source_standard_id IS DISTINCT FROM v_source_standard THEN
      RAISE EXCEPTION 'Promotions evidence Standard does not match its source process.';
    END IF;

    IF NEW.source_standard_version_id IS NOT NULL
       AND NEW.source_standard_version_id IS DISTINCT FROM v_source_version THEN
      RAISE EXCEPTION 'Promotions evidence StandardVersion does not match its source process.';
    END IF;
  END IF;

  IF NEW.source_standard_task_id IS NOT NULL THEN
    IF NEW.source_standard_version_id IS NULL THEN
      RAISE EXCEPTION 'Task evidence requires source_standard_version_id.';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM standard_tasks st
      WHERE st.id = NEW.source_standard_task_id
        AND st.organization_id = NEW.organization_id
        AND st.standard_version_id = NEW.source_standard_version_id
    ) THEN
      RAISE EXCEPTION 'Evidence task must belong to the referenced StandardVersion and organization.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_evidence_binding_guard
BEFORE INSERT OR UPDATE ON promotion_evidence_references
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_evidence_binding();

-- Evidence is historical support. Once written it is append-only; corrections
-- are represented by a new evidence record rather than rewriting the old fact.
CREATE OR REPLACE FUNCTION bos_guard_promotion_evidence_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Promotion evidence history is append-only.';
END;
$$;

CREATE TRIGGER promotion_evidence_append_only_guard
BEFORE UPDATE OR DELETE ON promotion_evidence_references
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_evidence_append_only();

COMMENT ON TABLE promotion_evidence_references IS
  'Tenant-safe historical/manual evidence for Promotions assessments. Evidence is context only and never automatically changes assessment state.';
COMMENT ON COLUMN promotion_evidence_references.source_description_snapshot IS
  'Immutable human-readable snapshot of what the evidence meant when it was used.';

INSERT INTO bos_schema_migrations(name)
VALUES ('019_promotions_evidence_layer.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
