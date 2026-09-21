import "server-only";
import { db, hasDatabase } from "@/lib/db";
import { onboardingStandards } from "@/data/onboardingStandards";

function tenantId(organizationId?: string) {
  if (!organizationId) throw new Error("organizationId is required for onboarding data.");
  return organizationId;
}

const datePL = (value: string | Date | null) => {
  if (!value) return "";
  const d = new Date(value);
  return new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d);
};

export type StandardVersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type StandardTaskRecord = {
  id: string;
  order: number;
  name: string;
  execution: string;
  readyWhen: string;
  hint: string;
  isCritical: boolean;
};
export type StartRequirementRecord = {
  id: string;
  order: number;
  category: "TOOLS" | "ACCESS" | "MATERIALS" | "INSTRUCTIONS" | "WORKPLACE" | "OTHER";
  requirement: string;
};
export type ReadinessCriterionRecord = {
  id: string;
  order: number;
  criterion: string;
  verificationMethod: "OBSERVATION" | "INDEPENDENT_TASK" | "WORK_SAMPLE" | "CONTROL_QUESTIONS" | "KNOWLEDGE_TEST" | "OTHER";
  verificationMethodOther?: string;
};
export type StandardDetailRecord = {
  id:string; name:string; area:string; status:"AKTYWNY"|"ROBOCZY"; currentVersion:string; updatedAt:string; versions:StandardVersionRecord[];
};

export type StandardVersionRecord = {
  id: string;
  version: string;
  versionNumber: number;
  status: StandardVersionStatus;
  date: string;
  note: string;
  publishedBy?: string;
  tasks: StandardTaskRecord[];
  startRequirements: StartRequirementRecord[];
  readinessCriteria: ReadinessCriterionRecord[];
};

function requirePersistedOnboarding() {
  if (!hasDatabase()) throw new Error("Database is required for persisted onboarding operations.");
}

export async function listStandards(organizationId?: string) {
  if (!hasDatabase()) return onboardingStandards;
  const sql = db(); const orgId = tenantId(organizationId);
  const rows = await sql`
    SELECT s.id,s.name,s.area,s.status,s.current_version_id,
      sv.version_label,sv.status version_status,sv.published_at,sv.created_at,
      (SELECT count(*)::int FROM standard_tasks st WHERE st.standard_version_id=sv.id AND st.organization_id=s.organization_id) task_count
    FROM standards s
    LEFT JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
    WHERE s.organization_id=${orgId}
    ORDER BY s.updated_at DESC,s.name`;
  return rows.map(r=>({
    id:r.id,name:r.name,area:r.area??"",status:r.status==="ACTIVE"?"AKTYWNY":"ROBOCZY",
    currentVersion:r.version_label??"",updatedAt:datePL(r.published_at??r.created_at??null),
    versionStatus:r.version_status??null,taskCount:r.task_count??0,versions:[]
  }));
}

