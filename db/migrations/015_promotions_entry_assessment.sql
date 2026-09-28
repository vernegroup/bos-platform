BEGIN;

-- PROM-WEB-05 — Entry Assessment
-- Every active task of the exact target StandardVersion receives one explicit
-- entry assessment: POTWIERDZONE / DO SPRAWDZENIA / DO WDROŻENIA.

CREATE TYPE promotion_entry_assessment AS ENUM (
  'CONFIRMED',
  'TO_VERIFY',
  'TO_DEPLOY'
);

-- Process-owned task set. It is materialised from the bound target
-- StandardVersion so later Standard publications cannot rewrite this process.
CREATE TABLE promotion_process_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  promotion_process_id uuid NOT NULL,
  standard_task_id uuid NOT NULL,
  position_snapshot integer NOT NULL CHECK (position_snapshot BETWEEN 1 AND 18),
  name_snapshot text NOT NULL CHECK (btrim(name_snapshot) <> ''),
  is_critical_snapshot boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promotion_process_id, standard_task_id),
  UNIQUE (id, organization_id),
  FOREIGN KEY (promotion_process_id, organization_id)
    REFERENCES promotion_processes(id, organization_id),
  FOREIGN KEY (standard_task_id, organization_id)
    REFERENCES standard_tasks(id, organization_id)
);

CREATE INDEX promotion_process_tasks_process_idx
  ON promotion_process_tasks(organization_id, promotion_process_id, position_snapshot);

CREATE TABLE promotion_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  promotion_process_id uuid NOT NULL,
  promotion_process_task_id uuid NOT NULL,
  initial_assessment promotion_entry_assessment NOT NULL,
  evidence_note text,
  assessed_by_user_id uuid NOT NULL,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promotion_process_task_id),
  UNIQUE (id, organization_id),
  FOREIGN KEY (promotion_process_id, organization_id)
    REFERENCES promotion_processes(id, organization_id),
  FOREIGN KEY (promotion_process_task_id, organization_id)
    REFERENCES promotion_process_tasks(id, organization_id),
  FOREIGN KEY (organization_id, assessed_by_user_id)
    REFERENCES memberships(organization_id, user_id)
);

CREATE INDEX promotion_assessments_process_idx
  ON promotion_assessments(organization_id, promotion_process_id);

-- A child task must belong to the exact StandardVersion bound to the process.
CREATE OR REPLACE FUNCTION bos_guard_promotion_process_task_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_process_version uuid;
  v_task_version uuid;
BEGIN
  SELECT standard_version_id INTO v_process_version
  FROM promotion_processes
  WHERE id = NEW.promotion_process_id
    AND organization_id = NEW.organization_id;

  SELECT standard_version_id INTO v_task_version
  FROM standard_tasks
  WHERE id = NEW.standard_task_id
    AND organization_id = NEW.organization_id;

  IF v_process_version IS NULL
     OR v_task_version IS NULL
     OR v_process_version <> v_task_version THEN
    RAISE EXCEPTION 'Promotion task must belong to the process target StandardVersion.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_process_task_binding_guard
BEFORE INSERT OR UPDATE OF promotion_process_id, standard_task_id, organization_id
ON promotion_process_tasks
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_process_task_binding();

-- Assessment and task must belong to the same process and organization.
CREATE OR REPLACE FUNCTION bos_guard_promotion_assessment_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_task_process uuid;
BEGIN
  SELECT promotion_process_id INTO v_task_process
  FROM promotion_process_tasks
  WHERE id = NEW.promotion_process_task_id
    AND organization_id = NEW.organization_id;

  IF v_task_process IS NULL OR v_task_process <> NEW.promotion_process_id THEN
    RAISE EXCEPTION 'Promotion assessment task must belong to the same PromotionProcess.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_assessment_binding_guard
BEFORE INSERT OR UPDATE OF promotion_process_id, promotion_process_task_id, organization_id
ON promotion_assessments
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_assessment_binding();

-- Snapshot fields are historical process facts once materialised.
CREATE OR REPLACE FUNCTION bos_guard_promotion_task_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.promotion_process_id IS DISTINCT FROM OLD.promotion_process_id
     OR NEW.standard_task_id IS DISTINCT FROM OLD.standard_task_id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.position_snapshot IS DISTINCT FROM OLD.position_snapshot
     OR NEW.name_snapshot IS DISTINCT FROM OLD.name_snapshot
     OR NEW.is_critical_snapshot IS DISTINCT FROM OLD.is_critical_snapshot THEN
    RAISE EXCEPTION 'Promotion process task snapshot is immutable.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_process_task_snapshot_guard
BEFORE UPDATE ON promotion_process_tasks
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_task_snapshot();

-- Materialise every active task of the exact bound target StandardVersion.
-- Current Standard schema has no separate active flag on StandardTask; therefore
-- every task present in the immutable published version is an active requirement.
CREATE OR REPLACE FUNCTION bos_seed_promotion_process_tasks(p_process_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_org uuid;
  v_version uuid;
  v_status standard_version_status;
  v_count integer;
BEGIN
  SELECT organization_id, standard_version_id
    INTO v_org, v_version
  FROM promotion_processes
  WHERE id = p_process_id;

  IF v_org IS NULL OR v_version IS NULL THEN
    RAISE EXCEPTION 'PromotionProcess requires target StandardVersion before task seeding.';
  END IF;

  SELECT status INTO v_status
  FROM standard_versions
  WHERE id = v_version
    AND organization_id = v_org;

  IF v_status IS DISTINCT FROM 'PUBLISHED' THEN
    RAISE EXCEPTION 'PromotionProcess tasks can only be seeded from a PUBLISHED StandardVersion.';
  END IF;

  INSERT INTO promotion_process_tasks(
    organization_id,
    promotion_process_id,
    standard_task_id,
    position_snapshot,
    name_snapshot,
    is_critical_snapshot
  )
  SELECT
    v_org,
    p_process_id,
    st.id,
    st.position,
    st.name,
    st.is_critical
  FROM standard_tasks st
  WHERE st.organization_id = v_org
    AND st.standard_version_id = v_version
  ORDER BY st.position
  ON CONFLICT (promotion_process_id, standard_task_id) DO NOTHING;

  SELECT count(*) INTO v_count
  FROM promotion_process_tasks
  WHERE organization_id = v_org
    AND promotion_process_id = p_process_id;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'PromotionProcess target StandardVersion must contain at least one task.';
  END IF;

  RETURN v_count;
END;
$$;

-- Entry completeness is derived, never manually set.
CREATE OR REPLACE FUNCTION bos_promotion_entry_assessment_complete(p_process_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT
    count(*) > 0
    AND count(*) = count(pa.id)
  FROM promotion_process_tasks ppt
  LEFT JOIN promotion_assessments pa
    ON pa.promotion_process_task_id = ppt.id
   AND pa.promotion_process_id = ppt.promotion_process_id
   AND pa.organization_id = ppt.organization_id
  WHERE ppt.promotion_process_id = p_process_id;
$$;

COMMENT ON TYPE promotion_entry_assessment IS
  'CONFIRMED=POTWIERDZONE, TO_VERIFY=DO SPRAWDZENIA, TO_DEPLOY=DO WDROŻENIA.';
COMMENT ON FUNCTION bos_promotion_entry_assessment_complete(uuid) IS
  'True only when the process has at least one target task and every target task has exactly one entry assessment.';

INSERT INTO bos_schema_migrations(name)
VALUES ('015_promotions_entry_assessment.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
