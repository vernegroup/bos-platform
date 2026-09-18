BEGIN;
CREATE TABLE IF NOT EXISTS bos_schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO bos_schema_migrations(name) VALUES
 ('001_bos_core.sql'),
 ('002_auth_identity_and_tenant_constraints.sql'),
 ('003_product_licenses.sql'),
 ('004_stripe_purchases.sql'),
 ('005_promotions.sql')
ON CONFLICT(name) DO NOTHING;
COMMIT;
