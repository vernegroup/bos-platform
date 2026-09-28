BEGIN;

-- PROM-WEB-06 — Verification Branch
-- DO SPRAWDZENIA -> SPRAWDŹ -> PASS/FAIL.
-- PASS resolves to POTWIERDZONE; FAIL resolves to DO WDROŻENIA.
-- Verification is allowed only for an assessment initially marked TO_VERIFY.

CREATE TYPE promotion_verification_result AS ENUM ('PASS', 'FAIL');

ALTER TABLE promotion_assessments
  ADD COLUMN verification_result promotion_verification_result,
  ADD COLUMN verification_by_user_id uuid,
  ADD COLUMN verification_at timestamptz,
  ADD COLUMN verification_note text,
  ADD CONSTRAINT promotion_assessments_verification_actor_membership_fk
    FOREIGN KEY (organization_id, verification_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  ADD CONSTRAINT promotion_assessments_verification_shape_check
    CHECK (
      (
        verification_result IS NULL
        AND verification_by_user_id IS NULL
        AND verification_at IS NULL
      )
      OR
      (
        verification_result IS NOT NULL
        AND verification_by_user_id IS NOT NULL
        AND verification_at IS NOT NULL
      )
    );

-- Enforce the branch itself:
-- only TO_VERIFY can receive PASS/FAIL; other entry states cannot carry
-- verification results because they have no verification branch.
CREATE OR REPLACE FUNCTION bos_guard_promotion_verification_branch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.initial_assessment <> 'TO_VERIFY'
     AND (
       NEW.verification_result IS NOT NULL
       OR NEW.verification_by_user_id IS NOT NULL
       OR NEW.verification_at IS NOT NULL
     ) THEN
    RAISE EXCEPTION 'Only DO SPRAWDZENIA assessment can have a verification result.';
  END IF;

  -- Once a factual verification result exists, changing the initial branch
  -- would rewrite its meaning. Clear/rework must be an explicit later domain
  -- operation, not a side effect of changing the entry assessment.
  IF TG_OP = 'UPDATE'
     AND OLD.verification_result IS NOT NULL
     AND NEW.initial_assessment IS DISTINCT FROM OLD.initial_assessment THEN
    RAISE EXCEPTION 'Cannot change entry assessment after verification has been recorded.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_assessment_verification_branch_guard
BEFORE INSERT OR UPDATE ON promotion_assessments
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_verification_branch();

-- Effective status is derived from the entry assessment and verification result.
-- It is intentionally not stored as a freely editable column.
CREATE OR REPLACE FUNCTION bos_promotion_effective_assessment(
  p_initial promotion_entry_assessment,
  p_verification promotion_verification_result
)
RETURNS promotion_entry_assessment
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_initial = 'CONFIRMED' THEN 'CONFIRMED'::promotion_entry_assessment
    WHEN p_initial = 'TO_DEPLOY' THEN 'TO_DEPLOY'::promotion_entry_assessment
    WHEN p_initial = 'TO_VERIFY' AND p_verification = 'PASS'
      THEN 'CONFIRMED'::promotion_entry_assessment
    WHEN p_initial = 'TO_VERIFY' AND p_verification = 'FAIL'
      THEN 'TO_DEPLOY'::promotion_entry_assessment
    ELSE 'TO_VERIFY'::promotion_entry_assessment
  END;
$$;

-- K policy from the frozen contract: K can never be waived by CONFIRMED or PASS.
-- This function is the authoritative effective state for downstream deployment.
CREATE OR REPLACE FUNCTION bos_promotion_effective_assessment_for_task(
  p_initial promotion_entry_assessment,
  p_verification promotion_verification_result,
  p_is_critical boolean
)
RETURNS promotion_entry_assessment
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_is_critical THEN 'TO_DEPLOY'::promotion_entry_assessment
    ELSE bos_promotion_effective_assessment(p_initial, p_verification)
  END;
$$;

-- Entry gate is complete only when every target task has an assessment AND
-- every DO SPRAWDZENIA branch has an actual PASS/FAIL result.
CREATE OR REPLACE FUNCTION bos_promotion_entry_assessment_complete(p_process_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT
    count(*) > 0
    AND count(*) = count(pa.id)
    AND bool_and(
      pa.initial_assessment <> 'TO_VERIFY'
      OR pa.verification_result IS NOT NULL
    )
  FROM promotion_process_tasks ppt
  LEFT JOIN promotion_assessments pa
    ON pa.promotion_process_task_id = ppt.id
   AND pa.promotion_process_id = ppt.promotion_process_id
   AND pa.organization_id = ppt.organization_id
  WHERE ppt.promotion_process_id = p_process_id;
$$;

COMMENT ON TYPE promotion_verification_result IS
  'Result of SPRAWDŹ for an entry assessment initially marked DO SPRAWDZENIA.';
COMMENT ON FUNCTION bos_promotion_effective_assessment(promotion_entry_assessment, promotion_verification_result) IS
  'TO_VERIFY+PASS => CONFIRMED; TO_VERIFY+FAIL => TO_DEPLOY; unresolved TO_VERIFY remains TO_VERIFY.';
COMMENT ON FUNCTION bos_promotion_effective_assessment_for_task(promotion_entry_assessment, promotion_verification_result, boolean) IS
  'Downstream effective assessment including Promotions K policy: every K task resolves to TO_DEPLOY.';

INSERT INTO bos_schema_migrations(name)
VALUES ('016_promotions_verification_branch.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
