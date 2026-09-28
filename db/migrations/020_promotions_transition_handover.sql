BEGIN;

-- PROM-WEB-10 — Transition / Handover
-- The role A -> B transition is a real operational gate.
-- READY will later require this gate to be CLOSED.

CREATE TYPE promotion_transition_disposition AS ENUM (
  'TRANSFER',
  'RETAIN',
  'CHANGE',
  'NOT_APPLICABLE'
);

CREATE TYPE promotion_transition_confirmation AS ENUM (
  'DONE',
  'NOT_DONE',
  'PENDING'
);

CREATE TABLE promotion_transition_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  promotion_process_id uuid NOT NULL,

  position integer NOT NULL CHECK (position > 0),
  item text NOT NULL CHECK (btrim(item) <> ''),
  disposition promotion_transition_disposition NOT NULL,
  confirmation promotion_transition_confirmation NOT NULL DEFAULT 'PENDING',

  evidence_note text,
  confirmed_by_user_id uuid,
  confirmed_at timestamptz,

  created_by_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (promotion_process_id, position),
  UNIQUE (id, organization_id),

  FOREIGN KEY (promotion_process_id, organization_id)
    REFERENCES promotion_processes(id, organization_id),
  FOREIGN KEY (organization_id, created_by_user_id)
    REFERENCES memberships(organization_id, user_id),
  FOREIGN KEY (organization_id, confirmed_by_user_id)
    REFERENCES memberships(organization_id, user_id),

  CHECK (
    (confirmation = 'PENDING' AND confirmed_by_user_id IS NULL AND confirmed_at IS NULL)
    OR
    (confirmation IN ('DONE','NOT_DONE') AND confirmed_by_user_id IS NOT NULL AND confirmed_at IS NOT NULL)
  )
);

CREATE INDEX promotion_transition_items_process_idx
  ON promotion_transition_items(organization_id, promotion_process_id, position);

-- NOT_APPLICABLE is itself a completed disposition: the manager explicitly
-- decided that this concrete handover item does not apply. It still requires
-- factual confirmation (DONE), not an implicit pass.
CREATE OR REPLACE FUNCTION bos_guard_promotion_transition_item()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.disposition = 'NOT_APPLICABLE'
     AND NEW.confirmation = 'NOT_DONE' THEN
    RAISE EXCEPTION 'NOT_APPLICABLE transition item cannot be confirmed as NOT_DONE.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_transition_item_guard
BEFORE INSERT OR UPDATE ON promotion_transition_items
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_transition_item();

-- Derived transition state. No editable "closed" boolean exists.
CREATE OR REPLACE FUNCTION bos_promotion_transition_state(p_process_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN count(*) = 0 THEN 'INCOMPLETE'
    WHEN count(*) FILTER (WHERE confirmation = 'NOT_DONE') > 0 THEN 'NOT_DONE'
    WHEN count(*) FILTER (WHERE confirmation = 'PENDING') > 0 THEN 'PENDING'
    ELSE 'CLOSED'
  END
  FROM promotion_transition_items
  WHERE promotion_process_id = p_process_id;
$$;

CREATE OR REPLACE FUNCTION bos_promotion_transition_closed(p_process_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT bos_promotion_transition_state(p_process_id) = 'CLOSED';
$$;

CREATE OR REPLACE VIEW promotion_transition_status AS
SELECT
  pp.organization_id,
  pp.id AS promotion_process_id,
  count(pti.id) AS items_total,
  count(pti.id) FILTER (WHERE pti.confirmation = 'DONE') AS items_done,
  count(pti.id) FILTER (WHERE pti.confirmation = 'PENDING') AS items_pending,
  count(pti.id) FILTER (WHERE pti.confirmation = 'NOT_DONE') AS items_not_done,
  bos_promotion_transition_state(pp.id) AS transition_state,
  bos_promotion_transition_closed(pp.id) AS is_closed
FROM promotion_processes pp
LEFT JOIN promotion_transition_items pti
  ON pti.promotion_process_id = pp.id
 AND pti.organization_id = pp.organization_id
GROUP BY pp.organization_id, pp.id;

COMMENT ON TABLE promotion_transition_items IS
  'Concrete role A->B handover items: what is transferred, retained, changed or explicitly not applicable.';
COMMENT ON FUNCTION bos_promotion_transition_state(uuid) IS
  'Derived Promotions transition gate: INCOMPLETE when no items exist, otherwise NOT_DONE, PENDING or CLOSED.';
COMMENT ON FUNCTION bos_promotion_transition_closed(uuid) IS
  'Hard handover gate for future READY decision; true only when transition state is CLOSED.';

INSERT INTO bos_schema_migrations(name)
VALUES ('020_promotions_transition_handover.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
