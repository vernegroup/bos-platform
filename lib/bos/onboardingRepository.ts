import "server-only";
import { db, hasDatabase } from "@/lib/db";
export * from "@/lib/bos/core/standardRepository";
export * from "@/lib/bos/core/processPrimitives";
import { hasStandardTaskId } from "@/lib/bos/core/processPrimitives";
import type { ProcessRecord, OnboardingTaskStage } from "@/lib/bos/core/processPrimitives";
import { onboardingProcesses } from "@/data/onboardingProcesses";
import { onboardingClosures } from "@/data/onboardingClosures";

function tenantId(organizationId?: string) {
  if (!organizationId) throw new Error("organizationId is required for onboarding data.");
  return organizationId;
}

const datePL = (value: string | Date | null) => {
  if (!value) return "";
  const d = new Date(value);
  return new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d);
};

function requirePersistedOnboarding() {
  if (!hasDatabase()) throw new Error("Database is required for persisted onboarding operations.");
}

export async function listProcesses(organizationId?:string): Promise<ProcessRecord[]> {
  if (!hasDatabase()) return onboardingProcesses.map(process=>({...process,status:"W TOKU" as const,startChecks:[],readinessChecks:[],tasks:process.tasks.map(task=>({
    ...task,
    explainedAt:task.status!=="DO WYKONANIA"?task.completedAt??"fallback":undefined,
    shownAt:task.status!=="DO WYKONANIA"?task.completedAt??"fallback":undefined,
    togetherAt:task.status!=="DO WYKONANIA"?task.completedAt??"fallback":undefined,
    soloAt:task.status==="GOTOWE"?task.completedAt??"fallback":undefined,
    checkedAt:task.status==="GOTOWE"?task.completedAt??"fallback":undefined
  }))}));
  const sql=db(); const orgId=tenantId(organizationId);
  const rows=await sql`
    SELECT p.id,p.employee_id,p.employee_name_snapshot,p.standard_id,sv.version_label,p.started_on,p.target_on,
      u.display_name owner,p.status,
      COALESCE(json_agg(json_build_object('standardTaskId',tp.standard_task_id,'explainedAt',tp.explained_at,
        'shownAt',tp.shown_at,'togetherAt',tp.together_at,'soloAt',tp.solo_at,'checkedAt',tp.checked_at,'note',tp.note,
        'explainedBy',ue.display_name,'shownBy',us.display_name,'togetherBy',ut.display_name,'soloBy',uo.display_name,'checkedBy',uc.display_name))
        FILTER (WHERE tp.id IS NOT NULL),'[]'::json) tasks,
      COALESCE((SELECT json_agg(json_build_object('requirementId',sc.requirement_id,'isSatisfied',sc.is_satisfied,'checkedAt',sc.checked_at,'note',sc.note))
        FROM onboarding_start_checks sc WHERE sc.onboarding_process_id=p.id AND sc.organization_id=p.organization_id),'[]'::json) start_checks,
      COALESCE((SELECT json_agg(json_build_object('criterionId',rc.readiness_criterion_id,'isPassed',rc.is_passed,'checkedAt',rc.checked_at,'checkedBy',ru.display_name,'note',rc.note))
        FROM onboarding_readiness_checks rc LEFT JOIN users ru ON ru.id=rc.checked_by_user_id
        WHERE rc.onboarding_process_id=p.id AND rc.organization_id=p.organization_id),'[]'::json) readiness_checks
    FROM onboarding_processes p
    JOIN standard_versions sv ON sv.id=p.standard_version_id AND sv.organization_id=p.organization_id
    JOIN users u ON u.id=p.owner_user_id
    LEFT JOIN onboarding_task_progress tp ON tp.onboarding_process_id=p.id AND tp.organization_id=p.organization_id
    LEFT JOIN users ue ON ue.id=tp.explained_by_user_id LEFT JOIN users us ON us.id=tp.shown_by_user_id
    LEFT JOIN users ut ON ut.id=tp.together_by_user_id LEFT JOIN users uo ON uo.id=tp.solo_by_user_id LEFT JOIN users uc ON uc.id=tp.checked_by_user_id
    WHERE p.organization_id=${orgId} AND p.status IN ('PLANNED','IN_PROGRESS','PAUSED','READY_TO_CLOSE')
    GROUP BY p.id,sv.version_label,u.display_name ORDER BY p.started_on DESC`;
  return rows.map(r=>({id:r.id,employeeId:r.employee_id??undefined,employee:r.employee_name_snapshot,standardId:r.standard_id,standardVersion:r.version_label,
    startedAt:datePL(r.started_on),targetDate:r.target_on?datePL(r.target_on):"",owner:r.owner,status:r.status==="PLANNED"?"PLANOWANE" as const:r.status==="PAUSED"?"WSTRZYMANE" as const:"W TOKU" as const,
    startChecks:((r.start_checks??[]) as Array<{requirementId:string;isSatisfied:boolean;checkedAt?:string;note?:string}>).map(x=>({requirementId:x.requirementId,isSatisfied:x.isSatisfied,checkedAt:x.checkedAt??undefined,note:x.note??undefined})),
    readinessChecks:((r.readiness_checks??[]) as Array<{criterionId:string;isPassed:boolean;checkedAt?:string;checkedBy?:string;note?:string}>).map(x=>({criterionId:x.criterionId,isPassed:x.isPassed,checkedAt:x.checkedAt??undefined,checkedBy:x.checkedBy??undefined,note:x.note??undefined})),
    tasks:((r.tasks??[]) as Array<{standardTaskId:string;explainedAt?:string;shownAt?:string;togetherAt?:string;soloAt?:string;checkedAt?:string;note?:string;explainedBy?:string;shownBy?:string;togetherBy?:string;soloBy?:string;checkedBy?:string}>)
      .filter(hasStandardTaskId).map(x=>({standardTaskId:x.standardTaskId,
        status:x.checkedAt?"GOTOWE" as const:(x.explainedAt||x.shownAt||x.togetherAt||x.soloAt)?"W TOKU" as const:"DO WYKONANIA" as const,
        explainedAt:x.explainedAt??undefined,shownAt:x.shownAt??undefined,togetherAt:x.togetherAt??undefined,soloAt:x.soloAt??undefined,checkedAt:x.checkedAt??undefined,
        completedAt:x.checkedAt?datePL(x.checkedAt):undefined,note:x.note??undefined,
        explainedBy:x.explainedBy??undefined,shownBy:x.shownBy??undefined,togetherBy:x.togetherBy??undefined,soloBy:x.soloBy??undefined,checkedBy:x.checkedBy??undefined}))}));
}

