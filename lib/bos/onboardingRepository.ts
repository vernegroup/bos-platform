import "server-only";
import { db, hasDatabase } from "@/lib/db";
import { onboardingStandards } from "@/data/onboardingStandards";
import { onboardingProcesses, getProcessProgress as demoProgress } from "@/data/onboardingProcesses";
import { onboardingClosures } from "@/data/onboardingClosures";

export const DEMO_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000001";
function tenantId(organizationId?:string){
  if (organizationId) return organizationId;
  if (hasDatabase()) throw new Error("organizationId is required for persisted onboarding data.");
  return DEMO_ORGANIZATION_ID;
}

const datePL = (value: string | Date | null) => {
  if (!value) return "";
  const d = new Date(value);
  return new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d);
};

export async function listStandards(organizationId?:string) {
  if (!hasDatabase()) return onboardingStandards;
  const sql=db(); const orgId=tenantId(organizationId);
  const rows=await sql`
    SELECT s.id,s.name,s.area,s.status,sv.version_label,sv.published_at,sv.change_note,
      (SELECT count(*)::int FROM standard_tasks st WHERE st.standard_version_id=sv.id) task_count
    FROM standards s JOIN standard_versions sv ON sv.id=s.current_version_id
    WHERE s.organization_id=${orgId} ORDER BY s.name`;
  return rows.map(r=>({id:r.id,name:r.name,area:r.area??"",status:r.status==="ACTIVE"?"AKTYWNY":"ROBOCZY",currentVersion:r.version_label,updatedAt:datePL(r.published_at),versions:[{version:r.version_label,date:datePL(r.published_at),note:r.change_note??"",tasks:Array.from({length:r.task_count},(_,i)=>({id:`count-${i}`,order:i+1,name:"",execution:"",readyWhen:""}))}]}));
}

export async function getStandard(standardId:string, organizationId?:string) {
  if (!hasDatabase()) return onboardingStandards.find(s=>s.id===standardId) ?? null;
  const sql=db(); const orgId=tenantId(organizationId);
  const standards=await sql`SELECT id,name,area,status,current_version_id FROM standards WHERE id=${standardId} AND organization_id=${orgId} LIMIT 1`;
  if(!standards[0]) return null;
  const versions=await sql`SELECT id,version_label,published_at,change_note FROM standard_versions WHERE standard_id=${standardId} AND organization_id=${orgId} ORDER BY version_number DESC`;
  const mapped=[];
  for(const v of versions){
    const tasks=await sql`SELECT id,position,name,execution,ready_when FROM standard_tasks WHERE standard_version_id=${v.id} AND organization_id=${orgId} ORDER BY position`;
    mapped.push({version:v.version_label,date:datePL(v.published_at),note:v.change_note??"",tasks:tasks.map(t=>({id:t.id,order:t.position,name:t.name,execution:t.execution,readyWhen:t.ready_when}))});
  }
  const current=versions.find(v=>v.id===standards[0].current_version_id);
  return {id:standards[0].id,name:standards[0].name,area:standards[0].area??"",status:standards[0].status==="ACTIVE"?"AKTYWNY" as const:"ROBOCZY" as const,currentVersion:current?.version_label??"",updatedAt:datePL(current?.published_at??null),versions:mapped};
}

export async function listProcesses(organizationId?:string) {
  if (!hasDatabase()) return onboardingProcesses;
  const sql=db(); const orgId=tenantId(organizationId);
  const rows=await sql`
    SELECT p.id,p.employee_name_snapshot,p.standard_id,sv.version_label,p.started_on,p.target_on,
      u.display_name owner,p.status,
      json_agg(json_build_object('standardTaskId',tp.standard_task_id,'status',tp.status,'completedAt',tp.completed_at,'note',tp.note)) tasks
    FROM onboarding_processes p
    JOIN standard_versions sv ON sv.id=p.standard_version_id
    JOIN users u ON u.id=p.owner_user_id
    LEFT JOIN onboarding_task_progress tp ON tp.onboarding_process_id=p.id
    WHERE p.organization_id=${orgId} AND p.status IN ('PLANNED','IN_PROGRESS','READY_TO_CLOSE')
    GROUP BY p.id,sv.version_label,u.display_name ORDER BY p.started_on DESC`;
  return rows.map(r=>({id:r.id,employee:r.employee_name_snapshot,standardId:r.standard_id,standardVersion:r.version_label,startedAt:datePL(r.started_on),targetDate:datePL(r.target_on),owner:r.owner,status:"W TOKU" as const,tasks:(r.tasks??[]).filter((x:any)=>x.standardTaskId).map((x:any)=>({standardTaskId:x.standardTaskId,status:x.status==="DONE"?"GOTOWE":x.status==="IN_PROGRESS"?"W TOKU":"DO WYKONANIA",completedAt:x.completedAt?datePL(x.completedAt):undefined,note:x.note??undefined}))}));
}

export async function getProcess(processId:string, organizationId?:string) {
  const all=await listProcesses(organizationId); return all.find(p=>p.id===processId) ?? null;
}

export function getProcessProgress(process: Awaited<ReturnType<typeof listProcesses>>[number]) {
  if (!hasDatabase()) return demoProgress(process as any);
  const completed=process.tasks.filter((t: { status: string })=>t.status==="GOTOWE").length;
  return {completed,total:process.tasks.length,percent:process.tasks.length?Math.round(completed/process.tasks.length*100):0};
}

