BEGIN;

CREATE TYPE employee_status AS ENUM ('ACTIVE','INACTIVE');

CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  employee_number text,
  first_name text NOT NULL,
  last_name text NOT NULL DEFAULT '',
  position text,
  department text,
  status employee_status NOT NULL DEFAULT 'ACTIVE',
  linked_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employees_name_not_blank CHECK (btrim(first_name) <> ''),
  CONSTRAINT employees_employee_number_not_blank CHECK (employee_number IS NULL OR btrim(employee_number) <> '')
);

CREATE UNIQUE INDEX employees_id_org_unique ON employees(id,organization_id);
CREATE INDEX employees_org_status_idx ON employees(organization_id,status);
CREATE UNIQUE INDEX employees_org_employee_number_unique
  ON employees(organization_id,employee_number) WHERE employee_number IS NOT NULL;
CREATE UNIQUE INDEX employees_org_linked_user_unique
  ON employees(organization_id,linked_user_id) WHERE linked_user_id IS NOT NULL;

ALTER TABLE employees
  ADD CONSTRAINT employees_linked_user_membership_fk
  FOREIGN KEY (organization_id,linked_user_id)
  REFERENCES memberships(organization_id,user_id);

ALTER TABLE onboarding_processes RENAME COLUMN employee_id TO legacy_employee_user_id;

ALTER TABLE onboarding_processes
  ADD COLUMN employee_id uuid;

ALTER TABLE onboarding_processes
  ADD CONSTRAINT onboarding_processes_employee_org_fk
  FOREIGN KEY (employee_id,organization_id)
  REFERENCES employees(id,organization_id);

CREATE INDEX onboarding_processes_employee_idx
  ON onboarding_processes(organization_id,employee_id);

INSERT INTO employees(
  organization_id,first_name,last_name,linked_user_id,created_at,updated_at
)
SELECT DISTINCT ON (op.organization_id,COALESCE(op.legacy_employee_user_id::text,lower(btrim(op.employee_name_snapshot))))
  op.organization_id,
  CASE
    WHEN position(' ' in btrim(op.employee_name_snapshot))>0
      THEN split_part(btrim(op.employee_name_snapshot),' ',1)
    ELSE btrim(op.employee_name_snapshot)
  END,
  CASE
    WHEN position(' ' in btrim(op.employee_name_snapshot))>0
      THEN substr(btrim(op.employee_name_snapshot),position(' ' in btrim(op.employee_name_snapshot))+1)
    ELSE ''
  END,
  op.legacy_employee_user_id,
  min(op.created_at) OVER (
    PARTITION BY op.organization_id,COALESCE(op.legacy_employee_user_id::text,lower(btrim(op.employee_name_snapshot)))
  ),
  now()
FROM onboarding_processes op
WHERE btrim(op.employee_name_snapshot)<>''
ORDER BY op.organization_id,COALESCE(op.legacy_employee_user_id::text,lower(btrim(op.employee_name_snapshot))),op.created_at;

UPDATE onboarding_processes op
SET employee_id=e.id
FROM employees e
WHERE e.organization_id=op.organization_id
  AND (
    (op.legacy_employee_user_id IS NOT NULL AND e.linked_user_id=op.legacy_employee_user_id)
    OR
    (op.legacy_employee_user_id IS NULL
      AND lower(btrim(concat_ws(' ',e.first_name,NULLIF(e.last_name,''))))=lower(btrim(op.employee_name_snapshot)))
  );

ALTER TABLE onboarding_processes
  ALTER COLUMN employee_id SET NOT NULL;

INSERT INTO bos_schema_migrations(name)
VALUES ('012_employee_core.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