export async function getStandard(standardId: string, organizationId?: string): Promise<StandardDetailRecord|null> {
  if (!hasDatabase()) {
    const fallback=onboardingStandards.find(s=>s.id===standardId); if(!fallback) return null;
    return {id:fallback.id,name:fallback.name,area:fallback.area,status:fallback.status,currentVersion:fallback.currentVersion,updatedAt:fallback.updatedAt,versions:fallback.versions.map((v,index)=>({
      id:`fallback-${fallback.id}-${index}`,version:v.version,versionNumber:Number(v.version.replace(/^v/,""))||index+1,status:"PUBLISHED" as const,date:v.date,note:v.note,
      tasks:v.tasks.map(t=>({...t,hint:"",isCritical:false})),startRequirements:[],readinessCriteria:[]
    }))};
  }
  const sql = db(); const orgId = tenantId(organizationId);
  const standards = await sql`SELECT id,name,area,status,current_version_id FROM standards WHERE id=${standardId} AND organization_id=${orgId} LIMIT 1`;
  if (!standards[0]) return null;
  const versions = await sql`SELECT sv.id,sv.version_number,sv.version_label,sv.status,sv.published_at,sv.created_at,sv.change_note,
      publisher.display_name published_by
    FROM standard_versions sv
    LEFT JOIN users publisher ON publisher.id=sv.published_by_user_id
    WHERE sv.standard_id=${standardId} AND sv.organization_id=${orgId} ORDER BY sv.version_number DESC`;
  const mapped: StandardVersionRecord[] = [];
  for (const v of versions) {
    const tasks = await sql`SELECT id,position,name,execution,ready_when,hint,is_critical FROM standard_tasks WHERE standard_version_id=${v.id} AND organization_id=${orgId} ORDER BY position`;
    const requirements = await sql`SELECT id,position,category,requirement FROM standard_start_requirements WHERE standard_version_id=${v.id} AND organization_id=${orgId} ORDER BY position`;
    const criteria = await sql`SELECT id,position,criterion,verification_method,verification_method_other FROM standard_readiness_criteria WHERE standard_version_id=${v.id} AND organization_id=${orgId} ORDER BY position`;
    mapped.push({
      id:v.id,version:v.version_label,versionNumber:v.version_number,status:v.status as StandardVersionStatus,
      date:datePL(v.published_at??v.created_at),note:v.change_note??"",publishedBy:v.published_by??undefined,
      tasks:tasks.map(t=>({id:t.id,order:t.position,name:t.name,execution:t.execution,readyWhen:t.ready_when,hint:t.hint??"",isCritical:t.is_critical})),
      startRequirements:requirements.map(r=>({id:r.id,order:r.position,category:r.category,requirement:r.requirement})),
      readinessCriteria:criteria.map(r=>({id:r.id,order:r.position,criterion:r.criterion,verificationMethod:r.verification_method,verificationMethodOther:r.verification_method_other??undefined}))
    });
  }
  const publishedCurrent=mapped.find(v=>v.id===standards[0].current_version_id);
  const draft=mapped.find(v=>v.status==="DRAFT");
  const working=draft??publishedCurrent;
  return {id:standards[0].id,name:standards[0].name,area:standards[0].area??"",status:draft?"ROBOCZY" as const:standards[0].status==="ACTIVE"?"AKTYWNY" as const:"ROBOCZY" as const,currentVersion:working?.version??"",updatedAt:working?.date??"",versions:mapped};
}

export async function archiveStandard(standardId:string, organizationId?:string) {
  organizationId=tenantId(organizationId);
  const sql=db(); await sql`UPDATE standards SET status='ARCHIVED',updated_at=now() WHERE id=${standardId} AND organization_id=${organizationId}`;
}


