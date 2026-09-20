BEGIN;

-- BOS Onboarding Web v1 domain schema, based on Architecture Freeze v1.0.

ALTER TYPE onboarding_process_status ADD VALUE IF NOT EXISTS 'PAUSED';

CREATE TYPE onboarding_start_requirement_category AS ENUM (
  'TOOLS','ACCESS','MATERIALS','INSTRUCTIONS','WORKPLACE','OTHER'
);
CREATE TYPE onboarding_readiness_verification_method AS ENUM (
  'OBSERVATION','INDEPENDENT_TASK','WORK_SAMPLE','CONTROL_QUESTIONS','KNOWLEDGE_TEST','OTHER'
);
CREATE TYPE onboarding_decision_result AS ENUM ('READY','NOT_YET','STOP');

-- Cross-tenant keys used by composite foreign keys.
ALTER TABLE standards
  ADD CONSTRAINT standards_id_org_unique UNIQUE (id, organization_id);
ALTER TABLE standard_versions
  ADD CONSTRAINT standard_versions_id_standard_org_unique UNIQUE (id, standard_id, organization_id);
ALTER TABLE standard_tasks
  ADD CONSTRAINT standard_tasks_id_org_unique UNIQUE (id, organization_id),
  ADD CONSTRAINT standard_tasks_id_version_org_unique UNIQUE (id, standard_version_id, organization_id);
ALTER TABLE onboarding_processes
  ADD CONSTRAINT onboarding_processes_id_org_unique UNIQUE (id, organization_id);

-- StandardTask: BOS task semantics.
ALTER TABLE standard_tasks
  ADD COLUMN hint text,
  ADD COLUMN is_critical boolean NOT NULL DEFAULT false;

ALTER TABLE standard_tasks
  ADD CONSTRAINT standard_tasks_position_web_v1_check CHECK (position BETWEEN 1 AND 18),
  ADD CONSTRAINT standard_tasks_version_org_fk
    FOREIGN KEY (standard_version_id, organization_id)
    REFERENCES standard_versions(id, organization_id);

-- Version-owned prerequisites.
CREATE TABLE standard_start_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  standard_version_id uuid NOT NULL,
  position integer NOT NULL CHECK (position > 0),
  category onboarding_start_requirement_category NOT NULL,
  requirement text NOT NULL CHECK (btrim(requirement) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (standard_version_id, position),
  UNIQUE (id, organization_id),
  FOREIGN KEY (standard_version_id, organization_id)
    REFERENCES standard_versions(id, organization_id)
);
CREATE INDEX standard_start_requirements_org_idx
  ON standard_start_requirements(organization_id);

-- Version-owned final readiness criteria. Web v1 supports max 3 ordered criteria.
CREATE TABLE standard_readiness_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  standard_version_id uuid NOT NULL,
  position integer NOT NULL CHECK (position BETWEEN 1 AND 3),
  criterion text NOT NULL CHECK (btrim(criterion) <> ''),
  verification_method onboarding_readiness_verification_method NOT NULL,
  verification_method_other text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (standard_version_id, position),
  UNIQUE (id, organization_id),
  FOREIGN KEY (standard_version_id, organization_id)
    REFERENCES standard_versions(id, organization_id),
  CHECK (
    (verification_method = 'OTHER' AND verification_method_other IS NOT NULL AND btrim(verification_method_other) <> '')
    OR verification_method <> 'OTHER'
  )
);
CREATE INDEX standard_readiness_criteria_org_idx
  ON standard_readiness_criteria(organization_id);

-- Per-process prerequisite checks.
CREATE TABLE onboarding_start_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  onboarding_process_id uuid NOT NULL,
  requirement_id uuid NOT NULL,
  is_satisfied boolean NOT NULL DEFAULT false,
  checked_by_user_id uuid,
  checked_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (onboarding_process_id, requirement_id),
  FOREIGN KEY (onboarding_process_id, organization_id)
    REFERENCES onboarding_processes(id, organization_id),
  FOREIGN KEY (requirement_id, organization_id)
    REFERENCES standard_start_requirements(id, organization_id),
  FOREIGN KEY (organization_id, checked_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  CHECK ((is_satisfied = false) OR (checked_by_user_id IS NOT NULL AND checked_at IS NOT NULL))
);
CREATE INDEX onboarding_start_checks_org_idx ON onboarding_start_checks(organization_id);

-- Per-process verification of final readiness criteria.
CREATE TABLE onboarding_readiness_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  onboarding_process_id uuid NOT NULL,
  readiness_criterion_id uuid NOT NULL,
  is_passed boolean NOT NULL DEFAULT false,
  checked_by_user_id uuid,
  checked_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (onboarding_process_id, readiness_criterion_id),
  FOREIGN KEY (onboarding_process_id, organization_id)
    REFERENCES onboarding_processes(id, organization_id),
  FOREIGN KEY (readiness_criterion_id, organization_id)
    REFERENCES standard_readiness_criteria(id, organization_id),
  FOREIGN KEY (organization_id, checked_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  CHECK ((is_passed = false) OR (checked_by_user_id IS NOT NULL AND checked_at IS NOT NULL))
);
CREATE INDEX onboarding_readiness_checks_org_idx ON onboarding_readiness_checks(organization_id);

