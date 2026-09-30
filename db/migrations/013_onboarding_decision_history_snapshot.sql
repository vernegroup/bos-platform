BEGIN;

-- Decision History Integrity: every new decision owns an immutable outcome snapshot.
-- Existing decisions are intentionally NOT backfilled from mutable process state,
-- because doing so could falsify the historical state of earlier NOT_YET decisions.
ALTER TABLE onboarding_closures
  ADD COLUMN IF NOT EXISTS outcome_snapshot jsonb;

COMMENT ON COLUMN onboarding_closures.outcome_snapshot IS
  'Immutable BOS onboarding process state captured at decision time. NULL means legacy decision created before snapshot support.';

INSERT INTO bos_schema_migrations(name)
VALUES ('013_onboarding_decision_history_snapshot.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
