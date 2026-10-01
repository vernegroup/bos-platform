BEGIN;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS source_purchase_legacy text;
UPDATE licenses
SET source_purchase_legacy=source_purchase_id
WHERE source_purchase_id IS NOT NULL
  AND source_purchase_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
UPDATE licenses
SET source_purchase_id=NULL
WHERE source_purchase_id IS NOT NULL
  AND source_purchase_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
DROP INDEX IF EXISTS licenses_source_purchase_unique_idx;
ALTER TABLE licenses ALTER COLUMN source_purchase_id TYPE uuid USING source_purchase_id::uuid;
ALTER TABLE licenses
  ADD CONSTRAINT licenses_source_purchase_fk
  FOREIGN KEY (source_purchase_id) REFERENCES purchases(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX licenses_source_purchase_unique_idx
  ON licenses(source_purchase_id) WHERE source_purchase_id IS NOT NULL;
COMMIT;
