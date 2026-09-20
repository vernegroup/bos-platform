BEGIN;

-- 1.10 fail-safe hardening: enforce process/version/content consistency at DB level.

ALTER TABLE licenses
  ADD CONSTRAINT licenses_org_product_unique UNIQUE (organization_id, product_id);

ALTER TABLE onboarding_processes
  ADD CONSTRAINT onboarding_processes_product_license_fk
    FOREIGN KEY (organization_id, product_id)
    REFERENCES licenses(organization_id, product_id),
  ADD CONSTRAINT onboarding_processes_employee_membership_fk
    FOREIGN KEY (organization_id, employee_id)
    REFERENCES memberships(organization_id, user_id);

CREATE OR REPLACE FUNCTION bos_guard_onboarding_published_version()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_status standard_version_status;
BEGIN
  SELECT status INTO v_status
  FROM standard_versions
  WHERE id = NEW.standard_version_id
    AND standard_id = NEW.standard_id
    AND organization_id = NEW.organization_id;

  IF v_status IS DISTINCT FROM 'PUBLISHED' THEN
    RAISE EXCEPTION 'OnboardingProcess requires a PUBLISHED StandardVersion.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER onboarding_process_published_version_guard
BEFORE INSERT OR UPDATE OF standard_id, standard_version_id, organization_id
ON onboarding_processes
FOR EACH ROW EXECUTE FUNCTION bos_guard_onboarding_published_version();

CREATE OR REPLACE FUNCTION bos_guard_onboarding_child_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_process_version uuid;
  v_child_version uuid;
BEGIN
  SELECT standard_version_id INTO v_process_version
  FROM onboarding_processes
  WHERE id = NEW.onboarding_process_id AND organization_id = NEW.organization_id;

  IF TG_TABLE_NAME = 'onboarding_task_progress' THEN
    SELECT standard_version_id INTO v_child_version
    FROM standard_tasks
    WHERE id = NEW.standard_task_id AND organization_id = NEW.organization_id;
  ELSIF TG_TABLE_NAME = 'onboarding_start_checks' THEN
    SELECT standard_version_id INTO v_child_version
    FROM standard_start_requirements
    WHERE id = NEW.requirement_id AND organization_id = NEW.organization_id;
  ELSE
    SELECT standard_version_id INTO v_child_version
    FROM standard_readiness_criteria
    WHERE id = NEW.readiness_criterion_id AND organization_id = NEW.organization_id;
  END IF;

  IF v_process_version IS NULL OR v_child_version IS NULL OR v_process_version <> v_child_version THEN
    RAISE EXCEPTION 'Onboarding child record must belong to the process StandardVersion.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER onboarding_task_progress_version_guard
BEFORE INSERT OR UPDATE OF onboarding_process_id, standard_task_id, organization_id
ON onboarding_task_progress
FOR EACH ROW EXECUTE FUNCTION bos_guard_onboarding_child_binding();

CREATE TRIGGER onboarding_start_checks_version_guard
BEFORE INSERT OR UPDATE OF onboarding_process_id, requirement_id, organization_id
ON onboarding_start_checks
FOR EACH ROW EXECUTE FUNCTION bos_guard_onboarding_child_binding();

CREATE TRIGGER onboarding_readiness_checks_version_guard
BEFORE INSERT OR UPDATE OF onboarding_process_id, readiness_criterion_id, organization_id
ON onboarding_readiness_checks
FOR EACH ROW EXECUTE FUNCTION bos_guard_onboarding_child_binding();

CREATE TABLE IF NOT EXISTS bos_schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO bos_schema_migrations(name)
VALUES ('010_onboarding_failsafe.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
