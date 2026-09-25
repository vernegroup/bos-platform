BEGIN;

CREATE TABLE IF NOT EXISTS analytics_raw_events (
  id bigserial PRIMARY KEY,
  schema_version text NOT NULL,
  event_id text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL,
  domain text NOT NULL,
  app_id text NOT NULL,
  environment text NOT NULL,
  path text NOT NULL,
  session_id text,
  event text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT analytics_raw_events_data_object CHECK (jsonb_typeof(data) = 'object')
);

CREATE INDEX IF NOT EXISTS analytics_raw_events_occurred_at_idx ON analytics_raw_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_raw_events_scope_idx ON analytics_raw_events (domain, app_id, environment, path, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_raw_events_event_idx ON analytics_raw_events (event, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_raw_events_session_idx ON analytics_raw_events (session_id, occurred_at DESC) WHERE session_id IS NOT NULL;

INSERT INTO bos_schema_migrations(name) VALUES ('012_analytics_raw_events.sql') ON CONFLICT(name) DO NOTHING;

COMMIT;