export async function getProcess(processId:string, organizationId?:string) {
  const all=await listProcesses(organizationId); return all.find(p=>p.id===processId) ?? null;
}

export async function listClosures(organizationId?:string) {
  if (!hasDatabase()) return onboardingClosures.map(c=>({...c,employeeId:undefined,decision:c.result==="GOTOWY"?"READY" as const:c.result==="JESZCZE NIE"?"NOT_YET" as const:"STOP" as const,decisionSequence:1,reopenReason:undefined,isLatest:true}));
  const sql=db(); const orgId=tenantId(organizationId);
  const rows=await sql`
    SELECT c.id,c.onboarding_process_id,c.employee_name_snapshot,c.standard_id,p.employee_id,sv.version_label,p.started_on,c.verified_at,
      owner.display_name owner,verifier.display_name verified_by,c.decision,c.summary,c.recommendations,c.decision_sequence,c.reopen_reason,
      (to_jsonb(c)->'outcome_snapshot') outcome_snapshot,
      (c.decision_sequence=(SELECT max(c2.decision_sequence) FROM onboarding_closures c2 WHERE c2.onboarding_process_id=c.onboarding_process_id AND c2.organization_id=c.organization_id)) is_latest,
      (SELECT count(*)::int FROM onboarding_task_progress tp WHERE tp.onboarding_process_id=p.id AND tp.checked_at IS NOT NULL) completed_tasks,
      (SELECT count(*)::int FROM onboarding_task_progress tp WHERE tp.onboarding_process_id=p.id) total_tasks
    FROM onboarding_closures c JOIN onboarding_processes p ON p.id=c.onboarding_process_id AND p.organization_id=c.organization_id
    JOIN standard_versions sv ON sv.id=c.standard_version_id AND sv.organization_id=c.organization_id
    JOIN users owner ON owner.id=p.owner_user_id JOIN users verifier ON verifier.id=c.verified_by_user_id
    WHERE c.organization_id=${orgId} ORDER BY c.verified_at DESC,c.decision_sequence DESC`;
  return rows.map(r=>{const raw=r.outcome_snapshot as any;const snapshot=typeof raw==="string"?JSON.parse(raw):raw;const snapshotTasks=Array.isArray(snapshot?.tasks)?snapshot.tasks:null;return ({id:r.id,processId:r.onboarding_process_id,employeeId:r.employee_id??undefined,employee:r.employee_name_snapshot,standardId:r.standard_id,standardVersion:r.version_label,
    startedAt:datePL(r.started_on),closedAt:datePL(r.verified_at),owner:r.owner,verifiedBy:r.verified_by,
    result:r.decision==="READY"?"GOTOWY" as const:r.decision==="NOT_YET"?"JESZCZE NIE" as const:"STOP" as const,
    decision:r.decision as "READY"|"NOT_YET"|"STOP",decisionSequence:r.decision_sequence,reopenReason:r.reopen_reason??undefined,isLatest:Boolean(r.is_latest),
    snapshotAvailable:Boolean(snapshot),
    completedTasks:snapshotTasks?snapshotTasks.filter((x:any)=>Boolean(x.checkedAt)).length:r.completed_tasks,totalTasks:snapshotTasks?snapshotTasks.length:r.total_tasks,summary:r.summary,recommendations:r.recommendations??undefined});});
}

