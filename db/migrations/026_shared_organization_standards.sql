BEGIN;

-- CORE-STD-02: Standard belongs to Organization / Shared Core, not to a product.
-- Existing product_id values are retained as legacy provenance only.
ALTER TABLE standards ALTER COLUMN product_id DROP NOT NULL;

INSERT INTO bos_schema_migrations(version,description)
VALUES ('026','CORE-STD-02 organization-owned Standards')
ON CONFLICT (version) DO NOTHING;

COMMIT;
