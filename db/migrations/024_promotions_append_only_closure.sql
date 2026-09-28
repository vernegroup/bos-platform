BEGIN;

-- PROM-WEB-14 — Append-only Closure
-- Closure is a historical event built on top of the human decision stream.
-- READY closes the successful A->B transition.
-- STOP closes only this PromotionProcess / this attempted A->B transition.
-- NOT_YET records a decision but deliberately does not close the process.

CREATE TYPE promotion_closure_kind AS ENUM (
  'READY',
  'STOP'
);

CREATE TABLE promotion_closure_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  promotion_process_id uuid NOT NULL,
  promotion_decision_id uuid NOT NULL,

  closure_kind promotion_closure_kind NOT NULL,
  closure_sequence integer NOT NULL CHECK (closure_sequence > 0),

  employee_id uuid NOT NULL,
  employee_name_snapshot text NOT NULL CHECK (btrim(employee_name_snapshot) <> ''),
  from_role_snapshot text NOT NULL CHECK (btrim(from_role_snapshot) <> ''),
  to_role_snapshot text NOT NULL CHECK (btrim(to_role_snapshot) <> ''),
  change_type_snapshot promotion_change_type NOT NULL,
  standard_id uuid NOT NULL,
  standard_version_id uuid NOT NULL,

  closed_by_user_id uuid NOT NULL,
  closed_at timestamptz NOT NULL DEFAULT now(),
  note text,

  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (promotion_process_id, closure_sequence),
  UNIQUE (promotion_decision_id),
  UNIQUE (id, organization_id),

  FOREIGN KEY (promotion_process_id, organization_id)
    REFERENCES promotion_processes(id, organization_id),
  FOREIGN KEY (promotion_decision_id, organization_id)
    REFERENCES promotion_decisions(id, organization_id),
  FOREIGN KEY (employee_id, organization_id)
    REFERENCES employees(id, organization_id),
  FOREIGN KEY (standard_id, organization_id)
    REFERENCES standards(id, organization_id),
  FOREIGN KEY (standard_version_id, standard_id, organization_id)
    REFERENCES standard_versions(id, standard_id, organization_id),
  FOREIGN KEY (organization_id, closed_by_user_id)
    REFERENCES memberships(organization_id, user_id)
);

CREATE INDEX promotion_closure_events_process_idx
  ON promotion_closure_events(
    organization_id,
    promotion_process_id,
    closure_sequence DESC
  );

CREATE INDEX promotion_closure_events_employee_idx
  ON promotion_closure_events(
    organization_id,
    employee_id,
    closed_at DESC
  );

-- Closure is written only from an existing human decision. This keeps the
-- decision and closure semantics inseparable and prevents direct fabricated
-- closure rows.
CREATE OR REPLACE FUNCTION bos_close_promotion_process(
  p_decision_id uuid,
  p_closed_by_user_id uuid,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_org uuid;
  v_process_id uuid;
  v_decision promotion_decision;
  v_decided_by uuid;
  v_employee uuid;
  v_employee_name text;
  v_from_role text;
  v_to_role text;
  v_change_type promotion_change_type;
  v_standard uuid;
  v_standard_version uuid;
  v_sequence integer;
  v_closure_id uuid;
BEGIN
  SELECT
    pd.organization_id,
    pd.promotion_process_id,
    pd.decision,
    pd.decided_by_user_id
  INTO
    v_org,
    v_process_id,
    v_decision,
    v_decided_by
  FROM promotion_decisions pd
  WHERE pd.id = p_decision_id;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Promotion decision not found.';
  END IF;

  IF v_decision = 'NOT_YET' THEN
    RAISE EXCEPTION 'JESZCZE NIE does not close PromotionProcess.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM memberships m
    WHERE m.organization_id = v_org
      AND m.user_id = p_closed_by_user_id
  ) THEN
    RAISE EXCEPTION 'Closure actor must be a member of the PromotionProcess organization.';
  END IF;

  -- Serialize closure creation for this process.
  PERFORM 1
  FROM promotion_processes
  WHERE id = v_process_id
    AND organization_id = v_org
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM promotion_closure_events pce
    WHERE pce.promotion_process_id = v_process_id
  ) THEN
    RAISE EXCEPTION 'PromotionProcess is already closed.';
  END IF;

  SELECT
    pp.employee_id,
    pp.employee_name_snapshot,
    pp.from_role,
    pp.to_role,
    pp.change_type,
    pp.standard_id,
    pp.standard_version_id
  INTO
    v_employee,
    v_employee_name,
    v_from_role,
    v_to_role,
    v_change_type,
    v_standard,
    v_standard_version
  FROM promotion_processes pp
  WHERE pp.id = v_process_id
    AND pp.organization_id = v_org;

  IF v_employee IS NULL
     OR nullif(btrim(v_employee_name), '') IS NULL
     OR nullif(btrim(v_from_role), '') IS NULL
     OR nullif(btrim(v_to_role), '') IS NULL
     OR v_standard IS NULL
     OR v_standard_version IS NULL THEN
    RAISE EXCEPTION 'PromotionProcess lacks immutable closure identity.';
  END IF;

  -- READY must still be valid at closure time. A manager decision is historical,
  -- but closure cannot be created after the live process has regressed.
  IF v_decision = 'READY'
     AND NOT bos_promotion_final_integrity_gate(v_process_id) THEN
    RAISE EXCEPTION 'GOTOWY closure requires all seven Final Integrity Gates to pass at closure time.';
  END IF;

  SELECT coalesce(max(closure_sequence), 0) + 1
    INTO v_sequence
  FROM promotion_closure_events
  WHERE promotion_process_id = v_process_id;

  INSERT INTO promotion_closure_events(
    organization_id,
    promotion_process_id,
    promotion_decision_id,
    closure_kind,
    closure_sequence,
    employee_id,
    employee_name_snapshot,
    from_role_snapshot,
    to_role_snapshot,
    change_type_snapshot,
    standard_id,
    standard_version_id,
    closed_by_user_id,
    closed_at,
    note
  ) VALUES (
    v_org,
    v_process_id,
    p_decision_id,
    v_decision::text::promotion_closure_kind,
    v_sequence,
    v_employee,
    v_employee_name,
    v_from_role,
    v_to_role,
    v_change_type,
    v_standard,
    v_standard_version,
    p_closed_by_user_id,
    now(),
    p_note
  )
  RETURNING id INTO v_closure_id;

  RETURN v_closure_id;
