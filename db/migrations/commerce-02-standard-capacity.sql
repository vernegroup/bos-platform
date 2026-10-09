-- C02-03: run on isolated Neon validation branch FIRST. Not executed by this commit.
CREATE TABLE IF NOT EXISTS standard_capacity_consumptions (
  standard_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  product_id uuid NOT NULL REFERENCES products(id),
  first_published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS standard_capacity_consumptions_scope_idx
  ON standard_capacity_consumptions(organization_id,product_id);

CREATE TABLE IF NOT EXISTS standard_capacity_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity % 10 = 0),
  source text NOT NULL CHECK (source IN ('BASE','STRIPE','LEGACY')),
  stripe_checkout_session_id text UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((source='STRIPE' AND stripe_checkout_session_id IS NOT NULL)
      OR (source<>'STRIPE' AND stripe_checkout_session_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS standard_capacity_grants_base_unique
  ON standard_capacity_grants(organization_id,product_id) WHERE source='BASE';

-- Backfill ONLY unambiguously attributed historical publications.
INSERT INTO standard_capacity_consumptions
  (standard_id,organization_id,product_id,first_published_at)
SELECT s.id,s.organization_id,s.product_id,MIN(COALESCE(v.published_at,v.created_at))
FROM standards s JOIN standard_versions v
  ON v.standard_id=s.id AND v.organization_id=s.organization_id
WHERE s.product_id IS NOT NULL AND v.status='PUBLISHED'
GROUP BY s.id,s.organization_id,s.product_id
ON CONFLICT (standard_id) DO NOTHING;

-- Base entitlements: exactly one BASE grant per organization/product with ACTIVE PERPETUAL license.
INSERT INTO standard_capacity_grants(organization_id,product_id,quantity,source)
SELECT l.organization_id,l.product_id,10,'BASE'
FROM licenses l
WHERE l.status='ACTIVE' AND l.license_type='PERPETUAL'
ON CONFLICT DO NOTHING;

-- Legacy overage: preserve already-published Standards without retroactive payment.
WITH usage AS (
  SELECT organization_id,product_id,COUNT(*)::int used
  FROM standard_capacity_consumptions GROUP BY organization_id,product_id
), base AS (
  SELECT organization_id,product_id,COALESCE(SUM(quantity),0)::int capacity
  FROM standard_capacity_grants WHERE status='ACTIVE' GROUP BY organization_id,product_id
)
INSERT INTO standard_capacity_grants(organization_id,product_id,quantity,source)
SELECT u.organization_id,u.product_id,10*CEIL((u.used-b.capacity)::numeric/10)::int,'LEGACY'
FROM usage u JOIN base b USING(organization_id,product_id)
WHERE u.used>b.capacity
  AND NOT EXISTS(SELECT 1 FROM standard_capacity_grants g
    WHERE g.organization_id=u.organization_id AND g.product_id=u.product_id AND g.source='LEGACY');

-- Manual review required: NULL product_id records remain unassigned.
-- SELECT s.id,s.organization_id,s.status FROM standards s WHERE s.product_id IS NULL;
