BEGIN;

CREATE OR REPLACE FUNCTION bos_promotion_active_member(p_org uuid,p_user uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT EXISTS(SELECT 1 FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=p_org AND m.user_id=p_user AND m.status='ACTIVE' AND u.status='ACTIVE');
$$;

CREATE OR REPLACE FUNCTION bos_guard_promotion_process_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.organization_id IS DISTINCT FROM NEW.organization_id OR OLD.product_id IS DISTINCT FROM NEW.product_id OR OLD.employee_id IS DISTINCT FROM NEW.employee_id OR OLD.employee_name_snapshot IS DISTINCT FROM NEW.employee_name_snapshot OR OLD.from_role IS DISTINCT FROM NEW.from_role OR OLD.to_role IS DISTINCT FROM NEW.to_role OR OLD.change_type IS DISTINCT FROM NEW.change_type OR OLD.started_on IS DISTINCT FROM NEW.started_on OR OLD.created_by_user_id IS DISTINCT FROM NEW.created_by_user_id THEN RAISE EXCEPTION 'PromotionProcess identity is immutable after creation.'; END IF;
 IF EXISTS(SELECT 1 FROM promotion_closure_events c WHERE c.promotion_process_id=OLD.id) THEN RAISE EXCEPTION 'Closed PromotionProcess is immutable.'; END IF;
 RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS promotion_process_identity_guard ON promotion_processes;
CREATE TRIGGER promotion_process_identity_guard BEFORE UPDATE ON promotion_processes FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_process_identity();

CREATE OR REPLACE FUNCTION bos_guard_promotion_open_child_write() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_pid uuid;
BEGIN
 v_pid:=COALESCE((to_jsonb(NEW)->>'promotion_process_id')::uuid,(to_jsonb(OLD)->>'promotion_process_id')::uuid);
 IF EXISTS(SELECT 1 FROM promotion_closure_events c WHERE c.promotion_process_id=v_pid) THEN RAISE EXCEPTION 'Closed PromotionProcess cannot be modified.'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS promotion_assessments_open_guard ON promotion_assessments;
CREATE TRIGGER promotion_assessments_open_guard BEFORE INSERT OR UPDATE OR DELETE ON promotion_assessments FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_open_child_write();
DROP TRIGGER IF EXISTS promotion_deployment_open_guard ON promotion_deployment_progress;
CREATE TRIGGER promotion_deployment_open_guard BEFORE INSERT OR UPDATE OR DELETE ON promotion_deployment_progress FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_open_child_write();
DROP TRIGGER IF EXISTS promotion_readiness_open_guard ON promotion_readiness_checks;
CREATE TRIGGER promotion_readiness_open_guard BEFORE INSERT OR UPDATE OR DELETE ON promotion_readiness_checks FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_open_child_write();
DROP TRIGGER IF EXISTS promotion_transition_open_guard ON promotion_transition_items;
CREATE TRIGGER promotion_transition_open_guard BEFORE INSERT OR UPDATE OR DELETE ON promotion_transition_items FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_open_child_write();
DROP TRIGGER IF EXISTS promotion_evidence_open_guard ON promotion_evidence_references;
CREATE TRIGGER promotion_evidence_open_guard BEFORE INSERT OR UPDATE OR DELETE ON promotion_evidence_references FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_open_child_write();

CREATE OR REPLACE FUNCTION bos_guard_promotion_active_actors() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE j jsonb;v_org uuid;k text;v_user uuid;
BEGIN
 j:=to_jsonb(NEW);v_org:=(j->>'organization_id')::uuid;
 FOREACH k IN ARRAY ARRAY['owner_user_id','created_by_user_id','assessed_by_user_id','verification_by_user_id','explained_by_user_id','shown_by_user_id','together_by_user_id','solo_by_user_id','checked_by_user_id','added_by_user_id','confirmed_by_user_id'] LOOP
  IF j ? k AND nullif(j->>k,'') IS NOT NULL THEN v_user:=(j->>k)::uuid;IF NOT bos_promotion_active_member(v_org,v_user) THEN RAISE EXCEPTION 'Promotion actor % must be an active member of organization.',k;END IF;END IF;
 END LOOP;RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS promotion_process_active_actor_guard ON promotion_processes;
CREATE TRIGGER promotion_process_active_actor_guard BEFORE INSERT OR UPDATE ON promotion_processes FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_active_actors();
DROP TRIGGER IF EXISTS promotion_assessment_active_actor_guard ON promotion_assessments;
CREATE TRIGGER promotion_assessment_active_actor_guard BEFORE INSERT OR UPDATE ON promotion_assessments FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_active_actors();
DROP TRIGGER IF EXISTS promotion_deployment_active_actor_guard ON promotion_deployment_progress;
CREATE TRIGGER promotion_deployment_active_actor_guard BEFORE INSERT OR UPDATE ON promotion_deployment_progress FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_active_actors();
DROP TRIGGER IF EXISTS promotion_readiness_active_actor_guard ON promotion_readiness_checks;
CREATE TRIGGER promotion_readiness_active_actor_guard BEFORE INSERT OR UPDATE ON promotion_readiness_checks FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_active_actors();
DROP TRIGGER IF EXISTS promotion_transition_active_actor_guard ON promotion_transition_items;
CREATE TRIGGER promotion_transition_active_actor_guard BEFORE INSERT OR UPDATE ON promotion_transition_items FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_active_actors();
DROP TRIGGER IF EXISTS promotion_evidence_active_actor_guard ON promotion_evidence_references;
CREATE TRIGGER promotion_evidence_active_actor_guard BEFORE INSERT OR UPDATE ON promotion_evidence_references FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_active_actors();

CREATE OR REPLACE FUNCTION bos_guard_promotion_decision_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_org uuid;v_seq int;v_s boolean;v_p boolean;v_e boolean;v_d boolean;v_k boolean;v_r boolean;v_t boolean;
BEGIN
 SELECT organization_id INTO v_org FROM promotion_processes WHERE id=NEW.promotion_process_id FOR UPDATE;
 IF v_org IS NULL OR NEW.organization_id IS DISTINCT FROM v_org THEN RAISE EXCEPTION 'Promotion decision tenant/process mismatch.';END IF;
 IF EXISTS(SELECT 1 FROM promotion_closure_events c WHERE c.promotion_process_id=NEW.promotion_process_id) THEN RAISE EXCEPTION 'Closed PromotionProcess cannot receive decisions.';END IF;
 IF NOT bos_promotion_active_member(v_org,NEW.decided_by_user_id) THEN RAISE EXCEPTION 'Decision actor must be an active member of the PromotionProcess organization.';END IF;
 SELECT bos_promotion_standard_gate_pass(NEW.promotion_process_id),bos_promotion_process_gate_pass(NEW.promotion_process_id),bos_promotion_entry_gate_pass(NEW.promotion_process_id),bos_promotion_deployment_gate_pass(NEW.promotion_process_id),bos_promotion_k_gate_pass(NEW.promotion_process_id),bos_promotion_readiness_pass(NEW.promotion_process_id),bos_promotion_transition_closed(NEW.promotion_process_id) INTO v_s,v_p,v_e,v_d,v_k,v_r,v_t;
 IF NEW.decision='READY' AND NOT(coalesce(v_s,false) AND coalesce(v_p,false) AND coalesce(v_e,false) AND coalesce(v_d,false) AND coalesce(v_k,false) AND coalesce(v_r,false) AND coalesce(v_t,false)) THEN RAISE EXCEPTION 'GOTOWY requires all seven Final Integrity Gates to pass.';END IF;
 SELECT coalesce(max(decision_sequence),0)+1 INTO v_seq FROM promotion_decisions WHERE promotion_process_id=NEW.promotion_process_id;
 IF NEW.decision_sequence IS DISTINCT FROM v_seq THEN RAISE EXCEPTION 'Invalid promotion decision sequence.';END IF;
 NEW.standard_pass:=coalesce(v_s,false);NEW.process_pass:=coalesce(v_p,false);NEW.entry_pass:=coalesce(v_e,false);NEW.deployment_pass:=coalesce(v_d,false);NEW.k_pass:=coalesce(v_k,false);NEW.readiness_pass:=coalesce(v_r,false);NEW.transition_pass:=coalesce(v_t,false);RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS promotion_decision_insert_guard ON promotion_decisions;
CREATE TRIGGER promotion_decision_insert_guard BEFORE INSERT ON promotion_decisions FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_decision_insert();

CREATE OR REPLACE FUNCTION bos_guard_promotion_closure_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_org uuid;v_dec promotion_decision;v_pid uuid;v_seq int;v_pp promotion_processes%ROWTYPE;
BEGIN
 SELECT pd.organization_id,pd.promotion_process_id,pd.decision INTO v_org,v_pid,v_dec FROM promotion_decisions pd WHERE pd.id=NEW.promotion_decision_id;
 IF v_org IS NULL OR NEW.organization_id IS DISTINCT FROM v_org OR NEW.promotion_process_id IS DISTINCT FROM v_pid THEN RAISE EXCEPTION 'Promotion closure tenant/process/decision mismatch.';END IF;
 IF v_dec='NOT_YET' OR NEW.closure_kind::text IS DISTINCT FROM v_dec::text THEN RAISE EXCEPTION 'Closure must match READY or STOP decision.';END IF;
 IF NOT bos_promotion_active_member(v_org,NEW.closed_by_user_id) THEN RAISE EXCEPTION 'Closure actor must be an active member of the PromotionProcess organization.';END IF;
 SELECT * INTO v_pp FROM promotion_processes WHERE id=v_pid AND organization_id=v_org FOR UPDATE;
 IF EXISTS(SELECT 1 FROM promotion_closure_events c WHERE c.promotion_process_id=v_pid) THEN RAISE EXCEPTION 'PromotionProcess is already closed.';END IF;
 IF v_dec='READY' AND NOT bos_promotion_final_integrity_gate(v_pid) THEN RAISE EXCEPTION 'GOTOWY closure requires all seven Final Integrity Gates to pass.';END IF;
 SELECT coalesce(max(closure_sequence),0)+1 INTO v_seq FROM promotion_closure_events WHERE promotion_process_id=v_pid;
 IF NEW.closure_sequence IS DISTINCT FROM v_seq THEN RAISE EXCEPTION 'Invalid promotion closure sequence.';END IF;
 NEW.employee_id:=v_pp.employee_id;NEW.employee_name_snapshot:=v_pp.employee_name_snapshot;NEW.from_role_snapshot:=v_pp.from_role;NEW.to_role_snapshot:=v_pp.to_role;NEW.change_type_snapshot:=v_pp.change_type;NEW.standard_id:=v_pp.standard_id;NEW.standard_version_id:=v_pp.standard_version_id;RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS promotion_closure_insert_guard ON promotion_closure_events;
CREATE TRIGGER promotion_closure_insert_guard BEFORE INSERT ON promotion_closure_events FOR EACH ROW EXECUTE FUNCTION bos_guard_promotion_closure_insert();

CREATE OR REPLACE FUNCTION bos_finalize_promotion_decision(p_process_id uuid,p_decision promotion_decision,p_actor_user_id uuid,p_note text DEFAULT NULL) RETURNS TABLE(decision_id uuid,closure_id uuid) LANGUAGE plpgsql AS $$
BEGIN
 decision_id:=bos_record_promotion_decision(p_process_id,p_decision,p_actor_user_id,p_note);
 IF p_decision='NOT_YET' THEN closure_id:=NULL;ELSE closure_id:=bos_close_promotion_process(decision_id,p_actor_user_id,NULL);END IF;
 RETURN NEXT;
END;$$;

INSERT INTO bos_schema_migrations(name) VALUES('025_promotions_security_integrity.sql') ON CONFLICT(name) DO NOTHING;
COMMIT;