-- Process assignments and tenant-safe Standard binding.
ALTER TABLE onboarding_processes
  ADD COLUMN trainer_user_id uuid REFERENCES users(id),
  ADD COLUMN evaluator_user_id uuid REFERENCES users(id),
  ADD COLUMN paused_at timestamptz,
  ADD COLUMN cancelled_at timestamptz;

UPDATE onboarding_processes
SET trainer_user_id = owner_user_id,
    evaluator_user_id = owner_user_id
WHERE trainer_user_id IS NULL OR evaluator_user_id IS NULL;

ALTER TABLE onboarding_processes
  ALTER COLUMN trainer_user_id SET NOT NULL,
  ALTER COLUMN evaluator_user_id SET NOT NULL,
  ADD CONSTRAINT onboarding_processes_standard_org_fk
    FOREIGN KEY (standard_id, organization_id)
    REFERENCES standards(id, organization_id),
  ADD CONSTRAINT onboarding_processes_version_standard_org_fk
    FOREIGN KEY (standard_version_id, standard_id, organization_id)
    REFERENCES standard_versions(id, standard_id, organization_id),
  ADD CONSTRAINT onboarding_processes_owner_membership_fk
    FOREIGN KEY (organization_id, owner_user_id)
    REFERENCES memberships(organization_id, user_id),
  ADD CONSTRAINT onboarding_processes_trainer_membership_fk
    FOREIGN KEY (organization_id, trainer_user_id)
    REFERENCES memberships(organization_id, user_id),
  ADD CONSTRAINT onboarding_processes_evaluator_membership_fk
    FOREIGN KEY (organization_id, evaluator_user_id)
    REFERENCES memberships(organization_id, user_id),
  ADD CONSTRAINT onboarding_processes_buddy_membership_fk
    FOREIGN KEY (organization_id, buddy_user_id)
    REFERENCES memberships(organization_id, user_id);

-- Replace coarse TODO/IN_PROGRESS/DONE with factual BOS stage progress.
ALTER TABLE onboarding_task_progress
  ADD COLUMN legacy_status text,
  ADD COLUMN explained_at timestamptz,
  ADD COLUMN explained_by_user_id uuid REFERENCES users(id),
  ADD COLUMN shown_at timestamptz,
  ADD COLUMN shown_by_user_id uuid REFERENCES users(id),
  ADD COLUMN together_at timestamptz,
  ADD COLUMN together_by_user_id uuid REFERENCES users(id),
  ADD COLUMN solo_at timestamptz,
  ADD COLUMN solo_by_user_id uuid REFERENCES users(id),
  ADD COLUMN checked_at timestamptz,
  ADD COLUMN checked_by_user_id uuid REFERENCES users(id);

UPDATE onboarding_task_progress
SET legacy_status = status::text;

-- Legacy DONE meant the old task was considered complete. Preserve that fact by
-- materialising all five BOS stages at the old completion/update timestamp.
UPDATE onboarding_task_progress
SET explained_at = COALESCE(completed_at, updated_at),
    shown_at = COALESCE(completed_at, updated_at),
    together_at = COALESCE(completed_at, updated_at),
    solo_at = COALESCE(completed_at, updated_at),
    checked_at = COALESCE(completed_at, updated_at),
    explained_by_user_id = completed_by_user_id,
    shown_by_user_id = completed_by_user_id,
    together_by_user_id = completed_by_user_id,
    solo_by_user_id = completed_by_user_id,
    checked_by_user_id = completed_by_user_id
WHERE status = 'DONE';

ALTER TABLE onboarding_task_progress
  DROP COLUMN status,
  DROP COLUMN completed_at,
  DROP COLUMN completed_by_user_id,
  ADD CONSTRAINT onboarding_task_progress_process_org_fk
    FOREIGN KEY (onboarding_process_id, organization_id)
    REFERENCES onboarding_processes(id, organization_id),
  ADD CONSTRAINT onboarding_task_progress_task_org_fk
    FOREIGN KEY (standard_task_id, organization_id)
    REFERENCES standard_tasks(id, organization_id),
  ADD CONSTRAINT onboarding_task_progress_checked_actor_membership_fk
    FOREIGN KEY (organization_id, checked_by_user_id)
    REFERENCES memberships(organization_id, user_id);

-- Preserve the old one-row closure table exactly as legacy history.
ALTER TABLE onboarding_closures RENAME TO onboarding_closures_legacy;
ALTER INDEX onboarding_closures_org_idx RENAME TO onboarding_closures_legacy_org_idx;

