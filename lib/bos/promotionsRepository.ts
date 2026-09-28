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
  SELECT c.*,pd.decision_sequence,pd.decided_at,pd.note decision_note,\n    pd.standard_pass,pd.process_pass,pd.entry_pass,pd.deployment_pass,pd.k_pass,pd.readiness_pass,pd.transition_pass,
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
  decisionSequence:r.decision_sequence,decisionNote:r.decision_note??undefined,decidedAt:datePL(r.decided_at),\n  gateSnapshot:{standard:!!r.standard_pass,process:!!r.process_pass,entry:!!r.entry_pass,deployment:!!r.deployment_pass,k:!!r.k_pass,readiness:!!r.readiness_pass,transition:!!r.transition_pass}};
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
    pa.id assessment_id,pa.initial_assessment,pa.evidence_note,pa.assessed_at,pa.verification_result,
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
   initialAssessment:t.initial_assessment??undefined,evidenceNote:t.evidence_note??undefined,assessedAt:t.assessed_at?datePL(t.assessed_at):undefined,verificationResult:t.verification_result??undefined,
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


export async function listPromotionStartOptions(access:BOSAccess){
 const org=access.organization.id;
 const [standards,members,employees,products]=await Promise.all([
  db().unsafe("SELECT DISTINCT ON (s.id) s.id standard_id,s.name,s.area,sv.id version_id,sv.version_label FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id WHERE s.organization_id=$1 AND s.status='ACTIVE' AND sv.status='PUBLISHED' ORDER BY s.id,sv.version_number DESC",[org]),
  db().unsafe("SELECT u.id,u.display_name,u.email,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1 AND m.status='ACTIVE' AND u.status='ACTIVE' ORDER BY u.display_name",[org]),
  db().unsafe("SELECT id,first_name,last_name,employee_number,position,department FROM employees WHERE organization_id=$1 AND status='ACTIVE' ORDER BY last_name,first_name,created_at",[org]),
  db().unsafe("SELECT p.id,p.key,p.name FROM licenses l JOIN products p ON p.id=l.product_id WHERE l.organization_id=$1 AND l.status='ACTIVE' AND p.status='ACTIVE' ORDER BY p.name",[org])
 ]);
 return{
  standards:standards.map(x=>({standardId:x.standard_id,name:x.name,area:x.area??"",versionId:x.version_id,version:x.version_label})),
  members:members.map(x=>({id:x.id,name:x.display_name,email:x.email,role:x.role})),
  employees:employees.map(x=>({id:x.id,name:[x.first_name,x.last_name].filter(Boolean).join(" "),employeeNumber:x.employee_number??"",position:x.position??"",department:x.department??""})),
  products:products.map(x=>({id:x.id,key:x.key,name:x.name}))
 };
}

export async function createPromotionProcess(access:BOSAccess,input:{
 productId:string;employeeId:string;standardId:string;standardVersionId:string;
 fromRole:string;toRole:string;changeType:"PROMOTION"|"LATERAL_MOVE";
 ownerUserId:string;startedOn:string;effectiveOn?:string;createdByUserId:string;
}){
 const org=access.organization.id;
 if(!input.employeeId||!input.standardId||!input.standardVersionId) throw new Error("Pracownik i docelowy Standard są wymagane.");
 if(!input.fromRole.trim()||!input.toRole.trim()) throw new Error("Rola A i rola B są wymagane.");
 if(input.fromRole.trim()===input.toRole.trim()) throw new Error("Rola A i rola B muszą być różne.");
 if(!input.startedOn) throw new Error("Data rozpoczęcia jest wymagana.");
 return db().begin(async tx=>{
  const [version]=await tx`SELECT sv.id FROM standard_versions sv JOIN standards s ON s.id=sv.standard_id AND s.organization_id=sv.organization_id WHERE sv.id=${input.standardVersionId} AND sv.standard_id=${input.standardId} AND sv.organization_id=${org} AND sv.status='PUBLISHED' AND s.status='ACTIVE' FOR SHARE OF sv,s`;
  if(!version) throw new Error("Proces można rozpocząć wyłącznie na opublikowanej wersji aktywnego Standardu.");
  const [employee]=await tx`SELECT id,first_name,last_name FROM employees WHERE id=${input.employeeId} AND organization_id=${org} AND status='ACTIVE' FOR SHARE`;
  if(!employee) throw new Error("Wybrany pracownik nie istnieje lub nie jest aktywny w tej organizacji.");
  const [licensed]=await tx`SELECT p.id FROM products p JOIN licenses l ON l.product_id=p.id WHERE p.id=${input.productId} AND p.status='ACTIVE' AND l.organization_id=${org} AND l.status='ACTIVE' LIMIT 1`;
  if(!licensed) throw new Error("Organizacja nie ma aktywnej licencji Promotions.");
  const actors=[input.ownerUserId,input.createdByUserId];
  const active=await tx`SELECT user_id FROM memberships WHERE organization_id=${org} AND status='ACTIVE' AND user_id = ANY(${[...new Set(actors)]})`;
  if(active.length!==new Set(actors).size) throw new Error("Owner i twórca procesu muszą być aktywnymi członkami organizacji.");
  const employeeName=[employee.first_name,employee.last_name].filter(Boolean).join(" ").trim();
  const [p]=await tx`INSERT INTO promotion_processes(organization_id,product_id,employee_id,employee_name_snapshot,from_role,to_role,change_type,owner_user_id,status,effective_on,started_on,created_by_user_id,standard_id,standard_version_id) VALUES(${org},${input.productId},${employee.id},${employeeName},${input.fromRole.trim()},${input.toRole.trim()},${input.changeType},${input.ownerUserId},'PLANNED',${input.effectiveOn||null},${input.startedOn},${input.createdByUserId},${input.standardId},${input.standardVersionId}) RETURNING id`;
  await tx`SELECT bos_seed_promotion_process_tasks(${p.id})`;
  await tx`SELECT bos_seed_promotion_readiness_checks(${p.id})`;
  return p.id as string;
 });
}


