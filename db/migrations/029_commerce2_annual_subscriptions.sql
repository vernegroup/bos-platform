-- COMMERCE-2 annual subscription model
ALTER TYPE license_type ADD VALUE IF NOT EXISTS 'ANNUAL';

CREATE TABLE IF NOT EXISTS commerce_offers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 key text NOT NULL UNIQUE,
 product_id uuid NOT NULL REFERENCES products(id),
 status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
 billing_interval text NOT NULL CHECK (billing_interval IN ('YEAR')),
 currency text NOT NULL DEFAULT 'pln',
 stripe_price_id_test text,
 stripe_price_id_live text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES organizations(id),
 product_id uuid NOT NULL REFERENCES products(id),
 offer_id uuid REFERENCES commerce_offers(id),
 stripe_subscription_id text NOT NULL UNIQUE,
 stripe_customer_id text,
 status text NOT NULL CHECK (status IN ('ACTIVE','PAST_DUE','CANCEL_AT_PERIOD_END','CANCELED','EXPIRED')),
 current_period_start timestamptz,
 current_period_end timestamptz,
 cancel_at_period_end boolean NOT NULL DEFAULT false,
 canceled_at timestamptz,
 latest_invoice_id text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organization_id,product_id)
);
CREATE TABLE IF NOT EXISTS subscription_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
 stripe_invoice_id text NOT NULL UNIQUE,
 stripe_payment_intent_id text,
 amount_paid bigint,
 currency text,
 status text NOT NULL CHECK (status IN ('PAID','FAILED','REFUNDED')),
 paid_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES commerce_offers(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
CREATE INDEX IF NOT EXISTS purchases_subscription_idx ON purchases(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS source_subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS valid_from timestamptz;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS valid_until timestamptz;
CREATE INDEX IF NOT EXISTS licenses_subscription_idx ON licenses(source_subscription_id) WHERE source_subscription_id IS NOT NULL;
INSERT INTO commerce_offers(key,product_id,status,billing_interval,currency)
 SELECT 'onboarding-annual',id,'ACTIVE','YEAR','pln' FROM products WHERE key='onboarding' ON CONFLICT(key) DO NOTHING;
INSERT INTO commerce_offers(key,product_id,status,billing_interval,currency)
 SELECT 'promotions-annual',id,'ACTIVE','YEAR','pln' FROM products WHERE key='promotions' ON CONFLICT(key) DO NOTHING;
