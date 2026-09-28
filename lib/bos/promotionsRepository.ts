import "server-only";
import { db } from "@/lib/db";
import type { BOSAccess } from "@/lib/bos/access";

const datePL=(v:string|Date|null)=>v?new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v)):"—";
const typePL=(v:string)=>v==="PROMOTION"?"AWANS":"PRZESUNIĘCIE";

export async function listPromotionProcesses(access:BOSAccess){
 const rows=await db().unsafe(`
  SELECT pp.id,pp.employee_name_snapshot,pp.from_role,pp.to_role,pp.change_type,
    pp.started_on,pp.effective_on,u.display_name owner,
    bos_promotion_lifecycle_state(pp.id) lifecycle_state,
    fis.standard_pass,fis.process_pass,fis.entry_pass,fis.deployment_pass,
    fis.k_pass,fis.readiness_pass,fis.transition_pass,fis.ready_allowed,
    ld.decision latest_decision,ld.decided_at latest_decision_at
  FROM promotion_processes pp
  JOIN users u ON u.id=pp.owner_user_id
  LEFT JOIN promotion_final_integrity_status fis
    ON fis.organization_id=pp.organization_id AND fis.promotion_process_id=pp.id
  LEFT JOIN promotion_latest_decision ld
    ON ld.organization_id=pp.organization_id AND ld.promotion_process_id=pp.id
  WHERE pp.organization_id=$1
    AND bos_promotion_lifecycle_state(pp.id) NOT IN ('CLOSED','STOPPED')
  ORDER BY pp.started_on DESC,pp.created_at DESC`,[access.organization.id]);
 return rows.map(r=>({
  id:r.id,employee:r.employee_name_snapshot,fromRole:r.from_role,toRole:r.to_role,
  type:typePL(r.change_type),lifecycleState:r.lifecycle_state,startedOn:datePL(r.started_on),
  effectiveOn:datePL(r.effective_on),owner:r.owner,latestDecision:r.latest_decision??undefined,
  latestDecisionAt:r.latest_decision_at?datePL(r.latest_decision_at):undefined,
  gates:{standard:!!r.standard_pass,process:!!r.process_pass,entry:!!r.entry_pass,
   deployment:!!r.deployment_pass,k:!!r.k_pass,readiness:!!r.readiness_pass,
   transition:!!r.transition_pass,readyAllowed:!!r.ready_allowed}
 }));
}

export async function listPromotionClosures(access:BOSAccess){
 const rows=await db().unsafe(`
  SELECT c.id,c.promotion_process_id,c.employee_name_snapshot,c.from_role_snapshot,
    c.to_role_snapshot,c.change_type_snapshot,c.closure_kind,c.closed_at,
    u.display_name closer,pd.decision_sequence
  FROM promotion_closure_events c
  JOIN promotion_decisions pd
    ON pd.id=c.promotion_decision_id AND pd.organization_id=c.organization_id
  JOIN users u ON u.id=c.closed_by_user_id
  WHERE c.organization_id=$1
  ORDER BY c.closed_at DESC,c.closure_sequence DESC`,[access.organization.id]);
 return rows.map(r=>({
  id:r.id,processId:r.promotion_process_id,employee:r.employee_name_snapshot,
  fromRole:r.from_role_snapshot,toRole:r.to_role_snapshot,type:typePL(r.change_type_snapshot),
  result:r.closure_kind,closedAt:datePL(r.closed_at),closer:r.closer,
  decisionSequence:r.decision_sequence
 }));
}

export async function getPromotionClosure(access:BOSAccess,id:string){
 const rows=await db().unsafe(`
  SELECT c.*,pd.decision_sequence,pd.decided_at,pd.note decision_note,
    owner.display_name owner,closer.display_name closer,s.name standard_name,sv.version_label
  FROM promotion_closure_events c
  JOIN promotion_decisions pd
    ON pd.id=c.promotion_decision_id AND pd.organization_id=c.organization_id
  JOIN promotion_processes pp
    ON pp.id=c.promotion_process_id AND pp.organization_id=c.organization_id
  JOIN users owner ON owner.id=pp.owner_user_id
  JOIN users closer ON closer.id=c.closed_by_user_id
  JOIN standards s ON s.id=c.standard_id AND s.organization_id=c.organization_id
  JOIN standard_versions sv
    ON sv.id=c.standard_version_id AND sv.standard_id=c.standard_id AND sv.organization_id=c.organization_id
  WHERE c.id=$1 AND c.organization_id=$2 LIMIT 1`,[id,access.organization.id]);
 if(!rows[0])return null;
 const r=rows[0];
 return{id:r.id,processId:r.promotion_process_id,employee:r.employee_name_snapshot,
  fromRole:r.from_role_snapshot,toRole:r.to_role_snapshot,type:typePL(r.change_type_snapshot),
  result:r.closure_kind,closedAt:datePL(r.closed_at),owner:r.owner,closer:r.closer,
  standardName:r.standard_name,standardVersion:r.version_label,
  decisionSequence:r.decision_sequence,decisionNote:r.decision_note??undefined};
}

