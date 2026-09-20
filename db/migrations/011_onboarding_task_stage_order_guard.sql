BEGIN;

-- 1.14.1 fail-safe: persist BOS stages only in their required order.
CREATE OR REPLACE FUNCTION bos_guard_onboarding_task_stage_order()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.checked_at IS NOT NULL AND NEW.solo_at IS NULL THEN RAISE EXCEPTION 'SPRAWDZ requires SAM.'; END IF;
  IF NEW.solo_at IS NOT NULL AND NEW.together_at IS NULL THEN RAISE EXCEPTION 'SAM requires RAZEM.'; END IF;
  IF NEW.together_at IS NOT NULL AND NEW.shown_at IS NULL THEN RAISE EXCEPTION 'RAZEM requires POKAZ.'; END IF;
  IF NEW.shown_at IS NOT NULL AND NEW.explained_at IS NULL THEN RAISE EXCEPTION 'POKAZ requires WYJASNIJ.'; END IF;

  IF (NEW.explained_at IS NULL) <> (NEW.explained_by_user_id IS NULL) THEN RAISE EXCEPTION 'WYJASNIJ timestamp and actor must be recorded together.'; END IF;
  IF (NEW.shown_at IS NULL) <> (NEW.shown_by_user_id IS NULL) THEN RAISE EXCEPTION 'POKAZ timestamp and actor must be recorded together.'; END IF;
  IF (NEW.together_at IS NULL) <> (NEW.together_by_user_id IS NULL) THEN RAISE EXCEPTION 'RAZEM timestamp and actor must be recorded together.'; END IF;
  IF (NEW.solo_at IS NULL) <> (NEW.solo_by_user_id IS NULL) THEN RAISE EXCEPTION 'SAM timestamp and actor must be recorded together.'; END IF;
  IF (NEW.checked_at IS NULL) <> (NEW.checked_by_user_id IS NULL) THEN RAISE EXCEPTION 'SPRAWDZ timestamp and actor must be recorded together.'; END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER onboarding_task_progress_stage_order_guard
BEFORE INSERT OR UPDATE OF
  explained_at, explained_by_user_id,
  shown_at, shown_by_user_id,
  together_at, together_by_user_id,
  solo_at, solo_by_user_id,
  checked_at, checked_by_user_id
ON onboarding_task_progress
FOR EACH ROW EXECUTE FUNCTION bos_guard_onboarding_task_stage_order();

INSERT INTO bos_schema_migrations(name)
VALUES ('011_onboarding_task_stage_order_guard.sql')
ON CONFLICT(name) DO NOTHING;

COMMIT;