-- New closure table is append-only decision history.
CREATE TABLE onboarding_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  onboarding_process_id uuid NOT NULL,
  standard_id uuid NOT NULL,
  standard_version_id uuid NOT NULL,
  employee_name_snapshot text NOT NULL,
  decision onboarding_decision_result NOT NULL,
  verified_by_user_id uuid NOT NULL,
  summary text NOT NULL,
  recommendations text,
  decision_sequence integer NOT NULL CHECK (decision_sequence > 0),
  supersedes_closure_id uuid,
  reopen_reason text,
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (onboarding_process_id, decision_sequence),
  UNIQUE (id, organization_id),
  FOREIGN KEY (onboarding_process_id, organization_id)
    REFERENCES onboarding_processes(id, organization_id),
  FOREIGN KEY (standard_id, organization_id)
    REFERENCES standards(id, organization_id),
  FOREIGN KEY (standard_version_id, standard_id, organization_id)
    REFERENCES standard_versions(id, standard_id, organization_id),
  FOREIGN KEY (organization_id, verified_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (supersedes_closure_id, organization_id)
    REFERENCES onboarding_closures(id, organization_id),
  CHECK (supersedes_closure_id IS NULL OR reopen_reason IS NOT NULL),
  CHECK (reopen_reason IS NULL OR btrim(reopen_reason) <> '')
);
CREATE INDEX onboarding_closures_org_idx ON onboarding_closures(organization_id);
CREATE INDEX onboarding_closures_process_idx ON onboarding_closures(onboarding_process_id, decision_sequence DESC);

-- Reopen is a first-class audit event because it happens before the next closure.
CREATE TABLE onboarding_reopen_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  onboarding_process_id uuid NOT NULL,
  closure_id uuid NOT NULL,
  reopened_by_user_id uuid NOT NULL,
  reason text NOT NULL CHECK (btrim(reason) <> ''),
  reopened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (onboarding_process_id, organization_id)
    REFERENCES onboarding_processes(id, organization_id),
  FOREIGN KEY (closure_id, organization_id)
    REFERENCES onboarding_closures(id, organization_id),
  FOREIGN KEY (organization_id, reopened_by_user_id)
    REFERENCES memberships(organization_id, user_id)
);
CREATE INDEX onboarding_reopen_events_process_idx
  ON onboarding_reopen_events(onboarding_process_id, reopened_at DESC);

-- Prevent changing the StandardVersion binding once a process has started.
CREATE OR REPLACE FUNCTION bos_guard_onboarding_standard_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'PLANNED'
     AND (NEW.standard_id IS DISTINCT FROM OLD.standard_id
          OR NEW.standard_version_id IS DISTINCT FROM OLD.standard_version_id) THEN
    RAISE EXCEPTION 'Cannot change Standard or StandardVersion after onboarding has started.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER onboarding_process_standard_binding_guard
BEFORE UPDATE ON onboarding_processes
FOR EACH ROW EXECUTE FUNCTION bos_guard_onboarding_standard_binding();

-- Published StandardVersion metadata is immutable except PUBLISHED -> ARCHIVED.
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

CREATE TRIGGER standard_versions_published_guard
BEFORE UPDATE ON standard_versions
FOR EACH ROW EXECUTE FUNCTION bos_guard_published_standard_version();

-- Version-owned child content is immutable whenever its parent is PUBLISHED.
CREATE OR REPLACE FUNCTION bos_guard_published_standard_version_child()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_version_id uuid;
  v_status standard_version_status;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_version_id := OLD.standard_version_id;
  ELSE
    v_version_id := NEW.standard_version_id;
  END IF;

  SELECT status INTO v_status FROM standard_versions WHERE id = v_version_id;
  IF v_status = 'PUBLISHED' THEN
    RAISE EXCEPTION 'Published StandardVersion content is immutable; create a new version.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER standard_tasks_published_guard
BEFORE INSERT OR UPDATE OR DELETE ON standard_tasks
FOR EACH ROW EXECUTE FUNCTION bos_guard_published_standard_version_child();
CREATE TRIGGER standard_start_requirements_published_guard
BEFORE INSERT OR UPDATE OR DELETE ON standard_start_requirements
FOR EACH ROW EXECUTE FUNCTION bos_guard_published_standard_version_child();
CREATE TRIGGER standard_readiness_criteria_published_guard
BEFORE INSERT OR UPDATE OR DELETE ON standard_readiness_criteria
FOR EACH ROW EXECUTE FUNCTION bos_guard_published_standard_version_child();

-- Closure/decision history is append-only.
CREATE OR REPLACE FUNCTION bos_guard_onboarding_closure_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Onboarding closure history is append-only.';
END;
$$;
CREATE TRIGGER onboarding_closures_append_only_guard
BEFORE UPDATE OR DELETE ON onboarding_closures
FOR EACH ROW EXECUTE FUNCTION bos_guard_onboarding_closure_append_only();

CREATE TABLE IF NOT EXISTS bos_schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO bos_schema_migrations(name)
VALUES ('007_onboarding_web_v1.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
