BEGIN;
CREATE TYPE promotion_process_status AS ENUM ('PLANNED','IN_PROGRESS','READY_TO_CLOSE','CLOSED','CANCELLED');
CREATE TYPE promotion_change_type AS ENUM ('PROMOTION','LATERAL_MOVE');
CREATE TYPE promotion_check_status AS ENUM ('TODO','DONE');
CREATE TYPE promotion_closure_result AS ENUM ('COMPLETED','COMPLETED_WITH_RECOMMENDATIONS');
CREATE TABLE promotion_processes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id), product_id uuid NOT NULL REFERENCES products(id),
 employee_id uuid REFERENCES users(id), employee_name_snapshot text NOT NULL, from_role text NOT NULL, to_role text NOT NULL, change_type promotion_change_type NOT NULL,
 owner_user_id uuid NOT NULL REFERENCES users(id), status promotion_process_status NOT NULL DEFAULT 'PLANNED', effective_on date, started_on date NOT NULL, closed_at timestamptz,
 created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX promotion_processes_org_status_idx ON promotion_processes(organization_id,status);
CREATE TABLE promotion_checks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id), promotion_process_id uuid NOT NULL REFERENCES promotion_processes(id),
 position integer NOT NULL CHECK(position>0), name text NOT NULL, criterion text NOT NULL, status promotion_check_status NOT NULL DEFAULT 'TODO',
 completed_at timestamptz, completed_by_user_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(promotion_process_id,position)
);
CREATE INDEX promotion_checks_org_idx ON promotion_checks(organization_id);
CREATE TABLE promotion_closures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id), promotion_process_id uuid NOT NULL UNIQUE REFERENCES promotion_processes(id),
 verified_by_user_id uuid NOT NULL REFERENCES users(id), result promotion_closure_result NOT NULL, summary text NOT NULL, recommendations text,
 verified_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX promotion_closures_org_idx ON promotion_closures(organization_id);
COMMIT;
