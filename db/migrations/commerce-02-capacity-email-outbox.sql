-- COMMERCE-02: durable, per-checkout transactional confirmation email outbox.
-- Apply to isolated Neon branch first, then deploy with the corresponding application code.
CREATE TABLE IF NOT EXISTS standard_capacity_email_outbox (
  stripe_checkout_session_id text PRIMARY KEY REFERENCES standard_capacity_grants(stripe_checkout_session_id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  product_id uuid NOT NULL REFERENCES products(id),
  recipient_email text NOT NULL,
  product_name text NOT NULL,
  total_capacity integer NOT NULL CHECK (total_capacity > 0),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENDING','SENT')),
  attempt_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  resend_email_id text,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS standard_capacity_email_outbox_pending_idx
  ON standard_capacity_email_outbox(status,locked_until) WHERE status <> 'SENT';