export async function getClosure(closureId:string, organizationId?:string) {
  const all=await listClosures(organizationId); return all.find(c=>c.id===closureId) ?? null;
}

type ClosureOutcomeSnapshot={
  snapshotAvailable:boolean;
  position:string;
  department:string;
  tasks:Array<{standardTaskId:string;explainedAt?:string;shownAt?:string;togetherAt?:string;soloAt?:string;checkedAt?:string;note?:string}>;
  startChecks:Array<{requirementId:string;isSatisfied:boolean;checkedAt?:string}>;
  readinessChecks:Array<{criterionId:string;isPassed:boolean;checkedAt?:string;note?:string}>;
};

export async function getClosureOutcome(closureId:string, organizationId?:string):Promise<ClosureOutcomeSnapshot|null> {
  requirePersistedOnboarding();
  const sql=db(); const orgId=tenantId(organizationId);
  const [closure]=await sql`
    SELECT c.onboarding_process_id,(to_jsonb(c)->'outcome_snapshot') outcome_snapshot
    FROM onboarding_closures c
    WHERE c.id=${closureId} AND c.organization_id=${orgId} LIMIT 1`;
  if(!closure) return null;
  const raw=closure.outcome_snapshot as any;
  const snapshot=typeof raw==="string"?JSON.parse(raw):raw;
  if(!snapshot) return {snapshotAvailable:false,position:"",department:"",tasks:[],startChecks:[],readinessChecks:[]};
  return {
    snapshotAvailable:true,
    position:snapshot.position??"",department:snapshot.department??"",
    tasks:Array.isArray(snapshot.tasks)?snapshot.tasks:[],
    startChecks:Array.isArray(snapshot.startChecks)?snapshot.startChecks:[],
    readinessChecks:Array.isArray(snapshot.readinessChecks)?snapshot.readinessChecks:[]
  };
}

