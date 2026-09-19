-- BOS Onboarding corrective domain migration.
-- Implements the 2026-09-19 technical freeze additively and preserves existing records.

CREATE TYPE onboarding_decision AS ENUM ('READY','NOT_YET','STOP');
CREATE TYPE onboarding_assignment_role AS ENUM ('OWNER','MANAGER','TRAINER','BUDDY','EVALUATOR');
CREATE TYPE onboarding_check_status AS ENUM ('PENDING','SATISFIED','NOT_SATISFIED','NOT_APPLICABLE');

-- Keep legacy enum values temporarily for repository compatibility; new lifecycle values
-- are introduced now and old rows can be translated transactionally when repositories
-- are switched to the frozen lifecycle vocabulary.
ALTER TYPE onboarding_process_status ADD VALUE IF NOT EXISTS 'NOT_STARTED';
ALTER TYPE onboarding_process_status ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE onboarding_process_status ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE onboarding_process_status ADD VALUE IF NOT EXISTS 'COMPLETED';

-- Complete immutable StandardVersion task definition.
ALTER TABLE standard_tasks
  ADD COLUMN guidance text,
  ADD COLUMN is_critical boolean NOT NULL DEFAULT false,
  ADD COLUMN verification_method text;

CREATE TABLE standard_start_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  standard_version_id uuid NOT NULL REFERENCES standard_versions(id),
  position integer NOT NULL CHECK(position > 0),
  name text NOT NULL,
  description text,
  is_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(standard_version_id, position),
  UNIQUE(id, standard_version_id),
  UNIQUE(id, organization_id)
);
CREATE INDEX standard_start_requirements_org_idx
  ON standard_start_requirements(organization_id);

CREATE TABLE standard_readiness_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  standard_version_id uuid NOT NULL REFERENCES standard_versions(id),
  position integer NOT NULL CHECK(position > 0),
  name text NOT NULL,
  description text,
  verification_method text,
  is_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(standard_version_id, position),
  UNIQUE(id, standard_version_id),
  UNIQUE(id, organization_id)
);
CREATE INDEX standard_readiness_criteria_org_idx
  ON standard_readiness_criteria(organization_id);

-- Five-stage persisted evidence. Existing DONE rows are conservatively backfilled
-- as independent + verified using their existing completion evidence.
ALTER TABLE onboarding_task_progress
  ADD COLUMN explained_at timestamptz,
  ADD COLUMN shown_at timestamptz,
  ADD COLUMN together_at timestamptz,
  ADD COLUMN independent_at timestamptz,
  ADD COLUMN verified_at timestamptz,
  ADD COLUMN verified_by_user_id uuid REFERENCES users(id),
  ADD COLUMN updated_by_user_id uuid REFERENCES users(id);

UPDATE onboarding_task_progress
SET independent_at = COALESCE(independent_at, completed_at),
    verified_at = COALESCE(verified_at, completed_at),
    verified_by_user_id = COALESCE(verified_by_user_id, completed_by_user_id),
    updated_by_user_id = COALESCE(updated_by_user_id, completed_by_user_id)
WHERE status = 'DONE'
  AND completed_at IS NOT NULL;

CREATE TABLE onboarding_start_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  onboarding_process_id uuid NOT NULL REFERENCES onboarding_processes(id),
  standard_start_requirement_id uuid NOT NULL REFERENCES standard_start_requirements(id),
  status onboarding_check_status NOT NULL DEFAULT 'PENDING',
  checked_at timestamptz,
  checked_by_user_id uuid REFERENCES users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(onboarding_process_id, standard_start_requirement_id),
  UNIQUE(id, organization_id)
);
CREATE INDEX onboarding_start_checks_org_process_idx
  ON onboarding_start_checks(organization_id, onboarding_process_id);

CREATE TABLE onboarding_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  onboarding_process_id uuid NOT NULL REFERENCES onboarding_processes(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role onboarding_assignment_role NOT NULL,
  assigned_by_user_id uuid NOT NULL REFERENCES users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(onboarding_process_id, user_id, role, assigned_at),
  UNIQUE(id, organization_id)
);
CREATE INDEX onboarding_assignments_org_process_idx
  ON onboarding_assignments(organization_id, onboarding_process_id);

CREATE TABLE onboarding_readiness_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  onboarding_process_id uuid NOT NULL REFERENCES onboarding_processes(id),
  standard_readiness_criterion_id uuid NOT NULL REFERENCES standard_readiness_criteria(id),
  status onboarding_check_status NOT NULL DEFAULT 'PENDING',
  checked_at timestamptz,
  checked_by_user_id uuid REFERENCES users(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(onboarding_process_id, standard_readiness_criterion_id),
  UNIQUE(id, organization_id)
);
CREATE INDEX onboarding_readiness_checks_org_process_idx
  ON onboarding_readiness_checks(organization_id, onboarding_process_id);

-- A process can now have more than one historical closure after reassessment.
ALTER TABLE onboarding_closures
  DROP CONSTRAINT onboarding_closures_onboarding_process_id_key;

ALTER TABLE onboarding_closures
  ADD COLUMN decision onboarding_decision,
  ADD COLUMN sequence_number integer,
  ADD COLUMN previous_closure_id uuid REFERENCES onboarding_closures(id),
  ADD COLUMN reassessment_reason text,
  ADD COLUMN standard_version_label_snapshot text;

-- Existing closure semantics represented a successfully completed onboarding.
UPDATE onboarding_closures c
SET decision = 'READY',
    sequence_number = 1,
    standard_version_label_snapshot = sv.version_label
FROM standard_versions sv
WHERE c.standard_version_id = sv.id;

ALTER TABLE onboarding_closures
  ALTER COLUMN decision SET NOT NULL,
  ALTER COLUMN sequence_number SET NOT NULL;

ALTER TABLE onboarding_closures
  ADD CONSTRAINT onboarding_closures_sequence_positive CHECK(sequence_number > 0),
  ADD CONSTRAINT onboarding_closures_process_sequence_unique UNIQUE(onboarding_process_id, sequence_number);

CREATE INDEX onboarding_closures_org_process_history_idx
  ON onboarding_closures(organization_id, onboarding_process_id, sequence_number DESC);

CREATE TABLE onboarding_decision_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  onboarding_process_id uuid NOT NULL REFERENCES onboarding_processes(id),
  onboarding_closure_id uuid NOT NULL REFERENCES onboarding_closures(id),
  standard_version_id uuid NOT NULL REFERENCES standard_versions(id),
  decision onboarding_decision NOT NULL,
  decided_by_user_id uuid NOT NULL REFERENCES users(id),
  decided_at timestamptz NOT NULL,
  summary text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(onboarding_closure_id),
  UNIQUE(id, organization_id)
);
CREATE INDEX onboarding_decision_history_org_process_idx
  ON onboarding_decision_history(organization_id, onboarding_process_id, decided_at DESC);

INSERT INTO onboarding_decision_history (
  organization_id,
  onboarding_process_id,
  onboarding_closure_id,
  standard_version_id,
  decision,
  decided_by_user_id,
  decided_at,
  summary,
  reason
)
SELECT
  organization_id,
  onboarding_process_id,
  id,
  standard_version_id,
  decision,
  verified_by_user_id,
  verified_at,
  summary,
  recommendations
FROM onboarding_closures;