END;
$$;

-- Historical closure facts are immutable.
CREATE OR REPLACE FUNCTION bos_guard_promotion_closure_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Promotion closure history is append-only.';
END;
$$;

CREATE TRIGGER promotion_closure_append_only_guard
BEFORE UPDATE OR DELETE ON promotion_closure_events
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_closure_append_only();

-- Current lifecycle is derived from immutable closure/decision history rather
-- than from a mutable status flag. NOT_YET leaves the process IN_PROGRESS.
CREATE OR REPLACE FUNCTION bos_promotion_lifecycle_state(p_process_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM promotion_closure_events pce
      WHERE pce.promotion_process_id = p_process_id
        AND pce.closure_kind = 'READY'
    ) THEN 'CLOSED'
    WHEN EXISTS (
      SELECT 1 FROM promotion_closure_events pce
      WHERE pce.promotion_process_id = p_process_id
        AND pce.closure_kind = 'STOP'
    ) THEN 'STOPPED'
    WHEN bos_promotion_final_integrity_gate(p_process_id) THEN 'READY_TO_DECIDE'
    WHEN EXISTS (
      SELECT 1 FROM promotion_decisions pd
      WHERE pd.promotion_process_id = p_process_id
    ) THEN 'IN_PROGRESS'
    ELSE 'PLANNED'
  END;
$$;

CREATE OR REPLACE VIEW promotion_closure_history AS
SELECT
  pce.organization_id,
  pce.promotion_process_id,
  pce.id AS closure_id,
  pce.closure_kind,
  pce.closure_sequence,
  pce.promotion_decision_id,
  pd.decision_sequence,
  pce.employee_id,
  pce.employee_name_snapshot,
  pce.from_role_snapshot,
  pce.to_role_snapshot,
  pce.change_type_snapshot,
  pce.standard_id,
  pce.standard_version_id,
  pce.closed_by_user_id,
  pce.closed_at,
  pce.note
FROM promotion_closure_events pce
JOIN promotion_decisions pd
  ON pd.id = pce.promotion_decision_id
 AND pd.organization_id = pce.organization_id;

COMMENT ON TABLE promotion_closure_events IS
  'Immutable Web 1.0 Promotions closure history. READY closes successful A->B; STOP closes only this specific transition attempt.';
COMMENT ON FUNCTION bos_close_promotion_process(uuid, uuid, text) IS
  'Creates closure from an existing READY or STOP human decision. NOT_YET never closes the process.';
COMMENT ON FUNCTION bos_promotion_lifecycle_state(uuid) IS
  'Derived Promotions lifecycle: PLANNED, IN_PROGRESS, READY_TO_DECIDE, CLOSED or STOPPED.';

INSERT INTO bos_schema_migrations(name)
VALUES ('024_promotions_append_only_closure.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