export async function getPromotionProcess(access:BOSAccess,id:string){
 const rows=await db().unsafe(`
  SELECT pp.id,pp.employee_id,pp.employee_name_snapshot,pp.from_role,pp.to_role,
    pp.change_type,pp.started_on,pp.effective_on,pp.standard_id,pp.standard_version_id,
    s.name standard_name,sv.version_label,u.display_name owner,
    bos_promotion_lifecycle_state(pp.id) lifecycle_state,
    fis.standard_pass,fis.process_pass,fis.entry_pass,fis.deployment_pass,
    fis.k_pass,fis.readiness_pass,fis.transition_pass,fis.ready_allowed,
    ld.decision latest_decision,ld.decided_at latest_decision_at
  FROM promotion_processes pp
  JOIN users u ON u.id=pp.owner_user_id
  LEFT JOIN standards s ON s.id=pp.standard_id AND s.organization_id=pp.organization_id
  LEFT JOIN standard_versions sv
    ON sv.id=pp.standard_version_id AND sv.organization_id=pp.organization_id
  LEFT JOIN promotion_final_integrity_status fis
    ON fis.organization_id=pp.organization_id AND fis.promotion_process_id=pp.id
  LEFT JOIN promotion_latest_decision ld
    ON ld.organization_id=pp.organization_id AND ld.promotion_process_id=pp.id
  WHERE pp.id=$1 AND pp.organization_id=$2 LIMIT 1`,[id,access.organization.id]);
 if(!rows[0])return null;

 const tasks=await db().unsafe(`
  SELECT ppt.id,ppt.position_snapshot,ppt.name_snapshot,ppt.is_critical_snapshot,
    pa.id assessment_id,pa.initial_assessment,pa.verification_result,
    bos_promotion_effective_assessment_for_task(
      pa.initial_assessment,pa.verification_result,ppt.is_critical_snapshot
    ) effective_assessment,
    dp.explained_at,dp.shown_at,dp.together_at,dp.solo_at,dp.checked_at
  FROM promotion_process_tasks ppt
  LEFT JOIN promotion_assessments pa
    ON pa.promotion_process_task_id=ppt.id AND pa.organization_id=ppt.organization_id
  LEFT JOIN promotion_deployment_progress dp
    ON dp.promotion_assessment_id=pa.id AND dp.organization_id=ppt.organization_id
  WHERE ppt.promotion_process_id=$1 AND ppt.organization_id=$2
  ORDER BY ppt.position_snapshot`,[id,access.organization.id]);

 const readiness=await db().unsafe(`
  SELECT id,criterion_snapshot,verification_method_snapshot,result,checked_at
  FROM promotion_readiness_checks
  WHERE promotion_process_id=$1 AND organization_id=$2
  ORDER BY created_at,id`,[id,access.organization.id]);

 const transition=await db().unsafe(`
  SELECT id,position,item,disposition,confirmation,confirmed_at
  FROM promotion_transition_items
  WHERE promotion_process_id=$1 AND organization_id=$2
  ORDER BY position`,[id,access.organization.id]);

 const decisions=await db().unsafe(`
  SELECT id,decision,decision_sequence,decided_at,note,
    standard_pass,process_pass,entry_pass,deployment_pass,k_pass,readiness_pass,transition_pass
  FROM promotion_decisions
  WHERE promotion_process_id=$1 AND organization_id=$2
  ORDER BY decision_sequence DESC`,[id,access.organization.id]);

 const r=rows[0];
 return{id:r.id,employeeId:r.employee_id,employee:r.employee_name_snapshot,
  fromRole:r.from_role,toRole:r.to_role,type:typePL(r.change_type),
  lifecycleState:r.lifecycle_state,startedOn:datePL(r.started_on),effectiveOn:datePL(r.effective_on),
  owner:r.owner,standardId:r.standard_id,standardVersionId:r.standard_version_id,
  standardName:r.standard_name??undefined,standardVersion:r.version_label??undefined,
  latestDecision:r.latest_decision??undefined,
  latestDecisionAt:r.latest_decision_at?datePL(r.latest_decision_at):undefined,
  gates:{standard:!!r.standard_pass,process:!!r.process_pass,entry:!!r.entry_pass,
   deployment:!!r.deployment_pass,k:!!r.k_pass,readiness:!!r.readiness_pass,
   transition:!!r.transition_pass,readyAllowed:!!r.ready_allowed},
  tasks:tasks.map(t=>({id:t.id,position:t.position_snapshot,name:t.name_snapshot,
   isCritical:t.is_critical_snapshot,assessmentId:t.assessment_id??undefined,
   initialAssessment:t.initial_assessment??undefined,verificationResult:t.verification_result??undefined,
   effectiveAssessment:t.effective_assessment??undefined,
   stages:{explained:!!t.explained_at,shown:!!t.shown_at,together:!!t.together_at,
    solo:!!t.solo_at,checked:!!t.checked_at}})),
  readiness:readiness.map(x=>({id:x.id,criterion:x.criterion_snapshot,
   method:x.verification_method_snapshot,result:x.result,checkedAt:x.checked_at?datePL(x.checked_at):undefined})),
  transition:transition.map(x=>({id:x.id,position:x.position,item:x.item,
   disposition:x.disposition,confirmation:x.confirmation,
   confirmedAt:x.confirmed_at?datePL(x.confirmed_at):undefined})),
  decisions:decisions.map(x=>({id:x.id,decision:x.decision,sequence:x.decision_sequence,
   decidedAt:datePL(x.decided_at),note:x.note??undefined,
   gates:{standard:x.standard_pass,process:x.process_pass,entry:x.entry_pass,
    deployment:x.deployment_pass,k:x.k_pass,readiness:x.readiness_pass,transition:x.transition_pass}}))
 };
}
