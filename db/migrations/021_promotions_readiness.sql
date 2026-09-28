BEGIN;

-- PROM-WEB-11 — Readiness
-- Final readiness criteria come only from the exact immutable target
-- StandardVersion bound to the PromotionProcess.

CREATE TYPE promotion_readiness_result AS ENUM (
  'PASS',
  'FAIL',
  'UNRESOLVED'
);

CREATE TABLE promotion_readiness_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  promotion_process_id uuid NOT NULL,
  readiness_criterion_id uuid NOT NULL,

  criterion_snapshot text NOT NULL CHECK (btrim(criterion_snapshot) <> ''),
  verification_method_snapshot text NOT NULL CHECK (btrim(verification_method_snapshot) <> ''),
  verification_method_other_snapshot text,

  result promotion_readiness_result NOT NULL DEFAULT 'UNRESOLVED',
  checked_by_user_id uuid,
  checked_at timestamptz,
  note text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (promotion_process_id, readiness_criterion_id),
  UNIQUE (id, organization_id),

  FOREIGN KEY (promotion_process_id, organization_id)
    REFERENCES promotion_processes(id, organization_id),
  FOREIGN KEY (readiness_criterion_id, organization_id)
    REFERENCES standard_readiness_criteria(id, organization_id),
  FOREIGN KEY (organization_id, checked_by_user_id)
    REFERENCES memberships(organization_id, user_id),

  CHECK (
    (result = 'UNRESOLVED' AND checked_by_user_id IS NULL AND checked_at IS NULL)
    OR
    (result IN ('PASS','FAIL') AND checked_by_user_id IS NOT NULL AND checked_at IS NOT NULL)
  )
);

CREATE INDEX promotion_readiness_checks_process_idx
  ON promotion_readiness_checks(organization_id, promotion_process_id);

-- Criterion must belong to the exact target StandardVersion of the process.
CREATE OR REPLACE FUNCTION bos_guard_promotion_readiness_binding()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_process_version uuid;
  v_criterion_version uuid;
BEGIN
  SELECT standard_version_id INTO v_process_version
  FROM promotion_processes
  WHERE id = NEW.promotion_process_id
    AND organization_id = NEW.organization_id;

  SELECT standard_version_id INTO v_criterion_version
  FROM standard_readiness_criteria
  WHERE id = NEW.readiness_criterion_id
    AND organization_id = NEW.organization_id;

  IF v_process_version IS NULL
     OR v_criterion_version IS NULL
     OR v_process_version <> v_criterion_version THEN
    RAISE EXCEPTION 'Readiness criterion must belong to the process target StandardVersion.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_readiness_binding_guard
BEFORE INSERT OR UPDATE OF
  organization_id, promotion_process_id, readiness_criterion_id
ON promotion_readiness_checks
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_readiness_binding();

-- Snapshot semantics are immutable once materialised. The factual result may
-- evolve from UNRESOLVED to PASS/FAIL during the live process, but the criterion
-- being verified cannot silently change.
CREATE OR REPLACE FUNCTION bos_guard_promotion_readiness_snapshot()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.criterion_snapshot IS DISTINCT FROM OLD.criterion_snapshot
     OR NEW.verification_method_snapshot IS DISTINCT FROM OLD.verification_method_snapshot
     OR NEW.verification_method_other_snapshot IS DISTINCT FROM OLD.verification_method_other_snapshot THEN
    RAISE EXCEPTION 'Promotion readiness criterion snapshot is immutable.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER promotion_readiness_snapshot_guard
BEFORE UPDATE ON promotion_readiness_checks
FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_readiness_snapshot();

-- Materialise all readiness criteria from the exact target version.
CREATE OR REPLACE FUNCTION bos_seed_promotion_readiness_checks(p_process_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_org uuid;
  v_version uuid;
  v_status standard_version_status;
  v_count integer;
BEGIN
  SELECT organization_id, standard_version_id
    INTO v_org, v_version
  FROM promotion_processes
  WHERE id = p_process_id;

  IF v_org IS NULL OR v_version IS NULL THEN
    RAISE EXCEPTION 'PromotionProcess requires target StandardVersion before readiness seeding.';
  END IF;

  SELECT status INTO v_status
  FROM standard_versions
  WHERE id = v_version
    AND organization_id = v_org;

  IF v_status IS DISTINCT FROM 'PUBLISHED' THEN
    RAISE EXCEPTION 'Promotion readiness can only be seeded from a PUBLISHED StandardVersion.';
  END IF;

  INSERT INTO promotion_readiness_checks(
    organization_id,
    promotion_process_id,
    readiness_criterion_id,
    criterion_snapshot,
    verification_method_snapshot,
    verification_method_other_snapshot
  )
  SELECT
    v_org,
    p_process_id,
    src.id,
    src.criterion,
    src.verification_method::text,
    src.verification_method_other
  FROM standard_readiness_criteria src
  WHERE src.organization_id = v_org
    AND src.standard_version_id = v_version
  ORDER BY src.position
  ON CONFLICT (promotion_process_id, readiness_criterion_id) DO NOTHING;

  SELECT count(*) INTO v_count
  FROM promotion_readiness_checks
  WHERE organization_id = v_org
    AND promotion_process_id = p_process_id;

  RETURN v_count;
END;
$$;

-- READY requires every criterion defined by the exact target StandardVersion to
-- be represented and PASS. Zero criteria does not pass: Web 1.0 Standard
-- completeness expects readiness criteria before a positive final decision.
CREATE OR REPLACE FUNCTION bos_promotion_readiness_pass(p_process_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT
    count(src.id) > 0
    AND count(src.id) = count(prc.id)
    AND bool_and(prc.result = 'PASS')
  FROM promotion_processes pp
  JOIN standard_readiness_criteria src
    ON src.organization_id = pp.organization_id
   AND src.standard_version_id = pp.standard_version_id
  LEFT JOIN promotion_readiness_checks prc
    ON prc.organization_id = pp.organization_id
   AND prc.promotion_process_id = pp.id
   AND prc.readiness_criterion_id = src.id
  WHERE pp.id = p_process_id;
$$;

CREATE OR REPLACE VIEW promotion_readiness_status AS
SELECT
  pp.organization_id,
  pp.id AS promotion_process_id,
  count(src.id) AS criteria_total,
  count(prc.id) FILTER (WHERE prc.result = 'PASS') AS criteria_passed,
  count(prc.id) FILTER (WHERE prc.result = 'FAIL') AS criteria_failed,
  count(src.id) - count(prc.id) FILTER (WHERE prc.result IN ('PASS','FAIL')) AS criteria_unresolved,
  bos_promotion_readiness_pass(pp.id) AS is_passed
FROM promotion_processes pp
LEFT JOIN standard_readiness_criteria src
  ON src.organization_id = pp.organization_id
 AND src.standard_version_id = pp.standard_version_id
LEFT JOIN promotion_readiness_checks prc
  ON prc.organization_id = pp.organization_id
 AND prc.promotion_process_id = pp.id
 AND prc.readiness_criterion_id = src.id
GROUP BY pp.organization_id, pp.id;

COMMENT ON TABLE promotion_readiness_checks IS
  'Independent final readiness verification against criteria from the exact target StandardVersion.';
COMMENT ON FUNCTION bos_promotion_readiness_pass(uuid) IS
  'True only when every readiness criterion from the process target StandardVersion exists and is PASS; zero criteria does not pass.';

INSERT INTO bos_schema_migrations(name)
VALUES ('021_promotions_readiness.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