export async function savePromotionAssessment(access:BOSAccess,input:{
 processId:string;processTaskId:string;assessment:"CONFIRMED"|"TO_VERIFY"|"TO_DEPLOY";evidenceNote?:string;
}){
 const org=access.organization.id,user=access.user.id;
 return db().begin(async tx=>{
  const [task]=await tx`SELECT ppt.id,ppt.is_critical_snapshot,pa.id assessment_id,pa.verification_result
    FROM promotion_process_tasks ppt
    LEFT JOIN promotion_assessments pa ON pa.promotion_process_task_id=ppt.id AND pa.organization_id=ppt.organization_id
    WHERE ppt.id=${input.processTaskId} AND ppt.promotion_process_id=${input.processId} AND ppt.organization_id=${org}
    FOR UPDATE OF ppt`;
  if(!task) throw new Error("Nie znaleziono czynności w tym procesie.");
  const [member]=await tx`SELECT 1 ok FROM memberships WHERE organization_id=${org} AND user_id=${user} AND status='ACTIVE' LIMIT 1`;
  if(!member) throw new Error("Osoba oceniająca nie jest aktywnym członkiem organizacji.");
  if(task.assessment_id && task.verification_result) throw new Error("Nie można zmienić oceny wejściowej po zapisaniu wyniku SPRAWDŹ.");
  const note=input.evidenceNote?.trim()||null;
  if(task.assessment_id){
    await tx`UPDATE promotion_assessments SET initial_assessment=${input.assessment},evidence_note=${note},assessed_by_user_id=${user},assessed_at=now(),updated_at=now()
      WHERE id=${task.assessment_id} AND organization_id=${org}`;
    return task.assessment_id as string;
  }
  const [row]=await tx`INSERT INTO promotion_assessments(organization_id,promotion_process_id,promotion_process_task_id,initial_assessment,evidence_note,assessed_by_user_id)
    VALUES(${org},${input.processId},${input.processTaskId},${input.assessment},${note},${user}) RETURNING id`;
  return row.id as string;
 });
}


export async function verifyPromotionAssessment(access:BOSAccess,input:{processId:string;assessmentId:string;result:"PASS"|"FAIL";note?:string}){
 const org=access.organization.id,user=access.user.id;
 const rows=await db().unsafe("UPDATE promotion_assessments SET verification_result=$1,verification_by_user_id=$2,verification_at=now(),verification_note=$3,updated_at=now() WHERE id=$4 AND promotion_process_id=$5 AND organization_id=$6 AND initial_assessment='TO_VERIFY' AND verification_result IS NULL RETURNING id",[input.result,user,input.note?.trim()||null,input.assessmentId,input.processId,org]);
 if(!rows[0]) throw new Error("Nie znaleziono nierozstrzygniętej czynności DO SPRAWDZENIA.");
 return rows[0].id as string;
}

