BEGIN;

-- PROM-WEB-08 — K Gate
-- Critical (K) tasks are an independent hard gate.
-- K is never satisfied by Entry Assessment alone, including CONFIRMED or
-- TO_VERIFY -> PASS. Every K must complete the actual five-stage deployment.

CREATE OR REPLACE FUNCTION bos_promotion_k_gate_pass(p_process_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    -- Contract requires a real target task set. A Standard with no tasks cannot
    -- accidentally pass merely because it has no K rows.
    EXISTS (
      SELECT 1
      FROM promotion_process_tasks ppt
      WHERE ppt.promotion_process_id = p_process_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM promotion_process_tasks ppt
      LEFT JOIN promotion_assessments pa
        ON pa.promotion_process_task_id = ppt.id
       AND pa.promotion_process_id = ppt.promotion_process_id
       AND pa.organization_id = ppt.organization_id
      LEFT JOIN promotion_deployment_progress pdp
        ON pdp.promotion_assessment_id = pa.id
       AND pdp.promotion_process_id = ppt.promotion_process_id
       AND pdp.organization_id = ppt.organization_id
      WHERE ppt.promotion_process_id = p_process_id
        AND ppt.is_critical_snapshot = true
        AND (
          pa.id IS NULL
          OR bos_promotion_effective_assessment_for_task(
               pa.initial_assessment,
               pa.verification_result,
               ppt.is_critical_snapshot
             ) <> 'TO_DEPLOY'
          OR pdp.id IS NULL
          OR pdp.explained_at IS NULL
          OR pdp.shown_at IS NULL
          OR pdp.together_at IS NULL
          OR pdp.solo_at IS NULL
          OR pdp.checked_at IS NULL
        )
    );
$$;

-- Diagnostic projection for UI/future Final Integrity Gate. It exposes facts,
-- but does not create a manually editable "K passed" flag.
CREATE OR REPLACE VIEW promotion_k_gate_status AS
SELECT
  pp.organization_id,
  pp.id AS promotion_process_id,
  count(ppt.id) FILTER (WHERE ppt.is_critical_snapshot) AS critical_total,
  count(ppt.id) FILTER (
    WHERE ppt.is_critical_snapshot
      AND pa.id IS NOT NULL
      AND bos_promotion_effective_assessment_for_task(
            pa.initial_assessment,
            pa.verification_result,
            ppt.is_critical_snapshot
          ) = 'TO_DEPLOY'
      AND pdp.id IS NOT NULL
      AND pdp.explained_at IS NOT NULL
      AND pdp.shown_at IS NOT NULL
      AND pdp.together_at IS NOT NULL
      AND pdp.solo_at IS NOT NULL
      AND pdp.checked_at IS NOT NULL
  ) AS critical_complete,
  bos_promotion_k_gate_pass(pp.id) AS is_passed
FROM promotion_processes pp
LEFT JOIN promotion_process_tasks ppt
  ON ppt.promotion_process_id = pp.id
 AND ppt.organization_id = pp.organization_id
LEFT JOIN promotion_assessments pa
  ON pa.promotion_process_task_id = ppt.id
 AND pa.promotion_process_id = pp.id
 AND pa.organization_id = pp.organization_id
LEFT JOIN promotion_deployment_progress pdp
  ON pdp.promotion_assessment_id = pa.id
 AND pdp.promotion_process_id = pp.id
 AND pdp.organization_id = pp.organization_id
GROUP BY pp.organization_id, pp.id;

COMMENT ON FUNCTION bos_promotion_k_gate_pass(uuid) IS
  'Hard Promotions K gate: every critical task must have actual full WYJAŚNIJ→POKAŻ→RAZEM→SAM→SPRAWDŹ deployment. CONFIRMED/PASS never waives K.';
COMMENT ON VIEW promotion_k_gate_status IS
  'Derived K gate diagnostics for Promotions; never a manually editable readiness flag.';

INSERT INTO bos_schema_migrations(name)
VALUES ('018_promotions_k_gate.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