export async function closeProcess(input:{organizationId?:string;processId:string;verifiedByUserId:string;decision:"READY"|"NOT_YET"|"STOP";summary:string;recommendations?:string;formalitiesConfirmed:boolean}) {
  requirePersistedOnboarding(); const sql=db(); const organizationId=tenantId(input.organizationId);
  const summary=input.summary.trim(), recommendations=input.recommendations?.trim()||null;
  if(input.decision==="READY" && !input.formalitiesConfirmed) throw new Error("Przed decyzją GOTOWY potwierdź weryfikację wymaganych formalności poza BOS.");
  if(!summary) throw new Error("Podsumowanie decyzji jest wymagane.");
  if(input.decision!=="READY" && !recommendations) throw new Error("Dla JESZCZE NIE lub STOP podaj powód i dalsze działanie.");
  return sql.begin(async tx=>{
    const [member]=await tx`SELECT 1 ok FROM memberships WHERE organization_id=${organizationId} AND user_id=${input.verifiedByUserId} AND status='ACTIVE' LIMIT 1`;
    if(!member) throw new Error("Osoba podejmująca decyzję nie należy aktywnie do organizacji.");
    const [process]=await tx`SELECT id,standard_id,standard_version_id,employee_name_snapshot,status FROM onboarding_processes WHERE id=${input.processId} AND organization_id=${organizationId} FOR UPDATE`;
    if(!process) throw new Error("Nie znaleziono procesu.");
    if(!["PLANNED","IN_PROGRESS","PAUSED","READY_TO_CLOSE"].includes(process.status)) throw new Error("Proces nie jest otwarty do decyzji.");
    if(input.decision==="READY") {
      const [gate]=await tx`SELECT
        count(*) FILTER(WHERE tp.checked_at IS NULL)::int tasks_missing,
        count(*) FILTER(WHERE st.is_critical AND (tp.solo_at IS NULL OR tp.checked_at IS NULL))::int critical_missing
        FROM onboarding_task_progress tp JOIN standard_tasks st ON st.id=tp.standard_task_id AND st.organization_id=tp.organization_id
        WHERE tp.onboarding_process_id=${process.id} AND tp.organization_id=${organizationId}`;
      const [readiness]=await tx`SELECT count(*) FILTER(WHERE is_passed=false)::int missing FROM onboarding_readiness_checks WHERE onboarding_process_id=${process.id} AND organization_id=${organizationId}`;
      if((gate?.tasks_missing??1)>0||(gate?.critical_missing??1)>0||(readiness?.missing??1)>0) throw new Error("Readiness Gate nie jest kompletny.");
    }
    const [seq]=await tx`SELECT COALESCE(max(decision_sequence),0)::int+1 sequence FROM onboarding_closures WHERE onboarding_process_id=${process.id} AND organization_id=${organizationId}`;
    const [employee]=await tx`SELECT e.position,e.department FROM onboarding_processes p LEFT JOIN employees e ON e.id=p.employee_id AND e.organization_id=p.organization_id WHERE p.id=${process.id} AND p.organization_id=${organizationId} LIMIT 1`;
    const [tasks,startChecks,readinessChecks]=await Promise.all([
      tx`SELECT standard_task_id,explained_at,shown_at,together_at,solo_at,checked_at,note FROM onboarding_task_progress WHERE organization_id=${organizationId} AND onboarding_process_id=${process.id}`,
      tx`SELECT requirement_id,is_satisfied,checked_at FROM onboarding_start_checks WHERE organization_id=${organizationId} AND onboarding_process_id=${process.id}`,
      tx`SELECT readiness_criterion_id,is_passed,checked_at,note FROM onboarding_readiness_checks WHERE organization_id=${organizationId} AND onboarding_process_id=${process.id}`
    ]);
    const outcomeSnapshot=JSON.stringify({
      position:employee?.position??"",department:employee?.department??"",
      tasks:tasks.map(x=>({standardTaskId:x.standard_task_id,explainedAt:x.explained_at??null,shownAt:x.shown_at??null,togetherAt:x.together_at??null,soloAt:x.solo_at??null,checkedAt:x.checked_at??null,note:x.note??null})),
      startChecks:startChecks.map(x=>({requirementId:x.requirement_id,isSatisfied:Boolean(x.is_satisfied),checkedAt:x.checked_at??null})),
      readinessChecks:readinessChecks.map(x=>({criterionId:x.readiness_criterion_id,isPassed:Boolean(x.is_passed),checkedAt:x.checked_at??null,note:x.note??null}))
    });
    const [snapshotColumn]=await tx`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='onboarding_closures' AND column_name='outcome_snapshot') available`;
    const [closure]=snapshotColumn?.available
      ? await tx`INSERT INTO onboarding_closures(organization_id,onboarding_process_id,standard_id,standard_version_id,employee_name_snapshot,decision,verified_by_user_id,summary,recommendations,decision_sequence,outcome_snapshot)
          VALUES(${organizationId},${process.id},${process.standard_id},${process.standard_version_id},${process.employee_name_snapshot},${input.decision}::onboarding_decision_result,${input.verifiedByUserId},${summary},${recommendations},${seq.sequence},((${outcomeSnapshot}::jsonb #>> '{}')::jsonb)) RETURNING id`
      : await tx`INSERT INTO onboarding_closures(organization_id,onboarding_process_id,standard_id,standard_version_id,employee_name_snapshot,decision,verified_by_user_id,summary,recommendations,decision_sequence)
          VALUES(${organizationId},${process.id},${process.standard_id},${process.standard_version_id},${process.employee_name_snapshot},${input.decision}::onboarding_decision_result,${input.verifiedByUserId},${summary},${recommendations},${seq.sequence}) RETURNING id`;
    await tx`UPDATE onboarding_processes SET status=${input.decision==="NOT_YET"?"PAUSED":"CLOSED"}::onboarding_process_status,closed_at=${input.decision==="NOT_YET"?null:new Date()},updated_at=now() WHERE id=${process.id} AND organization_id=${organizationId}`;
    return closure.id as string;
  });
}