export async function createDraftStandard(input:{
  organizationId:string;
  productId:string;
  name:string;
  area?:string;
  createdByUserId:string;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  const name=input.name.trim();
  if(!name) throw new Error("Nazwa Standardu jest wymagana.");
  return sql.begin(async tx=>{
    const [standard]=await tx`INSERT INTO standards(organization_id,product_id,name,area,status,created_by_user_id)
      VALUES(${organizationId},${input.productId},${name},${input.area?.trim()||null},'DRAFT',${input.createdByUserId})
      RETURNING id`;
    const [version]=await tx`INSERT INTO standard_versions(organization_id,standard_id,version_number,version_label,status,change_note,created_by_user_id)
      VALUES(${organizationId},${standard.id},1,'v1','DRAFT','Wersja robocza',${input.createdByUserId})
      RETURNING id`;
    await tx`UPDATE standards SET current_version_id=${version.id},updated_at=now()
      WHERE id=${standard.id} AND organization_id=${organizationId}`;
    return standard.id as string;
  });
}

export async function updateDraftStandard(input:{
  organizationId:string;
  standardId:string;
  name:string;
  area?:string;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  const name=input.name.trim();
  if(!name) throw new Error("Nazwa Standardu jest wymagana.");
  const rows=await sql`
    UPDATE standards s SET name=${name},area=${input.area?.trim()||null},updated_at=now()
    FROM standard_versions sv
    WHERE s.id=${input.standardId} AND s.organization_id=${organizationId}
      AND sv.id=s.current_version_id AND sv.organization_id=s.organization_id AND sv.status='DRAFT'
    RETURNING s.id`;
  if(!rows[0]) throw new Error("Można edytować wyłącznie roboczy Standard.");
}


export async function createDraftTask(input:{
  organizationId:string; standardId:string; name:string; execution:string; readyWhen:string; hint?:string; isCritical?:boolean;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  const name=input.name.trim(), execution=input.execution.trim(), readyWhen=input.readyWhen.trim();
  if(!name || !execution) throw new Error("Czynność i prawidłowe wykonanie są wymagane.");
  return sql.begin(async tx=>{
    const [version]=await tx`SELECT sv.id FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId} AND sv.status='DRAFT' FOR UPDATE OF sv`;
    if(!version) throw new Error("Czynności można edytować wyłącznie w roboczej wersji Standardu.");
    const [countRow]=await tx`SELECT count(*)::int count FROM standard_tasks WHERE organization_id=${organizationId} AND standard_version_id=${version.id}`;
    if(countRow.count>=18) throw new Error("Standard może zawierać maksymalnie 18 czynności.");
    const [positionRow]=await tx`SELECT gs position FROM generate_series(1,18) gs
      WHERE NOT EXISTS (SELECT 1 FROM standard_tasks st WHERE st.organization_id=${organizationId}
        AND st.standard_version_id=${version.id} AND st.position=gs) ORDER BY gs LIMIT 1`;
    const [task]=await tx`INSERT INTO standard_tasks(organization_id,standard_version_id,position,name,execution,ready_when,hint,is_critical)
      VALUES(${organizationId},${version.id},${positionRow.position},${name},${execution},${readyWhen},${input.hint?.trim()||null},${Boolean(input.isCritical)}) RETURNING id`;
    return task.id as string;
  });
}

export async function updateDraftTask(input:{
  organizationId:string; standardId:string; taskId:string; name:string; execution:string; readyWhen:string; hint?:string; isCritical?:boolean;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  const name=input.name.trim(), execution=input.execution.trim(), readyWhen=input.readyWhen.trim();
  if(!name || !execution || !readyWhen) throw new Error("Czynność, prawidłowe wykonanie i kryterium gotowości są wymagane.");
  const rows=await sql`UPDATE standard_tasks st SET name=${name},execution=${execution},ready_when=${readyWhen},
      hint=${input.hint?.trim()||null},is_critical=${Boolean(input.isCritical)}
    FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
    WHERE s.id=${input.standardId} AND s.organization_id=${organizationId} AND sv.status='DRAFT'
      AND st.id=${input.taskId} AND st.organization_id=${organizationId} AND st.standard_version_id=sv.id RETURNING st.id`;
  if(!rows[0]) throw new Error("Nie znaleziono edytowalnej czynności w roboczej wersji Standardu.");
}

export async function deleteDraftTask(input:{organizationId:string;standardId:string;taskId:string}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const [task]=await tx`SELECT st.id,st.position,st.standard_version_id FROM standard_tasks st
      JOIN standard_versions sv ON sv.id=st.standard_version_id AND sv.organization_id=st.organization_id
      JOIN standards s ON s.id=sv.standard_id AND s.organization_id=sv.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId}
        AND sv.status='DRAFT' AND st.id=${input.taskId} FOR UPDATE OF st`;
    if(!task) throw new Error("Nie znaleziono edytowalnej czynności w roboczej wersji Standardu.");
    await tx`DELETE FROM standard_tasks WHERE id=${task.id} AND organization_id=${organizationId}`;
  });
}

export async function moveDraftTask(input:{organizationId:string;standardId:string;taskId:string;direction:"UP"|"DOWN"}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const [task]=await tx`SELECT st.id,st.position,st.standard_version_id FROM standard_tasks st
      JOIN standard_versions sv ON sv.id=st.standard_version_id AND sv.organization_id=st.organization_id
      JOIN standards s ON s.id=sv.standard_id AND s.organization_id=sv.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId}
        AND sv.status='DRAFT' AND st.id=${input.taskId} FOR UPDATE OF st`;
    if(!task) throw new Error("Nie znaleziono edytowalnej czynności w roboczej wersji Standardu.");
    const [other]=input.direction==="UP"
      ? await tx`SELECT id,position FROM standard_tasks WHERE organization_id=${organizationId}
          AND standard_version_id=${task.standard_version_id} AND position<${task.position} ORDER BY position DESC LIMIT 1 FOR UPDATE`
      : await tx`SELECT id,position FROM standard_tasks WHERE organization_id=${organizationId}
          AND standard_version_id=${task.standard_version_id} AND position>${task.position} ORDER BY position ASC LIMIT 1 FOR UPDATE`;
    if(!other) return;
    const target=other.position;
    // DRAFT versions cannot own onboarding processes. Delete/reinsert provides a collision-free swap while preserving the task UUID.
    const [moving]=await tx`DELETE FROM standard_tasks WHERE id=${task.id} AND organization_id=${organizationId}
      RETURNING id,organization_id,standard_version_id,name,execution,ready_when,hint,is_critical`;
    await tx`UPDATE standard_tasks SET position=${task.position} WHERE id=${other.id} AND organization_id=${organizationId}`;
    await tx`INSERT INTO standard_tasks(id,organization_id,standard_version_id,position,name,execution,ready_when,hint,is_critical)
      VALUES(${moving.id},${moving.organization_id},${moving.standard_version_id},${target},${moving.name},${moving.execution},${moving.ready_when},${moving.hint},${moving.is_critical})`;
  });
}


