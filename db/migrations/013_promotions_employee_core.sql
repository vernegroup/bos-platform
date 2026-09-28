BEGIN;

-- PROM-WEB-03 — Employee Migration
-- Promotions stops treating a BOS user as the employee identity.
-- Employee Core (012) is authoritative. Human-readable snapshot stays historical.

ALTER TABLE promotion_processes
  RENAME COLUMN employee_id TO legacy_employee_user_id;

ALTER TABLE promotion_processes
  ADD COLUMN employee_id uuid;

-- Reuse an Employee already linked to the legacy user in this organization.
UPDATE promotion_processes pp
SET employee_id = e.id
FROM employees e
WHERE pp.legacy_employee_user_id IS NOT NULL
  AND e.organization_id = pp.organization_id
  AND e.linked_user_id = pp.legacy_employee_user_id;

-- If a legacy Promotions row has no Employee Core record yet, create one.
-- Identity is derived only inside the same organization. The snapshot is retained
-- on promotion_processes and is not replaced by current Employee display data.
INSERT INTO employees(
  organization_id,
  first_name,
  last_name,
  linked_user_id,
  created_at,
  updated_at
)
SELECT DISTINCT ON (pp.organization_id, pp.legacy_employee_user_id)
  pp.organization_id,
  CASE
    WHEN position(' ' in btrim(pp.employee_name_snapshot)) > 0
      THEN split_part(btrim(pp.employee_name_snapshot), ' ', 1)
    ELSE btrim(pp.employee_name_snapshot)
  END,
  CASE
    WHEN position(' ' in btrim(pp.employee_name_snapshot)) > 0
      THEN substr(
        btrim(pp.employee_name_snapshot),
        position(' ' in btrim(pp.employee_name_snapshot)) + 1
      )
    ELSE ''
  END,
  pp.legacy_employee_user_id,
  min(pp.created_at) OVER (
    PARTITION BY pp.organization_id, pp.legacy_employee_user_id
  ),
  now()
FROM promotion_processes pp
WHERE pp.employee_id IS NULL
  AND pp.legacy_employee_user_id IS NOT NULL
  AND btrim(pp.employee_name_snapshot) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.organization_id = pp.organization_id
      AND e.linked_user_id = pp.legacy_employee_user_id
  )
ORDER BY pp.organization_id, pp.legacy_employee_user_id, pp.created_at;

UPDATE promotion_processes pp
SET employee_id = e.id
FROM employees e
WHERE pp.employee_id IS NULL
  AND pp.legacy_employee_user_id IS NOT NULL
  AND e.organization_id = pp.organization_id
  AND e.linked_user_id = pp.legacy_employee_user_id;

-- Legacy rows without a linked BOS user still need a tenant-scoped Employee.
-- Match an existing unlinked Employee only by the exact normalized snapshot
-- inside the same organization; otherwise create a new Employee.
UPDATE promotion_processes pp
SET employee_id = e.id
FROM employees e
WHERE pp.employee_id IS NULL
  AND pp.legacy_employee_user_id IS NULL
  AND e.organization_id = pp.organization_id
  AND e.linked_user_id IS NULL
  AND lower(btrim(concat_ws(' ', e.first_name, NULLIF(e.last_name, ''))))
      = lower(btrim(pp.employee_name_snapshot))
  AND (
    SELECT count(*)
    FROM employees e2
    WHERE e2.organization_id = pp.organization_id
      AND e2.linked_user_id IS NULL
      AND lower(btrim(concat_ws(' ', e2.first_name, NULLIF(e2.last_name, ''))))
          = lower(btrim(pp.employee_name_snapshot))
  ) = 1;

INSERT INTO employees(
  organization_id,
  first_name,
  last_name,
  created_at,
  updated_at
)
SELECT
  pp.organization_id,
  CASE
    WHEN position(' ' in btrim(pp.employee_name_snapshot)) > 0
      THEN split_part(btrim(pp.employee_name_snapshot), ' ', 1)
    ELSE btrim(pp.employee_name_snapshot)
  END,
  CASE
    WHEN position(' ' in btrim(pp.employee_name_snapshot)) > 0
      THEN substr(
        btrim(pp.employee_name_snapshot),
        position(' ' in btrim(pp.employee_name_snapshot)) + 1
      )
    ELSE ''
  END,
  pp.created_at,
  now()
FROM promotion_processes pp
WHERE pp.employee_id IS NULL
  AND pp.legacy_employee_user_id IS NULL
  AND btrim(pp.employee_name_snapshot) <> '';

-- Resolve newly-created unlinked Employees deterministically. Because old rows
-- without user identity can be ambiguous, pair each unresolved process with the
-- nearest same-tenant Employee created from its snapshot and creation time.
UPDATE promotion_processes pp
SET employee_id = candidate.id
FROM LATERAL (
  SELECT e.id
  FROM employees e
  WHERE e.organization_id = pp.organization_id
    AND e.linked_user_id IS NULL
    AND lower(btrim(concat_ws(' ', e.first_name, NULLIF(e.last_name, ''))))
        = lower(btrim(pp.employee_name_snapshot))
  ORDER BY abs(extract(epoch FROM (e.created_at - pp.created_at))), e.id
  LIMIT 1
) candidate
WHERE pp.employee_id IS NULL
  AND pp.legacy_employee_user_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM promotion_processes WHERE employee_id IS NULL) THEN
    RAISE EXCEPTION 'PROM-WEB-03 aborted: not every promotion process could be mapped to Employee Core';
  END IF;
END $$;

ALTER TABLE promotion_processes
  ALTER COLUMN employee_id SET NOT NULL;

ALTER TABLE promotion_processes
  ADD CONSTRAINT promotion_processes_employee_org_fk
  FOREIGN KEY (employee_id, organization_id)
  REFERENCES employees(id, organization_id);

CREATE INDEX promotion_processes_employee_idx
  ON promotion_processes(organization_id, employee_id);

-- The old user reference is retained temporarily for migration audit only.
-- New Promotions domain code must use employee_id -> employees.
COMMENT ON COLUMN promotion_processes.legacy_employee_user_id IS
  'Legacy pre-Employee-Core user reference retained for migration audit; not employee identity.';

COMMENT ON COLUMN promotion_processes.employee_name_snapshot IS
  'Historical employee display-name snapshot for this process; identity is employee_id.';

INSERT INTO bos_schema_migrations(name)
VALUES ('013_promotions_employee_core.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