export async function listClosures(organizationId?:string) {
  if (!hasDatabase()) return onboardingClosures;
  const sql=db(); const orgId=tenantId(organizationId);
  const rows=await sql`
    SELECT c.id,c.onboarding_process_id,c.employee_name_snapshot,c.standard_id,sv.version_label,
      p.started_on,c.verified_at,owner.display_name owner,verifier.display_name verified_by,
      c.result,c.summary,c.recommendations,
      (SELECT count(*)::int FROM onboarding_task_progress tp WHERE tp.onboarding_process_id=p.id AND tp.status='DONE') completed_tasks,
      (SELECT count(*)::int FROM onboarding_task_progress tp WHERE tp.onboarding_process_id=p.id) total_tasks
    FROM onboarding_closures c JOIN onboarding_processes p ON p.id=c.onboarding_process_id
    JOIN standard_versions sv ON sv.id=c.standard_version_id JOIN users owner ON owner.id=p.owner_user_id
    JOIN users verifier ON verifier.id=c.verified_by_user_id WHERE c.organization_id=${orgId}
    ORDER BY c.verified_at DESC`;
  return rows.map(r=>({id:r.id,processId:r.onboarding_process_id,employee:r.employee_name_snapshot,standardId:r.standard_id,standardVersion:r.version_label,startedAt:datePL(r.started_on),closedAt:datePL(r.verified_at),owner:r.owner,verifiedBy:r.verified_by,result:r.result==="COMPLETED"?"WDROŻENIE ZAKOŃCZONE" as const:"ZAKOŃCZONE Z ZALECENIAMI" as const,completedTasks:r.completed_tasks,totalTasks:r.total_tasks,summary:r.summary,recommendations:r.recommendations??undefined}));
}

export async function getClosure(closureId:string, organizationId?:string) {
  const all=await listClosures(organizationId); return all.find(c=>c.id===closureId) ?? null;
}

export async function updateTaskProgress(input:{organizationId?:string;processId:string;standardTaskId:string;status:"TODO"|"IN_PROGRESS"|"DONE";note?:string;completedByUserId?:string}) {
  const sql=db(); const organizationId=tenantId(input.organizationId);
  await sql`UPDATE onboarding_task_progress SET status=${input.status}::onboarding_task_status,note=${input.note??null},completed_at=${input.status==="DONE"?new Date():null},completed_by_user_id=${input.completedByUserId??null},updated_at=now() WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND standard_task_id=${input.standardTaskId}`;
}

export async function archiveStandard(standardId:string, organizationId?:string) {
  organizationId=tenantId(organizationId);
  const sql=db(); await sql`UPDATE standards SET status='ARCHIVED',updated_at=now() WHERE id=${standardId} AND organization_id=${organizationId}`;
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

export async function createProcess(input:{organizationId?:string;productId:string;employeeId?:string;employeeName:string;standardId:string;standardVersionId:string;ownerUserId:string;buddyUserId?:string;startedOn:string;targetOn?:string;createdByUserId:string}) {
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const tasks=await tx`SELECT id FROM standard_tasks WHERE organization_id=${organizationId} AND standard_version_id=${input.standardVersionId} ORDER BY position`;
    const [process]=await tx`INSERT INTO onboarding_processes(organization_id,product_id,employee_id,employee_name_snapshot,standard_id,standard_version_id,owner_user_id,buddy_user_id,status,started_on,target_on,created_by_user_id) VALUES(${organizationId},${input.productId},${input.employeeId??null},${input.employeeName},${input.standardId},${input.standardVersionId},${input.ownerUserId},${input.buddyUserId??null},'IN_PROGRESS',${input.startedOn},${input.targetOn??null},${input.createdByUserId}) RETURNING id`;
    for(const task of tasks){await tx`INSERT INTO onboarding_task_progress(organization_id,onboarding_process_id,standard_task_id,status) VALUES(${organizationId},${process.id},${task.id},'TODO')`;}
    return process.id as string;
  });
}

export async function closeProcess(input:{organizationId?:string;processId:string;verifiedByUserId:string;result:"COMPLETED"|"COMPLETED_WITH_RECOMMENDATIONS";summary:string;recommendations?:string}) {
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const [process]=await tx`SELECT id,standard_id,standard_version_id,employee_name_snapshot FROM onboarding_processes WHERE id=${input.processId} AND organization_id=${organizationId} FOR UPDATE`;
    if(!process) throw new Error("Onboarding process not found.");
    const [remaining]=await tx`SELECT count(*)::int count FROM onboarding_task_progress WHERE onboarding_process_id=${input.processId} AND organization_id=${organizationId} AND status<>'DONE'`;
    if(remaining.count>0) throw new Error("Onboarding process is not ready to close.");
    const [closure]=await tx`INSERT INTO onboarding_closures(organization_id,onboarding_process_id,standard_id,standard_version_id,employee_name_snapshot,verified_by_user_id,result,summary,recommendations,verified_at) VALUES(${organizationId},${process.id},${process.standard_id},${process.standard_version_id},${process.employee_name_snapshot},${input.verifiedByUserId},${input.result}::onboarding_closure_result,${input.summary},${input.recommendations??null},now()) RETURNING id`;
    await tx`UPDATE onboarding_processes SET status='CLOSED',closed_at=now(),updated_at=now() WHERE id=${process.id} AND organization_id=${organizationId}`;
    return closure.id as string;
  });
}