export async function createDraftStartRequirement(input:{
  organizationId:string; standardId:string; category:StartRequirementRecord["category"]; requirement:string;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId); const requirement=input.requirement.trim();
  if(!requirement) throw new Error("Warunek rozpoczęcia jest wymagany.");
  return sql.begin(async tx=>{
    const [version]=await tx`SELECT sv.id FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId} AND sv.status='DRAFT' FOR UPDATE OF sv`;
    if(!version) throw new Error("Warunki rozpoczęcia można edytować wyłącznie w roboczej wersji Standardu.");
    const [positionRow]=await tx`SELECT COALESCE(max(position),0)::int + 1 position FROM standard_start_requirements
      WHERE organization_id=${organizationId} AND standard_version_id=${version.id}`;
    const [row]=await tx`INSERT INTO standard_start_requirements(organization_id,standard_version_id,position,category,requirement)
      VALUES(${organizationId},${version.id},${positionRow.position},${input.category}::onboarding_start_requirement_category,${requirement}) RETURNING id`;
    return row.id as string;
  });
}

export async function updateDraftStartRequirement(input:{
  organizationId:string; standardId:string; requirementId:string; category:StartRequirementRecord["category"]; requirement:string;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId); const requirement=input.requirement.trim();
  if(!requirement) throw new Error("Warunek rozpoczęcia jest wymagany.");
  const rows=await sql`UPDATE standard_start_requirements sr
    SET category=${input.category}::onboarding_start_requirement_category,requirement=${requirement},updated_at=now()
    FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
    WHERE s.id=${input.standardId} AND s.organization_id=${organizationId} AND sv.status='DRAFT'
      AND sr.id=${input.requirementId} AND sr.organization_id=${organizationId} AND sr.standard_version_id=sv.id RETURNING sr.id`;
  if(!rows[0]) throw new Error("Nie znaleziono edytowalnego warunku rozpoczęcia.");
}

export async function deleteDraftStartRequirement(input:{organizationId:string;standardId:string;requirementId:string}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  const rows=await sql`DELETE FROM standard_start_requirements sr USING standards s,standard_versions sv
    WHERE s.id=${input.standardId} AND s.organization_id=${organizationId}
      AND sv.id=s.current_version_id AND sv.organization_id=s.organization_id AND sv.status='DRAFT'
      AND sr.id=${input.requirementId} AND sr.organization_id=${organizationId} AND sr.standard_version_id=sv.id RETURNING sr.id`;
  if(!rows[0]) throw new Error("Nie znaleziono edytowalnego warunku rozpoczęcia.");
}

export async function moveDraftStartRequirement(input:{
  organizationId:string;standardId:string;requirementId:string;direction:"UP"|"DOWN";
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const [row]=await tx`SELECT sr.id,sr.position,sr.standard_version_id FROM standard_start_requirements sr
      JOIN standard_versions sv ON sv.id=sr.standard_version_id AND sv.organization_id=sr.organization_id
      JOIN standards s ON s.id=sv.standard_id AND s.organization_id=sv.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId}
        AND sv.status='DRAFT' AND sr.id=${input.requirementId} FOR UPDATE OF sr`;
    if(!row) throw new Error("Nie znaleziono edytowalnego warunku rozpoczęcia.");
    const [other]=input.direction==="UP"
      ? await tx`SELECT id,position FROM standard_start_requirements WHERE organization_id=${organizationId}
          AND standard_version_id=${row.standard_version_id} AND position<${row.position} ORDER BY position DESC LIMIT 1 FOR UPDATE`
      : await tx`SELECT id,position FROM standard_start_requirements WHERE organization_id=${organizationId}
          AND standard_version_id=${row.standard_version_id} AND position>${row.position} ORDER BY position ASC LIMIT 1 FOR UPDATE`;
    if(!other) return;
    const [moving]=await tx`DELETE FROM standard_start_requirements WHERE id=${row.id} AND organization_id=${organizationId}
      RETURNING id,organization_id,standard_version_id,category,requirement,created_at,updated_at`;
    await tx`UPDATE standard_start_requirements SET position=${row.position},updated_at=now() WHERE id=${other.id} AND organization_id=${organizationId}`;
    await tx`INSERT INTO standard_start_requirements(id,organization_id,standard_version_id,position,category,requirement,created_at,updated_at)
      VALUES(${moving.id},${moving.organization_id},${moving.standard_version_id},${other.position},${moving.category},${moving.requirement},${moving.created_at},now())`;
  });
}


