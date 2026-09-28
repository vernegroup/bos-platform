BEGIN;

-- PROM-WEB-13 — Decision Model
-- Human manager decision: READY / NOT_YET / STOP.
-- The system verifies whether READY is legally/domain-allowed; it never chooses
-- READY automatically.

CREATE TYPE promotion_decision AS ENUM (
  'READY',
  'NOT_YET',
  'STOP'
);

CREATE TABLE promotion_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  promotion_process_id uuid NOT NULL,

  decision promotion_decision NOT NULL,
  decision_sequence integer NOT NULL CHECK (decision_sequence > 0),
  decided_by_user_id uuid NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  note text,

  -- Snapshot of the seven gates at the moment of the human decision.
  standard_pass boolean NOT NULL,
  process_pass boolean NOT NULL,
  entry_pass boolean NOT NULL,
  deployment_pass boolean NOT NULL,
  k_pass boolean NOT NULL,
  readiness_pass boolean NOT NULL,
  transition_pass boolean NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (promotion_process_id, decision_sequence),
  UNIQUE (id, organization_id),

  FOREIGN KEY (promotion_process_id, organization_id)
    REFERENCES promotion_processes(id, organization_id),
  FOREIGN KEY (organization_id, decided_by_user_id)
    REFERENCES memberships(organization_id, user_id)
);

CREATE INDEX promotion_decisions_process_idx
  ON promotion_decisions(
    organization_id,
    promotion_process_id,
    decision_sequence DESC
  );

-- Decision insertion is the only supported write path. It snapshots the current
-- gate facts and enforces the asymmetric decision semantics:
-- READY requires all seven gates; NOT_YET and STOP do not fake completion.
CREATE OR REPLACE FUNCTION bos_record_promotion_decision(
  p_process_id uuid,
  p_decision promotion_decision,
  p_decided_by_user_id uuid,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_org uuid;
  v_next_sequence integer;
  v_decision_id uuid;
  v_standard boolean;
  v_process boolean;
  v_entry boolean;
  v_deployment boolean;
  v_k boolean;
  v_readiness boolean;
  v_transition boolean;
BEGIN
  SELECT organization_id INTO v_org
  FROM promotion_processes
  WHERE id = p_process_id
  FOR UPDATE;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'PromotionProcess not found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.organization_id = v_org
      AND m.user_id = p_decided_by_user_id
  ) THEN
    RAISE EXCEPTION 'Decision actor must be a member of the PromotionProcess organization.';
  END IF;

  SELECT
    bos_promotion_standard_gate_pass(p_process_id),
    bos_promotion_process_gate_pass(p_process_id),
    bos_promotion_entry_gate_pass(p_process_id),
    bos_promotion_deployment_gate_pass(p_process_id),
    bos_promotion_k_gate_pass(p_process_id),
    bos_promotion_readiness_pass(p_process_id),
    bos_promotion_transition_closed(p_process_id)
  INTO
    v_standard,
    v_process,
    v_entry,
    v_deployment,
    v_k,
    v_readiness,
    v_transition;

  IF p_decision = 'READY'
     AND NOT (
       coalesce(v_standard, false)
       AND coalesce(v_process, false)
       AND coalesce(v_entry, false)
       AND coalesce(v_deployment, false)
       AND coalesce(v_k, false)
       AND coalesce(v_readiness, false)
       AND coalesce(v_transition, false)
     ) THEN
    RAISE EXCEPTION 'GOTOWY requires all seven Final Integrity Gates to pass.';
  END IF;

  -- NOT_YET and STOP deliberately do not require READY gates. They record the
  -- actual incomplete state instead of manufacturing completion.
  SELECT coalesce(max(decision_sequence), 0) + 1
    INTO v_next_sequence
  FROM promotion_decisions
  WHERE promotion_process_id = p_process_id;

  INSERT INTO promotion_decisions(
    organization_id,
    promotion_process_id,
    decision,
    decision_sequence,
    decided_by_user_id,
    decided_at,
    note,
    standard_pass,
    process_pass,
    entry_pass,
    deployment_pass,
    k_pass,
    readiness_pass,
    transition_pass
  ) VALUES (
    v_org,
    p_process_id,
    p_decision,
    v_next_sequence,
    p_decided_by_user_id,
    now(),
    p_note,
    coalesce(v_standard, false),
    coalesce(v_process, false),
    coalesce(v_entry, false),
    coalesce(v_deployment, false),
    coalesce(v_k, false),
    coalesce(v_readiness, false),
    coalesce(v_transition, false)
  )
  RETURNING id INTO v_decision_id;

  RETURN v_decision_id;
END;
$$;

-- Decision facts cannot be edited or deleted. PROM-WEB-14 will build closure
-- lifecycle semantics on top of this append-only decision history.
CREATE OR REPLACE FUNCTION bos_guard_promotion_decision_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Promotion decision history is append-only.';
END;
$$;

CREATE TRIGGER promotion_decision_append_only_guard
BEFORE UPDATE OR DELETE ON promotion_decisions
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_decision_append_only();

CREATE OR REPLACE VIEW promotion_latest_decision AS
SELECT DISTINCT ON (pd.organization_id, pd.promotion_process_id)
  pd.organization_id,
  pd.promotion_process_id,
  pd.id AS decision_id,
  pd.decision,
  pd.decision_sequence,
  pd.decided_by_user_id,
  pd.decided_at,
  pd.note,
  pd.standard_pass,
  pd.process_pass,
  pd.entry_pass,
  pd.deployment_pass,
  pd.k_pass,
  pd.readiness_pass,
  pd.transition_pass
FROM promotion_decisions pd
ORDER BY
  pd.organization_id,
  pd.promotion_process_id,
  pd.decision_sequence DESC;

COMMENT ON TABLE promotion_decisions IS
  'Append-only human Promotions decisions with a snapshot of all seven Final Integrity Gates.';
COMMENT ON FUNCTION bos_record_promotion_decision(uuid, promotion_decision, uuid, text) IS
  'Records a human READY/NOT_YET/STOP decision. READY requires all seven gates; NOT_YET/STOP preserve incomplete reality without artificial completion.';
COMMENT ON VIEW promotion_latest_decision IS
  'Latest human decision per PromotionProcess; full history remains in promotion_decisions.';

INSERT INTO bos_schema_migrations(name)
VALUES ('023_promotions_decision_model.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
