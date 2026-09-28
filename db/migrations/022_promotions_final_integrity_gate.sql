BEGIN;

-- PROM-WEB-12 — Final Integrity Gate
-- READY/GOTOWY is permitted only when all seven independent domain gates pass.
-- This is a derived, server-side/domain truth; there is no editable READY flag.

CREATE OR REPLACE FUNCTION bos_promotion_standard_gate_pass(p_process_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    pp.standard_id IS NOT NULL
    AND pp.standard_version_id IS NOT NULL
    AND sv.status = 'PUBLISHED'
    AND EXISTS (
      SELECT 1
      FROM promotion_process_tasks ppt
      WHERE ppt.promotion_process_id = pp.id
        AND ppt.organization_id = pp.organization_id
    )
    AND EXISTS (
      SELECT 1
      FROM standard_readiness_criteria src
      WHERE src.standard_version_id = pp.standard_version_id
        AND src.organization_id = pp.organization_id
    )
  FROM promotion_processes pp
  JOIN standard_versions sv
    ON sv.id = pp.standard_version_id
   AND sv.standard_id = pp.standard_id
   AND sv.organization_id = pp.organization_id
  WHERE pp.id = p_process_id;
$$;

CREATE OR REPLACE FUNCTION bos_promotion_process_gate_pass(p_process_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    pp.employee_id IS NOT NULL
    AND nullif(btrim(pp.from_role), '') IS NOT NULL
    AND nullif(btrim(pp.to_role), '') IS NOT NULL
    AND pp.change_type IN ('PROMOTION','LATERAL_MOVE')
    AND pp.owner_user_id IS NOT NULL
    AND pp.started_on IS NOT NULL
  FROM promotion_processes pp
  WHERE pp.id = p_process_id;
$$;

CREATE OR REPLACE FUNCTION bos_promotion_entry_gate_pass(p_process_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT bos_promotion_entry_assessment_complete(p_process_id);
$$;

CREATE OR REPLACE FUNCTION bos_promotion_deployment_gate_pass(p_process_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT bos_promotion_deployment_complete(p_process_id);
$$;

CREATE OR REPLACE FUNCTION bos_promotion_final_integrity_gate(p_process_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    bos_promotion_standard_gate_pass(p_process_id)
    AND bos_promotion_process_gate_pass(p_process_id)
    AND bos_promotion_entry_gate_pass(p_process_id)
    AND bos_promotion_deployment_gate_pass(p_process_id)
    AND bos_promotion_k_gate_pass(p_process_id)
    AND bos_promotion_readiness_pass(p_process_id)
    AND bos_promotion_transition_closed(p_process_id);
$$;

-- Manager-facing diagnostic projection. This is intentionally explicit:
-- UI can show exactly which gate blocks GOTOWY instead of exposing one opaque
-- percentage or one editable boolean.
CREATE OR REPLACE VIEW promotion_final_integrity_status AS
SELECT
  pp.organization_id,
  pp.id AS promotion_process_id,

  bos_promotion_standard_gate_pass(pp.id) AS standard_pass,
  bos_promotion_process_gate_pass(pp.id) AS process_pass,
  bos_promotion_entry_gate_pass(pp.id) AS entry_pass,
  bos_promotion_deployment_gate_pass(pp.id) AS deployment_pass,
  bos_promotion_k_gate_pass(pp.id) AS k_pass,
  bos_promotion_readiness_pass(pp.id) AS readiness_pass,
  bos_promotion_transition_closed(pp.id) AS transition_pass,

  bos_promotion_final_integrity_gate(pp.id) AS ready_allowed
FROM promotion_processes pp;

COMMENT ON FUNCTION bos_promotion_standard_gate_pass(uuid) IS
  'G1 STANDARD: exact published target StandardVersion, materialized task set and readiness criteria exist.';
COMMENT ON FUNCTION bos_promotion_process_gate_pass(uuid) IS
  'G2 PROCESS: minimum role-transition identity required for a positive final decision.';
COMMENT ON FUNCTION bos_promotion_entry_gate_pass(uuid) IS
  'G3 ENTRY: every target task assessed and every DO SPRAWDZENIA resolved.';
COMMENT ON FUNCTION bos_promotion_deployment_gate_pass(uuid) IS
  'G4 DEPLOYMENT: every effective DO WDROŻENIA task completed through all five BOS stages.';
COMMENT ON FUNCTION bos_promotion_final_integrity_gate(uuid) IS
  'Authoritative READY/GOTOWY gate: G1 STANDARD + G2 PROCESS + G3 ENTRY + G4 DEPLOYMENT + G5 K + G6 READINESS + G7 TRANSITION must all pass.';
COMMENT ON VIEW promotion_final_integrity_status IS
  'Explicit seven-gate Promotions readiness projection for manager UI and future decision enforcement.';

INSERT INTO bos_schema_migrations(name)
VALUES ('022_promotions_final_integrity_gate.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