export async function createDraftReadinessCriterion(input:{
  organizationId:string; standardId:string; criterion:string; verificationMethod:ReadinessCriterionRecord["verificationMethod"]; verificationMethodOther?:string;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId); const criterion=input.criterion.trim();
  const other=input.verificationMethodOther?.trim()||null;
  if(!criterion) throw new Error("Kryterium gotowości jest wymagane.");
  if(input.verificationMethod==="OTHER"&&!other) throw new Error("Dla metody INNA podaj sposób weryfikacji.");
  return sql.begin(async tx=>{
    const [version]=await tx`SELECT sv.id FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId} AND sv.status='DRAFT' FOR UPDATE OF sv`;
    if(!version) throw new Error("Kryteria gotowości można edytować wyłącznie w roboczej wersji Standardu.");
    const [countRow]=await tx`SELECT count(*)::int count FROM standard_readiness_criteria WHERE organization_id=${organizationId} AND standard_version_id=${version.id}`;
    if(countRow.count>=3) throw new Error("Standard może zawierać maksymalnie 3 kryteria gotowości.");
    const [positionRow]=await tx`SELECT gs position FROM generate_series(1,3) gs WHERE NOT EXISTS
      (SELECT 1 FROM standard_readiness_criteria rc WHERE rc.organization_id=${organizationId} AND rc.standard_version_id=${version.id} AND rc.position=gs)
      ORDER BY gs LIMIT 1`;
    const [row]=await tx`INSERT INTO standard_readiness_criteria(organization_id,standard_version_id,position,criterion,verification_method,verification_method_other)
      VALUES(${organizationId},${version.id},${positionRow.position},${criterion},${input.verificationMethod}::onboarding_readiness_verification_method,
        ${input.verificationMethod==="OTHER"?other:null}) RETURNING id`;
    return row.id as string;
  });
}

export async function updateDraftReadinessCriterion(input:{
  organizationId:string; standardId:string; criterionId:string; criterion:string; verificationMethod:ReadinessCriterionRecord["verificationMethod"]; verificationMethodOther?:string;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId); const criterion=input.criterion.trim();
  const other=input.verificationMethodOther?.trim()||null;
  if(!criterion) throw new Error("Kryterium gotowości jest wymagane.");
  if(input.verificationMethod==="OTHER"&&!other) throw new Error("Dla metody INNA podaj sposób weryfikacji.");
  const rows=await sql`UPDATE standard_readiness_criteria rc
    SET criterion=${criterion},verification_method=${input.verificationMethod}::onboarding_readiness_verification_method,
      verification_method_other=${input.verificationMethod==="OTHER"?other:null},updated_at=now()
    FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
    WHERE s.id=${input.standardId} AND s.organization_id=${organizationId} AND sv.status='DRAFT'
      AND rc.id=${input.criterionId} AND rc.organization_id=${organizationId} AND rc.standard_version_id=sv.id RETURNING rc.id`;
  if(!rows[0]) throw new Error("Nie znaleziono edytowalnego kryterium gotowości.");
}

export async function deleteDraftReadinessCriterion(input:{organizationId:string;standardId:string;criterionId:string}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  const rows=await sql`DELETE FROM standard_readiness_criteria rc USING standards s,standard_versions sv
    WHERE s.id=${input.standardId} AND s.organization_id=${organizationId}
      AND sv.id=s.current_version_id AND sv.organization_id=s.organization_id AND sv.status='DRAFT'
      AND rc.id=${input.criterionId} AND rc.organization_id=${organizationId} AND rc.standard_version_id=sv.id RETURNING rc.id`;
  if(!rows[0]) throw new Error("Nie znaleziono edytowalnego kryterium gotowości.");
}

