BEGIN;

ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_organization_id_product_id_key;
CREATE UNIQUE INDEX licenses_one_active_per_product_idx
  ON licenses(organization_id, product_id)
  WHERE status = 'ACTIVE';

INSERT INTO products (key, name, status, current_version)
VALUES
  ('onboarding', 'BOS Onboarding', 'ACTIVE', '1.0'),
  ('promotions', 'BOS Promotions', 'ACTIVE', '1.0')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  current_version = EXCLUDED.current_version,
  updated_at = now();

COMMIT;