export async function reopenProcess(input:{organizationId?:string;processId:string;closureId:string;userId:string;reason:string}) {
  requirePersistedOnboarding(); const sql=db(); const organizationId=tenantId(input.organizationId); const reason=input.reason.trim();
  if(!reason) throw new Error("Powód wznowienia jest wymagany.");
  return sql.begin(async tx=>{
    const [member]=await tx`SELECT 1 ok FROM memberships WHERE organization_id=${organizationId} AND user_id=${input.userId} AND status='ACTIVE' LIMIT 1`;
    if(!member) throw new Error("Osoba wznawiająca nie należy aktywnie do organizacji.");
    const [closure]=await tx`SELECT c.id FROM onboarding_closures c WHERE c.id=${input.closureId} AND c.onboarding_process_id=${input.processId} AND c.organization_id=${organizationId}
      AND c.decision_sequence=(SELECT max(c2.decision_sequence) FROM onboarding_closures c2 WHERE c2.onboarding_process_id=c.onboarding_process_id AND c2.organization_id=c.organization_id) LIMIT 1`;
    if(!closure) throw new Error("Wznowić można wyłącznie ostatnią decyzję procesu.");
    const [process]=await tx`SELECT status FROM onboarding_processes WHERE id=${input.processId} AND organization_id=${organizationId} FOR UPDATE`;
    if(!process || !["CLOSED","PAUSED"].includes(process.status)) throw new Error("Proces nie jest zamknięty ani wstrzymany.");
    await tx`INSERT INTO onboarding_reopen_events(organization_id,onboarding_process_id,closure_id,reopened_by_user_id,reason) VALUES(${organizationId},${input.processId},${input.closureId},${input.userId},${reason})`;
    await tx`UPDATE onboarding_processes SET status='IN_PROGRESS',closed_at=null,updated_at=now() WHERE id=${input.processId} AND organization_id=${organizationId}`;
  });
}

export async function confirmStartRequirement(input:{organizationId?:string;processId:string;requirementId:string;userId:string}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  return sql.begin(async tx=>{
    const membership=await tx`SELECT 1 FROM memberships WHERE organization_id=${organizationId} AND user_id=${input.userId} AND status='ACTIVE' LIMIT 1`;
    if(!membership[0]) throw new Error("Osoba potwierdzająca warunek nie należy aktywnie do tej organizacji.");
    const rows=await tx`UPDATE onboarding_start_checks SET is_satisfied=true,checked_by_user_id=${input.userId},checked_at=now(),updated_at=now()
      WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND requirement_id=${input.requirementId} RETURNING id`;
    if(!rows[0]) throw new Error("Nie znaleziono warunku rozpoczęcia dla tego procesu.");
    const [remaining]=await tx`SELECT count(*)::int count FROM onboarding_start_checks WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND is_satisfied=false`;
    if(remaining.count===0) await tx`UPDATE onboarding_processes SET status='IN_PROGRESS',updated_at=now() WHERE id=${input.processId} AND organization_id=${organizationId} AND status='PLANNED'`;
  });
}