export async function moveDraftReadinessCriterion(input:{organizationId:string;standardId:string;criterionId:string;direction:"UP"|"DOWN"}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const [row]=await tx`SELECT rc.id,rc.position,rc.standard_version_id FROM standard_readiness_criteria rc
      JOIN standard_versions sv ON sv.id=rc.standard_version_id AND sv.organization_id=rc.organization_id
      JOIN standards s ON s.id=sv.standard_id AND s.organization_id=sv.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId}
        AND sv.status='DRAFT' AND rc.id=${input.criterionId} FOR UPDATE OF rc`;
    if(!row) throw new Error("Nie znaleziono edytowalnego kryterium gotowości.");
    const [other]=input.direction==="UP"
      ? await tx`SELECT id,position FROM standard_readiness_criteria WHERE organization_id=${organizationId}
          AND standard_version_id=${row.standard_version_id} AND position<${row.position} ORDER BY position DESC LIMIT 1 FOR UPDATE`
      : await tx`SELECT id,position FROM standard_readiness_criteria WHERE organization_id=${organizationId}
          AND standard_version_id=${row.standard_version_id} AND position>${row.position} ORDER BY position ASC LIMIT 1 FOR UPDATE`;
    if(!other) return;
    const [moving]=await tx`DELETE FROM standard_readiness_criteria WHERE id=${row.id} AND organization_id=${organizationId}
      RETURNING id,organization_id,standard_version_id,criterion,verification_method,verification_method_other,created_at`;
    await tx`UPDATE standard_readiness_criteria SET position=${row.position},updated_at=now() WHERE id=${other.id} AND organization_id=${organizationId}`;
    await tx`INSERT INTO standard_readiness_criteria(id,organization_id,standard_version_id,position,criterion,verification_method,verification_method_other,created_at,updated_at)
      VALUES(${moving.id},${moving.organization_id},${moving.standard_version_id},${other.position},${moving.criterion},${moving.verification_method},
        ${moving.verification_method_other},${moving.created_at},now())`;
  });
}


export type StandardCompletenessResult = { complete:boolean; reasons:string[] };

export function validateStandardCompleteness(input:{
  name:string; tasks:StandardTaskRecord[]; startRequirements:StartRequirementRecord[]; readinessCriteria:ReadinessCriterionRecord[];
}): StandardCompletenessResult {
  const reasons:string[]=[];
  if(!input.name.trim()) reasons.push("Uzupełnij nazwę Standardu.");
  if(input.tasks.length<1) reasons.push("Dodaj co najmniej 1 czynność.");
  if(input.tasks.length>18) reasons.push("Standard może zawierać maksymalnie 18 czynności.");
  const taskPositions=input.tasks.map(x=>x.order);
  if(new Set(taskPositions).size!==taskPositions.length||taskPositions.some(position=>position<1||position>18))
    reasons.push("Czynności muszą mieć unikalną kolejność w zakresie 1–18.");
  input.tasks.forEach((task,index)=>{
    if(!task.name.trim()||!task.execution.trim())
      reasons.push(`Czynność ${index+1}: uzupełnij nazwę i prawidłowe wykonanie.`);
  });
  const requirementPositions=input.startRequirements.map(x=>x.order);
  if(new Set(requirementPositions).size!==requirementPositions.length||requirementPositions.some(position=>position<1))
    reasons.push("Warunki rozpoczęcia muszą mieć unikalną dodatnią kolejność.");
  input.startRequirements.forEach((requirement,index)=>{
    if(!requirement.requirement.trim()) reasons.push(`Warunek rozpoczęcia ${index+1}: uzupełnij treść.`);
  });
  if(input.readinessCriteria.length<1) reasons.push("Dodaj co najmniej 1 kryterium gotowości.");
  if(input.readinessCriteria.length>3) reasons.push("Standard może zawierać maksymalnie 3 kryteria gotowości.");
  const criterionPositions=input.readinessCriteria.map(x=>x.order);
  if(new Set(criterionPositions).size!==criterionPositions.length||criterionPositions.some(position=>position<1||position>3))
    reasons.push("Kryteria gotowości muszą mieć unikalną kolejność w zakresie 1–3.");
  input.readinessCriteria.forEach((criterion,index)=>{
    if(!criterion.criterion.trim()) reasons.push(`Kryterium gotowości ${index+1}: uzupełnij treść.`);
    if(criterion.verificationMethod==="OTHER"&&!criterion.verificationMethodOther?.trim())
      reasons.push(`Kryterium gotowości ${index+1}: opisz własną metodę weryfikacji.`);
  });
  return {complete:reasons.length===0,reasons};
}

