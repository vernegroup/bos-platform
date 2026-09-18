BEGIN;

CREATE TYPE purchase_status AS ENUM ('PENDING','PAID','FAILED','REFUNDED');

CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  product_id uuid NOT NULL REFERENCES products(id),
  buyer_email text,
  stripe_checkout_session_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_total bigint,
  currency text,
  status purchase_status NOT NULL DEFAULT 'PENDING',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purchases_org_idx ON purchases(organization_id);
CREATE INDEX purchases_buyer_email_idx ON purchases(lower(buyer_email));

CREATE TABLE stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX licenses_source_purchase_unique_idx
  ON licenses(source_purchase_id)
  WHERE source_purchase_id IS NOT NULL;

COMMIT;