export async function confirmReadinessCriterion(input:{organizationId?:string;processId:string;criterionId:string;userId:string;note?:string}) {
  requirePersistedOnboarding(); const sql=db(); const organizationId=tenantId(input.organizationId); const note=(input.note??"").trim();
  if(note.length>500) throw new Error("Notatka może mieć maksymalnie 500 znaków.");
  return sql.begin(async tx=>{
    const member=await tx`SELECT 1 FROM memberships WHERE organization_id=${organizationId} AND user_id=${input.userId} AND status='ACTIVE' LIMIT 1`;
    if(!member[0]) throw new Error("Osoba weryfikująca nie należy aktywnie do tej organizacji.");
    const [gate]=await tx`SELECT
      count(*) FILTER(WHERE tp.checked_at IS NULL)::int tasks_missing,
      count(*) FILTER(WHERE st.is_critical AND (tp.solo_at IS NULL OR tp.checked_at IS NULL))::int critical_missing
      FROM onboarding_task_progress tp JOIN standard_tasks st ON st.id=tp.standard_task_id AND st.organization_id=tp.organization_id
      WHERE tp.organization_id=${organizationId} AND tp.onboarding_process_id=${input.processId}`;
    if((gate?.tasks_missing??1)>0 || (gate?.critical_missing??1)>0) throw new Error("Najpierw ukończ wszystkie czynności oraz SAM + SPRAWDŹ dla wszystkich K.");
    const rows=await tx`UPDATE onboarding_readiness_checks SET is_passed=true,checked_by_user_id=${input.userId},checked_at=now(),note=${note||null},updated_at=now()
      WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND readiness_criterion_id=${input.criterionId} RETURNING id`;
    if(!rows[0]) throw new Error("Nie znaleziono kryterium gotowości dla tego procesu.");
    const [remaining]=await tx`SELECT count(*)::int count FROM onboarding_readiness_checks WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND is_passed=false`;
    if(remaining.count===0) await tx`UPDATE onboarding_processes SET status='READY_TO_CLOSE',updated_at=now() WHERE id=${input.processId} AND organization_id=${organizationId} AND status IN ('IN_PROGRESS','PAUSED')`;
  });
}

export async function updateTaskNote(input:{organizationId?:string;processId:string;standardTaskId:string;note:string;userId:string}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId); const note=input.note.trim();
  if(note.length>500) throw new Error("Notatka może mieć maksymalnie 500 znaków.");
  const member=await sql`SELECT 1 FROM memberships WHERE organization_id=${organizationId} AND user_id=${input.userId} AND status='ACTIVE' LIMIT 1`;
  if(!member[0]) throw new Error("Osoba zapisująca notatkę nie należy aktywnie do tej organizacji.");
  const rows=await sql`UPDATE onboarding_task_progress SET note=${note||null},updated_at=now()
    WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND standard_task_id=${input.standardTaskId} RETURNING id`;
  if(!rows[0]) throw new Error("Nie znaleziono czynności w tym procesie.");
}