export async function getDraftStandardCompleteness(input:{organizationId:string;standardId:string}) {
  requirePersistedOnboarding();
  const standard=await getStandard(input.standardId,tenantId(input.organizationId));
  if(!standard) throw new Error("Nie znaleziono Standardu.");
  const current=standard.versions.find(v=>v.version===standard.currentVersion)??standard.versions[0];
  if(!current||current.status!=="DRAFT") throw new Error("Walidacja przed publikacją dotyczy wyłącznie roboczej wersji Standardu.");
  return validateStandardCompleteness({name:standard.name,tasks:current.tasks,startRequirements:current.startRequirements,readinessCriteria:current.readinessCriteria});
}


export async function createDraftStandardVersion(input:{
  organizationId:string; standardId:string; createdByUserId:string; changeNote:string;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId); const changeNote=input.changeNote.trim();
  if(!changeNote) throw new Error("Opis zmiany jest wymagany.");
  return sql.begin(async tx=>{
    const [standard]=await tx`SELECT s.id,s.status standard_status,s.current_version_id,sv.id source_version_id,sv.version_number,sv.status version_status
      FROM standards s JOIN standard_versions sv ON sv.id=s.current_version_id AND sv.organization_id=s.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId} FOR UPDATE OF s,sv`;
    if(!standard) throw new Error("Nie znaleziono Standardu.");
    if(standard.standard_status!=="ACTIVE" || standard.version_status!=="PUBLISHED")
      throw new Error("Nową wersję można utworzyć wyłącznie z bieżącej opublikowanej wersji Standardu.");

    const membership=await tx`SELECT 1 FROM memberships WHERE organization_id=${organizationId}
      AND user_id=${input.createdByUserId} AND status='ACTIVE' LIMIT 1`;
    if(!membership[0]) throw new Error("Użytkownik nie ma aktywnego członkostwa w organizacji.");

    const existingDraft=await tx`SELECT id FROM standard_versions WHERE organization_id=${organizationId}
      AND standard_id=${standard.id} AND status='DRAFT' LIMIT 1 FOR UPDATE`;
    if(existingDraft[0]) throw new Error("Ten Standard ma już wersję roboczą.");

    const [numberRow]=await tx`SELECT COALESCE(max(version_number),0)::int + 1 next_number
      FROM standard_versions WHERE organization_id=${organizationId} AND standard_id=${standard.id}`;
    const versionNumber=numberRow.next_number as number;
    const [draft]=await tx`INSERT INTO standard_versions(
        organization_id,standard_id,version_number,version_label,status,change_note,created_by_user_id
      ) VALUES(
        ${organizationId},${standard.id},${versionNumber},${"v"+versionNumber},'DRAFT',${changeNote},${input.createdByUserId}
      ) RETURNING id,version_label`;

    await tx`INSERT INTO standard_tasks(organization_id,standard_version_id,position,name,execution,ready_when,hint,is_critical)
      SELECT organization_id,${draft.id},position,name,execution,ready_when,hint,is_critical
      FROM standard_tasks WHERE organization_id=${organizationId} AND standard_version_id=${standard.source_version_id} ORDER BY position`;
    await tx`INSERT INTO standard_start_requirements(organization_id,standard_version_id,position,category,requirement)
      SELECT organization_id,${draft.id},position,category,requirement
      FROM standard_start_requirements WHERE organization_id=${organizationId} AND standard_version_id=${standard.source_version_id} ORDER BY position`;
    await tx`INSERT INTO standard_readiness_criteria(organization_id,standard_version_id,position,criterion,verification_method,verification_method_other)
      SELECT organization_id,${draft.id},position,criterion,verification_method,verification_method_other
      FROM standard_readiness_criteria WHERE organization_id=${organizationId} AND standard_version_id=${standard.source_version_id} ORDER BY position`;

    return {id:draft.id as string,version:draft.version_label as string};
  });
}


