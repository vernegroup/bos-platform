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

-- Create Employee Core identity when a legacy Promotions user has not yet been
-- represented there. Membership FK in Employee Core prevents cross-tenant links.
INSERT INTO employees(
  organization_id, first_name, last_name, linked_user_id, created_at, updated_at
)
SELECT DISTINCT ON (pp.organization_id, pp.legacy_employee_user_id)
  pp.organization_id,
  CASE WHEN position(' ' in btrim(pp.employee_name_snapshot)) > 0
    THEN split_part(btrim(pp.employee_name_snapshot), ' ', 1)
    ELSE btrim(pp.employee_name_snapshot) END,
  CASE WHEN position(' ' in btrim(pp.employee_name_snapshot)) > 0
    THEN substr(btrim(pp.employee_name_snapshot), position(' ' in btrim(pp.employee_name_snapshot)) + 1)
    ELSE '' END,
  pp.legacy_employee_user_id,
  min(pp.created_at) OVER (PARTITION BY pp.organization_id, pp.legacy_employee_user_id),
  now()
FROM promotion_processes pp
WHERE pp.employee_id IS NULL
  AND pp.legacy_employee_user_id IS NOT NULL
  AND btrim(pp.employee_name_snapshot) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM employees e
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

-- A pre-Employee-Core Promotions row could legally have employee_id NULL.
-- Do not guess that two equal display names are the same person. Give each such
-- historical process an explicit tenant-scoped Employee identity, traceable by
-- a migration-only employee_number. This is safer than name-based merging.
INSERT INTO employees(
  organization_id, employee_number, first_name, last_name, created_at, updated_at
)
SELECT
  pp.organization_id,
  'legacy-promotion:' || pp.id::text,
  CASE WHEN position(' ' in btrim(pp.employee_name_snapshot)) > 0
    THEN split_part(btrim(pp.employee_name_snapshot), ' ', 1)
    ELSE btrim(pp.employee_name_snapshot) END,
  CASE WHEN position(' ' in btrim(pp.employee_name_snapshot)) > 0
    THEN substr(btrim(pp.employee_name_snapshot), position(' ' in btrim(pp.employee_name_snapshot)) + 1)
    ELSE '' END,
  pp.created_at,
  now()
FROM promotion_processes pp
WHERE pp.employee_id IS NULL
  AND pp.legacy_employee_user_id IS NULL
  AND btrim(pp.employee_name_snapshot) <> '';

UPDATE promotion_processes pp
SET employee_id = e.id
FROM employees e
WHERE pp.employee_id IS NULL
  AND e.organization_id = pp.organization_id
  AND e.employee_number = 'legacy-promotion:' || pp.id::text;

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

ALTER TABLE promotion_processes
  ADD CONSTRAINT promotion_processes_id_org_unique
  UNIQUE (id, organization_id);

CREATE INDEX promotion_processes_employee_idx
  ON promotion_processes(organization_id, employee_id);

COMMENT ON COLUMN promotion_processes.legacy_employee_user_id IS
  'Legacy pre-Employee-Core user reference retained for migration audit; not employee identity.';

COMMENT ON COLUMN promotion_processes.employee_name_snapshot IS
  'Historical employee display-name snapshot for this process; identity is employee_id.';

INSERT INTO bos_schema_migrations(name)
VALUES ('013_promotions_employee_core.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