export async function advancePromotionDeployment(access:BOSAccess,input:{processId:string;assessmentId:string;stage:"EXPLAINED"|"SHOWN"|"TOGETHER"|"SOLO"|"CHECKED";note?:string}){
 const org=access.organization.id,user=access.user.id;
 return db().begin(async tx=>{
  const [a]=await tx`SELECT pa.id,pa.initial_assessment,pa.verification_result,ppt.is_critical_snapshot
   FROM promotion_assessments pa JOIN promotion_process_tasks ppt ON ppt.id=pa.promotion_process_task_id AND ppt.organization_id=pa.organization_id
   WHERE pa.id=${input.assessmentId} AND pa.promotion_process_id=${input.processId} AND pa.organization_id=${org} FOR UPDATE OF pa`;
  if(!a) throw new Error("Nie znaleziono oceny w tym procesie.");
  const [effective]=await tx`SELECT bos_promotion_effective_assessment_for_task(${a.initial_assessment}::promotion_entry_assessment,${a.verification_result}::promotion_verification_result,${a.is_critical_snapshot}) value`;
  if(effective.value!=="TO_DEPLOY") throw new Error("Ta czynność nie wymaga ścieżki DO WDROŻENIA.");
  await tx`INSERT INTO promotion_deployment_progress(organization_id,promotion_process_id,promotion_assessment_id)
    VALUES(${org},${input.processId},${input.assessmentId}) ON CONFLICT(promotion_assessment_id) DO NOTHING`;
  const column={EXPLAINED:"explained",SHOWN:"shown",TOGETHER:"together",SOLO:"solo",CHECKED:"checked"}[input.stage];
  await tx.unsafe(`UPDATE promotion_deployment_progress SET ${column}_at=COALESCE(${column}_at,now()), ${column}_by_user_id=COALESCE(${column}_by_user_id,$1), note=COALESCE($2,note), updated_at=now() WHERE promotion_assessment_id=$3 AND promotion_process_id=$4 AND organization_id=$5`,[user,input.note?.trim()||null,input.assessmentId,input.processId,org]);
 });
}


export async function savePromotionReadiness(access:BOSAccess,input:{processId:string;checkId:string;result:"PASS"|"FAIL";note?:string}){
 const org=access.organization.id,user=access.user.id;
 const rows=await db().unsafe("UPDATE promotion_readiness_checks SET result=$1,checked_by_user_id=$2,checked_at=now(),note=$3,updated_at=now() WHERE id=$4 AND promotion_process_id=$5 AND organization_id=$6 RETURNING id",[input.result,user,input.note?.trim()||null,input.checkId,input.processId,org]);
 if(!rows[0]) throw new Error("Nie znaleziono kryterium gotowości w tym procesie.");
 return rows[0].id as string;
}

export async function addPromotionTransitionItem(access:BOSAccess,input:{processId:string;item:string;disposition:"TRANSFER"|"RETAIN"|"CHANGE"|"NOT_APPLICABLE"}){
 const org=access.organization.id,user=access.user.id;
 if(!input.item.trim()) throw new Error("Element przekazania jest wymagany.");
 const rows=await db().unsafe(`INSERT INTO promotion_transition_items(organization_id,promotion_process_id,position,item,disposition,confirmation,created_by_user_id)
  SELECT $1,$2,coalesce(max(position),0)+1,$3,$4,'PENDING',$5 FROM promotion_transition_items
  WHERE organization_id=$1 AND promotion_process_id=$2 RETURNING id`,[org,input.processId,input.item.trim(),input.disposition,user]);
 if(!rows[0]) throw new Error("Nie udało się dodać elementu przekazania.");
 return rows[0].id as string;
}

export async function confirmPromotionTransitionItem(access:BOSAccess,input:{processId:string;itemId:string;confirmation:"DONE"|"NOT_DONE";note?:string}){
 const org=access.organization.id,user=access.user.id;
 const rows=await db().unsafe("UPDATE promotion_transition_items SET confirmation=$1,confirmed_by_user_id=$2,confirmed_at=now(),evidence_note=$3,updated_at=now() WHERE id=$4 AND promotion_process_id=$5 AND organization_id=$6 RETURNING id",[input.confirmation,user,input.note?.trim()||null,input.itemId,input.processId,org]);
 if(!rows[0]) throw new Error("Nie znaleziono elementu przekazania w tym procesie.");
 return rows[0].id as string;
}

export async function recordPromotionDecision(access:BOSAccess,input:{processId:string;decision:"READY"|"NOT_YET"|"STOP";note?:string}){
 const org=access.organization.id,user=access.user.id;
 const [p]=await db().unsafe("SELECT id FROM promotion_processes WHERE id=$1 AND organization_id=$2",[input.processId,org]);
 if(!p) throw new Error("Nie znaleziono procesu.");
 const rows=await db().unsafe("SELECT bos_record_promotion_decision($1,$2::promotion_decision,$3,$4) id",[input.processId,input.decision,user,input.note?.trim()||null]);
 return rows[0].id as string;
}

export async function closePromotionProcess(access:BOSAccess,input:{processId:string;decisionId:string;note?:string}){
 const org=access.organization.id,user=access.user.id;
 const [d]=await db().unsafe("SELECT id,decision FROM promotion_decisions WHERE id=$1 AND promotion_process_id=$2 AND organization_id=$3",[input.decisionId,input.processId,org]);
 if(!d) throw new Error("Nie znaleziono decyzji w tym procesie.");
 if(d.decision==="NOT_YET") throw new Error("JESZCZE NIE nie zamyka procesu.");
 const rows=await db().unsafe("SELECT bos_close_promotion_process($1,$2,$3) id",[input.decisionId,user,input.note?.trim()||null]);
 return rows[0].id as string;
}