export async function confirmTaskStage(input:{organizationId?:string;processId:string;standardTaskId:string;stage:OnboardingTaskStage;userId:string}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId); const now=new Date();
  const [process]=await sql`SELECT status FROM onboarding_processes WHERE id=${input.processId} AND organization_id=${organizationId} LIMIT 1`;
  if(!process || process.status==='PLANNED') throw new Error("Najpierw potwierdź wszystkie warunki rozpoczęcia.");
  const actor=await sql`SELECT 1 ok FROM memberships WHERE organization_id=${organizationId} AND user_id=${input.userId} LIMIT 1`;
  if(!actor[0]) throw new Error("Osoba potwierdzająca etap nie należy do tej organizacji.");
  const rows=input.stage==="EXPLAINED"
    ? await sql`UPDATE onboarding_task_progress SET explained_at=${now},explained_by_user_id=${input.userId},updated_at=now() WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND standard_task_id=${input.standardTaskId} RETURNING id`
    : input.stage==="SHOWN"
    ? await sql`UPDATE onboarding_task_progress SET shown_at=${now},shown_by_user_id=${input.userId},updated_at=now() WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND standard_task_id=${input.standardTaskId} AND explained_at IS NOT NULL RETURNING id`
    : input.stage==="TOGETHER"
    ? await sql`UPDATE onboarding_task_progress SET together_at=${now},together_by_user_id=${input.userId},updated_at=now() WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND standard_task_id=${input.standardTaskId} AND shown_at IS NOT NULL RETURNING id`
    : input.stage==="SOLO"
    ? await sql`UPDATE onboarding_task_progress SET solo_at=${now},solo_by_user_id=${input.userId},updated_at=now() WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND standard_task_id=${input.standardTaskId} AND together_at IS NOT NULL RETURNING id`
    : await sql`UPDATE onboarding_task_progress SET checked_at=${now},checked_by_user_id=${input.userId},updated_at=now() WHERE organization_id=${organizationId} AND onboarding_process_id=${input.processId} AND standard_task_id=${input.standardTaskId} AND solo_at IS NOT NULL RETURNING id`;
  if(!rows[0]) throw new Error("Etapy BOS potwierdzaj kolejno: WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ.");
  await sql`UPDATE onboarding_processes SET status='IN_PROGRESS',updated_at=now() WHERE id=${input.processId} AND organization_id=${organizationId} AND status='PAUSED'`;
}

export async function listOnboardingStartOptions(organizationId?:string) {
  requirePersistedOnboarding();
  const sql=db(); const orgId=tenantId(organizationId);
  const [standards,memberships,employees,products]=await Promise.all([
    sql`SELECT DISTINCT ON (s.id) s.id standard_id,s.name,s.area,sv.id version_id,sv.version_label
      FROM standards s JOIN standard_versions sv ON sv.standard_id=s.id AND sv.organization_id=s.organization_id
      WHERE s.organization_id=${orgId} AND s.status='ACTIVE' AND sv.status='PUBLISHED'
      ORDER BY s.id,sv.version_number DESC`,
    sql`SELECT u.id,u.display_name,u.email,m.role FROM memberships m JOIN users u ON u.id=m.user_id
      WHERE m.organization_id=${orgId} AND m.status='ACTIVE' AND u.status='ACTIVE' ORDER BY u.display_name`,
    sql`SELECT e.id,e.first_name,e.last_name,e.employee_number,e.position,e.department,e.linked_user_id
      FROM employees e WHERE e.organization_id=${orgId} AND e.status='ACTIVE'
      ORDER BY e.last_name,e.first_name,e.created_at`,
    sql`SELECT p.id,p.key,p.name FROM licenses l JOIN products p ON p.id=l.product_id
      WHERE l.organization_id=${orgId} AND l.status='ACTIVE' AND p.status='ACTIVE' ORDER BY p.name`
  ]);
  return {
    standards:standards.map(x=>({standardId:x.standard_id,name:x.name,area:x.area??"",versionId:x.version_id,version:x.version_label})),
    members:memberships.map(x=>({id:x.id,name:x.display_name,email:x.email,role:x.role})),
    employees:employees.map(x=>({id:x.id,name:[x.first_name,x.last_name].filter(Boolean).join(" "),employeeNumber:x.employee_number??"",position:x.position??"",department:x.department??"",linkedUserId:x.linked_user_id??undefined})),
    products:products.map(x=>({id:x.id,key:x.key,name:x.name}))
  };
}

