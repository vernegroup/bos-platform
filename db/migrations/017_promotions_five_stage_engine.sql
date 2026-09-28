BEGIN;

-- PROM-WEB-07 — Shared 5-Stage Engine
-- Promotions reuses the BOS method:
-- WYJAŚNIJ -> POKAŻ -> RAZEM -> SAM -> SPRAWDŹ.
-- Progress exists only for tasks whose effective assessment is TO_DEPLOY.

CREATE TABLE promotion_deployment_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  promotion_process_id uuid NOT NULL,
  promotion_assessment_id uuid NOT NULL,

  explained_at timestamptz,
  explained_by_user_id uuid,
  shown_at timestamptz,
  shown_by_user_id uuid,
  together_at timestamptz,
  together_by_user_id uuid,
  solo_at timestamptz,
  solo_by_user_id uuid,
  checked_at timestamptz,
  checked_by_user_id uuid,

  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (promotion_assessment_id),
  UNIQUE (id, organization_id),

  FOREIGN KEY (promotion_process_id, organization_id)
    REFERENCES promotion_processes(id, organization_id),
  FOREIGN KEY (promotion_assessment_id, organization_id)
    REFERENCES promotion_assessments(id, organization_id),

  FOREIGN KEY (organization_id, explained_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (organization_id, shown_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (organization_id, together_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (organization_id, solo_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (organization_id, checked_by_user_id)
    REFERENCES memberships(organization_id, user_id),

  CHECK ((explained_at IS NULL) = (explained_by_user_id IS NULL)),
  CHECK ((shown_at IS NULL) = (shown_by_user_id IS NULL)),
  CHECK ((together_at IS NULL) = (together_by_user_id IS NULL)),
  CHECK ((solo_at IS NULL) = (solo_by_user_id IS NULL)),
  CHECK ((checked_at IS NULL) = (checked_by_user_id IS NULL))
);

CREATE INDEX promotion_deployment_progress_process_idx
  ON promotion_deployment_progress(organization_id, promotion_process_id);

-- Deployment row must point to an assessment in the same process and tenant,
-- and that task must currently resolve to DO WDROŻENIA.
CREATE OR REPLACE FUNCTION bos_guard_promotion_deployment_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_assessment_process uuid;
  v_initial promotion_entry_assessment;
  v_verification promotion_verification_result;
  v_is_critical boolean;
BEGIN
  SELECT
    pa.promotion_process_id,
    pa.initial_assessment,
    pa.verification_result,
    ppt.is_critical_snapshot
  INTO
    v_assessment_process,
    v_initial,
    v_verification,
    v_is_critical
  FROM promotion_assessments pa
  JOIN promotion_process_tasks ppt
    ON ppt.id = pa.promotion_process_task_id
   AND ppt.organization_id = pa.organization_id
  WHERE pa.id = NEW.promotion_assessment_id
    AND pa.organization_id = NEW.organization_id;

  IF v_assessment_process IS NULL
     OR v_assessment_process <> NEW.promotion_process_id THEN
    RAISE EXCEPTION 'Deployment progress must belong to the same PromotionProcess and organization.';
  END IF;

  IF bos_promotion_effective_assessment_for_task(
       v_initial, v_verification, v_is_critical
     ) <> 'TO_DEPLOY' THEN
    RAISE EXCEPTION 'Deployment progress is allowed only for a task requiring DO WDROŻENIA.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_deployment_binding_guard
BEFORE INSERT OR UPDATE OF
  organization_id, promotion_process_id, promotion_assessment_id
ON promotion_deployment_progress
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_deployment_binding();

-- Same factual stage-order contract as BOS Onboarding.
CREATE OR REPLACE FUNCTION bos_guard_promotion_deployment_stage_order()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.checked_at IS NOT NULL AND NEW.solo_at IS NULL THEN
    RAISE EXCEPTION 'SPRAWDZ requires SAM.';
  END IF;
  IF NEW.solo_at IS NOT NULL AND NEW.together_at IS NULL THEN
    RAISE EXCEPTION 'SAM requires RAZEM.';
  END IF;
  IF NEW.together_at IS NOT NULL AND NEW.shown_at IS NULL THEN
    RAISE EXCEPTION 'RAZEM requires POKAZ.';
  END IF;
  IF NEW.shown_at IS NOT NULL AND NEW.explained_at IS NULL THEN
    RAISE EXCEPTION 'POKAZ requires WYJASNIJ.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_deployment_stage_order_guard
BEFORE INSERT OR UPDATE OF
  explained_at, explained_by_user_id,
  shown_at, shown_by_user_id,
  together_at, together_by_user_id,
  solo_at, solo_by_user_id,
  checked_at, checked_by_user_id
ON promotion_deployment_progress
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_deployment_stage_order();

-- Once factual progress exists, changing the assessment so that deployment is
-- no longer required would rewrite the process history. Block that transition.
CREATE OR REPLACE FUNCTION bos_guard_promotion_assessment_with_deployment()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_is_critical boolean;
  v_has_progress boolean;
BEGIN
  SELECT is_critical_snapshot INTO v_is_critical
  FROM promotion_process_tasks
  WHERE id = NEW.promotion_process_task_id
    AND organization_id = NEW.organization_id;

  SELECT EXISTS (
    SELECT 1
    FROM promotion_deployment_progress pdp
    WHERE pdp.promotion_assessment_id = NEW.id
      AND pdp.organization_id = NEW.organization_id
      AND (
        pdp.explained_at IS NOT NULL
        OR pdp.shown_at IS NOT NULL
        OR pdp.together_at IS NOT NULL
        OR pdp.solo_at IS NOT NULL
        OR pdp.checked_at IS NOT NULL
      )
  ) INTO v_has_progress;

  IF v_has_progress
     AND bos_promotion_effective_assessment_for_task(
       NEW.initial_assessment, NEW.verification_result, v_is_critical
     ) <> 'TO_DEPLOY' THEN
    RAISE EXCEPTION 'Cannot remove DO WDROŻENIA after deployment progress has been recorded.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_assessment_deployment_history_guard
BEFORE UPDATE OF initial_assessment, verification_result
ON promotion_assessments
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_assessment_with_deployment();

-- Complete means the whole method exists, not only SAM/SPRAWDŹ.
CREATE OR REPLACE FUNCTION bos_promotion_deployment_complete(p_process_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT
    count(*) FILTER (
      WHERE bos_promotion_effective_assessment_for_task(
        pa.initial_assessment,
        pa.verification_result,
        ppt.is_critical_snapshot
      ) = 'TO_DEPLOY'
    )
    =
    count(*) FILTER (
      WHERE bos_promotion_effective_assessment_for_task(
        pa.initial_assessment,
        pa.verification_result,
        ppt.is_critical_snapshot
      ) = 'TO_DEPLOY'
        AND pdp.explained_at IS NOT NULL
        AND pdp.shown_at IS NOT NULL
        AND pdp.together_at IS NOT NULL
        AND pdp.solo_at IS NOT NULL
        AND pdp.checked_at IS NOT NULL
    )
    AND NOT EXISTS (
      SELECT 1
      FROM promotion_process_tasks missing_task
      LEFT JOIN promotion_assessments missing_assessment
        ON missing_assessment.promotion_process_task_id = missing_task.id
       AND missing_assessment.promotion_process_id = missing_task.promotion_process_id
       AND missing_assessment.organization_id = missing_task.organization_id
      WHERE missing_task.promotion_process_id = p_process_id
        AND missing_assessment.id IS NULL
    )
    AND NOT EXISTS (
      SELECT 1
      FROM promotion_assessments unresolved
      WHERE unresolved.promotion_process_id = p_process_id
        AND unresolved.initial_assessment = 'TO_VERIFY'
        AND unresolved.verification_result IS NULL
    )
  FROM promotion_process_tasks ppt
  JOIN promotion_assessments pa
    ON pa.promotion_process_task_id = ppt.id
   AND pa.promotion_process_id = ppt.promotion_process_id
   AND pa.organization_id = ppt.organization_id
  LEFT JOIN promotion_deployment_progress pdp
    ON pdp.promotion_assessment_id = pa.id
   AND pdp.promotion_process_id = pa.promotion_process_id
   AND pdp.organization_id = pa.organization_id
  WHERE ppt.promotion_process_id = p_process_id;
$$;

COMMENT ON TABLE promotion_deployment_progress IS
  'Promotions execution of the shared BOS five-stage method for tasks whose effective assessment is DO WDROŻENIA.';
COMMENT ON FUNCTION bos_promotion_deployment_complete(uuid) IS
  'True only when Entry Assessment is resolved and every effective DO WDROŻENIA task has WYJAŚNIJ, POKAŻ, RAZEM, SAM and SPRAWDŹ.';

INSERT INTO bos_schema_migrations(name)
VALUES ('017_promotions_five_stage_engine.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