export async function publishDraftStandard(input:{organizationId:string;standardId:string;publishedByUserId:string;qualityCheckPassed:boolean}) {
  requirePersistedOnboarding();
  if(!input.qualityCheckPassed) throw new Error("Przed publikacją Kryterium Gotowości musi przejść test 4×TAK.");
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const [standard]=await tx`SELECT s.id,s.name,s.current_version_id,sv.id version_id,sv.status
      FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
      WHERE s.id=${input.standardId} AND s.organization_id=${organizationId} AND sv.status='DRAFT'
      ORDER BY sv.version_number DESC LIMIT 1 FOR UPDATE OF s,sv`;
    if(!standard) throw new Error("Nie znaleziono roboczej wersji Standardu.");

    const membership=await tx`SELECT 1 FROM memberships WHERE organization_id=${organizationId}
      AND user_id=${input.publishedByUserId} AND status='ACTIVE' LIMIT 1`;
    if(!membership[0]) throw new Error("Publikujący użytkownik nie ma aktywnego członkostwa w organizacji.");

    const tasks=await tx`SELECT id,position,name,execution,ready_when,hint,is_critical FROM standard_tasks
      WHERE organization_id=${organizationId} AND standard_version_id=${standard.version_id} ORDER BY position`;
    const requirements=await tx`SELECT id,position,category,requirement FROM standard_start_requirements
      WHERE organization_id=${organizationId} AND standard_version_id=${standard.version_id} ORDER BY position`;
    const criteria=await tx`SELECT id,position,criterion,verification_method,verification_method_other FROM standard_readiness_criteria
      WHERE organization_id=${organizationId} AND standard_version_id=${standard.version_id} ORDER BY position`;
    const completeness=validateStandardCompleteness({
      name:standard.name,
      tasks:tasks.map(t=>({id:t.id,order:t.position,name:t.name,execution:t.execution,readyWhen:t.ready_when,hint:t.hint??"",isCritical:t.is_critical})),
      startRequirements:requirements.map(x=>({id:x.id,order:x.position,category:x.category,requirement:x.requirement})),
      readinessCriteria:criteria.map(x=>({id:x.id,order:x.position,criterion:x.criterion,verificationMethod:x.verification_method,verificationMethodOther:x.verification_method_other??undefined}))
    });
    if(!completeness.complete) throw new Error(`Standard nie jest gotowy do publikacji: ${completeness.reasons.join(" ")}`);

    await tx`UPDATE standard_versions SET status='PUBLISHED',published_at=now(),published_by_user_id=${input.publishedByUserId},updated_at=now()
      WHERE id=${standard.version_id} AND standard_id=${standard.id} AND organization_id=${organizationId} AND status='DRAFT'`;
    await tx`UPDATE standards SET current_version_id=${standard.version_id},status='ACTIVE',updated_at=now()
      WHERE id=${standard.id} AND organization_id=${organizationId}`;
    return standard.version_id as string;
  });
}


export async function createStandard(input:{organizationId?:string;productId:string;name:string;area?:string;createdByUserId:string;versionLabel:string;changeNote?:string;tasks:{name:string;execution:string;readyWhen:string}[]}) {
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const [standard]=await tx`INSERT INTO standards(organization_id,product_id,name,area,status,created_by_user_id) VALUES(${organizationId},${input.productId},${input.name},${input.area??null},'ACTIVE',${input.createdByUserId}) RETURNING id`;
    const [version]=await tx`INSERT INTO standard_versions(organization_id,standard_id,version_number,version_label,status,change_note,published_at,created_by_user_id) VALUES(${organizationId},${standard.id},1,${input.versionLabel},'PUBLISHED',${input.changeNote??null},now(),${input.createdByUserId}) RETURNING id`;
    for(let i=0;i<input.tasks.length;i++){const t=input.tasks[i];await tx`INSERT INTO standard_tasks(organization_id,standard_version_id,position,name,execution,ready_when) VALUES(${organizationId},${version.id},${i+1},${t.name},${t.execution},${t.readyWhen})`;}
    await tx`UPDATE standards SET current_version_id=${version.id},updated_at=now() WHERE id=${standard.id} AND organization_id=${organizationId}`;
    return standard.id as string;
  });
}