export async function createProcess(input:{
  organizationId?:string;productId:string;employeeId:string;standardId:string;standardVersionId:string;
  ownerUserId:string;trainerUserId:string;evaluatorUserId:string;buddyUserId?:string;startedOn:string;targetOn?:string;createdByUserId:string;
}) {
  requirePersistedOnboarding();
  const sql=db(); const organizationId=tenantId(input.organizationId);
  if(!input.employeeId) throw new Error("Pracownik jest wymagany.");
  if(!input.startedOn) throw new Error("Data startu jest wymagana.");
  return sql.begin(async tx=>{
    const [version]=await tx`SELECT sv.id,sv.standard_id,sv.status,s.status standard_status
      FROM standard_versions sv JOIN standards s ON s.id=sv.standard_id AND s.organization_id=sv.organization_id
      WHERE sv.id=${input.standardVersionId} AND sv.standard_id=${input.standardId} AND sv.organization_id=${organizationId}
      FOR SHARE OF sv,s`;
    if(!version || version.status!=="PUBLISHED" || version.standard_status!=="ACTIVE")
      throw new Error("Onboarding można rozpocząć wyłącznie na opublikowanej wersji aktywnego Standardu.");

    const [licensedProduct]=await tx`SELECT p.id FROM products p JOIN licenses l ON l.product_id=p.id
      WHERE p.id=${input.productId} AND p.status='ACTIVE' AND l.organization_id=${organizationId} AND l.status='ACTIVE' LIMIT 1`;
    if(!licensedProduct) throw new Error("Organizacja nie ma aktywnej licencji produktu.");

    const actors=[input.ownerUserId,input.trainerUserId,input.evaluatorUserId,input.createdByUserId,...(input.buddyUserId?[input.buddyUserId]:[])];
    const uniqueActors=[...new Set(actors)];
    const activeActors=await tx`SELECT user_id FROM memberships WHERE organization_id=${organizationId}
      AND status='ACTIVE' AND user_id = ANY(${uniqueActors})`;
    if(activeActors.length!==uniqueActors.length) throw new Error("Wszystkie osoby przypisane do procesu muszą być aktywnymi członkami organizacji.");

    const [employee]=await tx`SELECT id,first_name,last_name FROM employees
      WHERE id=${input.employeeId} AND organization_id=${organizationId} AND status='ACTIVE' LIMIT 1 FOR SHARE`;
    if(!employee) throw new Error("Wybrany pracownik nie istnieje lub nie jest aktywny w tej organizacji.");
    const employeeName=[employee.first_name,employee.last_name].filter(Boolean).join(" ").trim();

    const [process]=await tx`INSERT INTO onboarding_processes(
      organization_id,product_id,employee_id,employee_name_snapshot,standard_id,standard_version_id,
      owner_user_id,trainer_user_id,evaluator_user_id,buddy_user_id,status,started_on,target_on,created_by_user_id
    ) VALUES(
      ${organizationId},${input.productId},${employee.id},${employeeName},${input.standardId},${input.standardVersionId},
      ${input.ownerUserId},${input.trainerUserId},${input.evaluatorUserId},${input.buddyUserId??null},'PLANNED',
      ${input.startedOn},${input.targetOn??null},${input.createdByUserId}
    ) RETURNING id`;

    await tx`INSERT INTO onboarding_task_progress(organization_id,onboarding_process_id,standard_task_id)
      SELECT ${organizationId},${process.id},id FROM standard_tasks
      WHERE organization_id=${organizationId} AND standard_version_id=${input.standardVersionId} ORDER BY position`;
    await tx`INSERT INTO onboarding_start_checks(organization_id,onboarding_process_id,requirement_id)
      SELECT ${organizationId},${process.id},id FROM standard_start_requirements
      WHERE organization_id=${organizationId} AND standard_version_id=${input.standardVersionId} ORDER BY position`;
    await tx`INSERT INTO onboarding_readiness_checks(organization_id,onboarding_process_id,readiness_criterion_id)
      SELECT ${organizationId},${process.id},id FROM standard_readiness_criteria
      WHERE organization_id=${organizationId} AND standard_version_id=${input.standardVersionId} ORDER BY position`;
    const [startCount]=await tx`SELECT count(*)::int count FROM onboarding_start_checks WHERE organization_id=${organizationId} AND onboarding_process_id=${process.id}`;
    if(startCount.count===0) await tx`UPDATE onboarding_processes SET status='IN_PROGRESS',updated_at=now() WHERE id=${process.id} AND organization_id=${organizationId} AND status='PLANNED'`;
    return process.id as string;
  });
}
