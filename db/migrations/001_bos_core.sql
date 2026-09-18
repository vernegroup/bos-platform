BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE organization_status AS ENUM ('ACTIVE','SUSPENDED');
CREATE TYPE user_status AS ENUM ('ACTIVE','INVITED','DISABLED');
CREATE TYPE membership_role AS ENUM ('OWNER','ADMIN','MANAGER','USER');
CREATE TYPE membership_status AS ENUM ('ACTIVE','INVITED','SUSPENDED');
CREATE TYPE product_status AS ENUM ('ACTIVE','HIDDEN','RETIRED');
CREATE TYPE license_status AS ENUM ('ACTIVE','REVOKED');
CREATE TYPE license_type AS ENUM ('PERPETUAL');
CREATE TYPE standard_status AS ENUM ('DRAFT','ACTIVE','ARCHIVED');
CREATE TYPE standard_version_status AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
CREATE TYPE onboarding_process_status AS ENUM ('PLANNED','IN_PROGRESS','READY_TO_CLOSE','CLOSED','CANCELLED');
CREATE TYPE onboarding_task_status AS ENUM ('TODO','IN_PROGRESS','DONE');
CREATE TYPE onboarding_closure_result AS ENUM ('COMPLETED','COMPLETED_WITH_RECOMMENDATIONS');

CREATE TABLE organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE,
 legal_name text, tax_id text, status organization_status NOT NULL DEFAULT 'ACTIVE',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), display_name text NOT NULL, email text NOT NULL UNIQUE,
 status user_status NOT NULL DEFAULT 'ACTIVE', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 user_id uuid NOT NULL REFERENCES users(id), role membership_role NOT NULL, status membership_status NOT NULL DEFAULT 'ACTIVE',
 invited_at timestamptz, joined_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,user_id)
);
CREATE INDEX memberships_org_idx ON memberships(organization_id);

CREATE TABLE products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text NOT NULL UNIQUE, name text NOT NULL,
 status product_status NOT NULL DEFAULT 'ACTIVE', current_version text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE licenses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 product_id uuid NOT NULL REFERENCES products(id), status license_status NOT NULL DEFAULT 'ACTIVE',
 license_type license_type NOT NULL DEFAULT 'PERPETUAL', granted_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz, source_purchase_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,product_id)
);
CREATE INDEX licenses_org_idx ON licenses(organization_id);

CREATE TABLE standards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 product_id uuid NOT NULL REFERENCES products(id), name text NOT NULL, area text, status standard_status NOT NULL DEFAULT 'DRAFT',
 current_version_id uuid, created_by_user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX standards_org_idx ON standards(organization_id);

CREATE TABLE standard_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 standard_id uuid NOT NULL REFERENCES standards(id), version_number integer NOT NULL CHECK(version_number > 0),
 version_label text NOT NULL, status standard_version_status NOT NULL DEFAULT 'DRAFT', change_note text,
 published_at timestamptz, created_by_user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(standard_id,version_number), UNIQUE(id,standard_id), UNIQUE(id,organization_id)
);
CREATE INDEX standard_versions_org_idx ON standard_versions(organization_id);
ALTER TABLE standards ADD CONSTRAINT standards_current_version_fk FOREIGN KEY(current_version_id,id) REFERENCES standard_versions(id,standard_id);

CREATE TABLE standard_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 standard_version_id uuid NOT NULL REFERENCES standard_versions(id), position integer NOT NULL CHECK(position > 0),
 name text NOT NULL, execution text NOT NULL, ready_when text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(standard_version_id,position), UNIQUE(id,standard_version_id)
);
CREATE INDEX standard_tasks_org_idx ON standard_tasks(organization_id);

CREATE TABLE onboarding_processes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 product_id uuid NOT NULL REFERENCES products(id), employee_id uuid REFERENCES users(id), employee_name_snapshot text NOT NULL,
 standard_id uuid NOT NULL REFERENCES standards(id), standard_version_id uuid NOT NULL,
 owner_user_id uuid NOT NULL REFERENCES users(id), buddy_user_id uuid REFERENCES users(id),
 status onboarding_process_status NOT NULL DEFAULT 'PLANNED', started_on date NOT NULL, target_on date, closed_at timestamptz,
 created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(standard_version_id,standard_id) REFERENCES standard_versions(id,standard_id),
 UNIQUE(id,standard_version_id)
);
CREATE INDEX onboarding_processes_org_idx ON onboarding_processes(organization_id);
CREATE INDEX onboarding_processes_org_status_idx ON onboarding_processes(organization_id,status);

CREATE TABLE onboarding_task_progress (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 onboarding_process_id uuid NOT NULL, standard_task_id uuid NOT NULL,
 status onboarding_task_status NOT NULL DEFAULT 'TODO', note text, completed_at timestamptz,
 completed_by_user_id uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(onboarding_process_id,standard_task_id),
 FOREIGN KEY(onboarding_process_id) REFERENCES onboarding_processes(id),
 FOREIGN KEY(standard_task_id) REFERENCES standard_tasks(id)
);
CREATE INDEX onboarding_task_progress_org_idx ON onboarding_task_progress(organization_id);

CREATE TABLE onboarding_closures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 onboarding_process_id uuid NOT NULL UNIQUE REFERENCES onboarding_processes(id), standard_id uuid NOT NULL REFERENCES standards(id),
 standard_version_id uuid NOT NULL REFERENCES standard_versions(id), employee_name_snapshot text NOT NULL,
 verified_by_user_id uuid NOT NULL REFERENCES users(id), result onboarding_closure_result NOT NULL,
 summary text NOT NULL, recommendations text, verified_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX onboarding_closures_org_idx ON onboarding_closures(organization_id);

CREATE TABLE file_resources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 product_id uuid REFERENCES products(id), storage_key text NOT NULL, original_name text NOT NULL, mime_type text NOT NULL,
 size_bytes bigint NOT NULL CHECK(size_bytes >= 0), uploaded_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX file_resources_org_idx ON file_resources(organization_id);

CREATE TABLE resource_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 file_resource_id uuid NOT NULL REFERENCES file_resources(id), entity_type text NOT NULL, entity_id uuid NOT NULL,
 purpose text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX resource_links_org_idx ON resource_links(organization_id);

CREATE TABLE activity_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 actor_user_id uuid REFERENCES users(id), product_id uuid REFERENCES products(id), entity_type text NOT NULL,
 entity_id uuid NOT NULL, action text NOT NULL, summary text NOT NULL, metadata_json jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_logs_org_created_idx ON activity_logs(organization_id,created_at DESC);

CREATE TABLE product_updates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id), version text NOT NULL,
 title text NOT NULL, description text NOT NULL, published_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(product_id,version)
);

COMMIT;
