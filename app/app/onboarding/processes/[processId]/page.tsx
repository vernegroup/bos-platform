import GateConfirmation, { type GateResult } from "@/components/bos-ux3/GateConfirmation";
import TaskStagePanel, { type StageConfirmationResult } from "@/components/bos-ux3/TaskStagePanel";
import HelpProcessContext from "@/components/app-shell/HelpProcessContext";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { confirmReadinessCriterion, confirmStartRequirement, confirmTaskStage, getProcess, getProcessProgress, getStandard, updateTaskNote, type OnboardingTaskStage } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

async function saveStartResult(_state:GateResult,data:FormData):Promise<GateResult>{
  "use server";
  const access=await requireBOSAccess();
  const processId=String(data.get("processId")??"");
  const requirementId=String(data.get("requirementId")??"");
  try{
    await confirmStartRequirement({organizationId:access.organization.id,processId,requirementId,userId:access.user.id});
    revalidatePath("/app/onboarding/processes/"+processId);
    revalidatePath("/app/onboarding");
    return {ok:true,nonce:Date.now()};
  }catch(error){return {ok:false,error:error instanceof Error?error.message:"Błąd zapisu",nonce:Date.now()};}
}
async function saveReadinessResult(_state:GateResult,data:FormData):Promise<GateResult>{
  "use server";
  const access=await requireBOSAccess();
  const processId=String(data.get("processId")??"");
  const criterionId=String(data.get("criterionId")??"");
  const note=String(data.get("note")??"");
  try{
    await confirmReadinessCriterion({organizationId:access.organization.id,processId,criterionId,userId:access.user.id,note});
    revalidatePath("/app/onboarding/processes/"+processId);
    revalidatePath("/app/onboarding");
    return {ok:true,nonce:Date.now()};
  }catch(error){return {ok:false,error:error instanceof Error?error.message:"Błąd zapisu",nonce:Date.now()};}
}
async function confirmStage(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const standardTaskId=String(formData.get("standardTaskId")??""); const stage=String(formData.get("stage")??"") as OnboardingTaskStage;
  if(!["EXPLAINED","SHOWN","TOGETHER","SOLO","CHECKED"].includes(stage)) throw new Error("Nieprawidłowy etap BOS.");
  await confirmTaskStage({organizationId:access.organization.id,processId,standardTaskId,stage,userId:access.user.id}); revalidatePath(`/app/onboarding/processes/${processId}`); revalidatePath("/app/onboarding"); redirect(`/app/onboarding/processes/${processId}#task-${standardTaskId}`);
}
async function saveStageResult(_state:StageConfirmationResult, data:FormData):Promise<StageConfirmationResult> {
  "use server";
  const access=await requireBOSAccess();
  const processId=String(data.get("processId")||"");
  const standardTaskId=String(data.get("standardTaskId")||"");
  const stage=String(data.get("stage")||"") as OnboardingTaskStage;
  try {
    if(!["EXPLAINED","SHOWN","TOGETHER","SOLO","CHECKED"].includes(stage)) throw new Error("Nieprawidłowy etap");
    await confirmTaskStage({organizationId:access.organization.id,processId,standardTaskId,stage,userId:access.user.id});
    revalidatePath("/app/onboarding/processes/"+processId);
    return {ok:true,stage,nonce:Date.now()};
  } catch(e) {
    return {ok:false,error:e instanceof Error?e.message:"Błąd zapisu",nonce:Date.now()};
  }
}
async function confirmStart(formData:FormData) {
  "use server";
  const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const requirementId=String(formData.get("requirementId")??"");
  await confirmStartRequirement({organizationId:access.organization.id,processId,requirementId,userId:access.user.id}); revalidatePath(`/app/onboarding/processes/${processId}`); revalidatePath("/app/onboarding"); redirect(`/app/onboarding/processes/${processId}`);
}
async function saveNote(formData:FormData) {
  "use server";
  const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const standardTaskId=String(formData.get("standardTaskId")??""); const note=String(formData.get("note")??"");
  await updateTaskNote({organizationId:access.organization.id,processId,standardTaskId,note,userId:access.user.id}); revalidatePath(`/app/onboarding/processes/${processId}`); redirect(`/app/onboarding/processes/${processId}#task-${standardTaskId}`);
}
async function confirmReadiness(formData:FormData) {
  "use server"; const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const criterionId=String(formData.get("criterionId")??""); const note=String(formData.get("note")??"");
  await confirmReadinessCriterion({organizationId:access.organization.id,processId,criterionId,userId:access.user.id,note}); revalidatePath(`/app/onboarding/processes/${processId}`); revalidatePath("/app/onboarding"); redirect(`/app/onboarding/processes/${processId}#readiness-${criterionId}`);
}
const stageLabels=[["EXPLAINED","WYJAŚNIJ","explainedAt","explainedBy"],["SHOWN","POKAŻ","shownAt","shownBy"],["TOGETHER","RAZEM","togetherAt","togetherBy"],["SOLO","SAM","soloAt","soloBy"],["CHECKED","SPRAWDŹ","checkedAt","checkedBy"]] as const;
const shortDate=(value?:string|Date)=>value?new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit"}).format(new Date(value)):"";

export default async function ProcessDetailPage({ params }: { params: Promise<{ processId: string }> }) {
  const access = await requireBOSAccess();
  const { processId } = await params;
  const process = await getProcess(processId, access.organization.id);
  if (!process) notFound();

  const standard = await getStandard(process.standardId, access.organization.id);
  const version = standard?.versions.find((item) => item.version === process.standardVersion);
  if (!standard || !version) notFound();

  const progress = getProcessProgress(process);
  const startComplete=version.startRequirements.length===0||version.startRequirements.every(req=>process.startChecks.find(check=>check.requirementId===req.id)?.isSatisfied);
  const criticalTasks=version.tasks.filter(task=>task.isCritical);
  const criticalCompleted=criticalTasks.filter(task=>{const x=process.tasks.find(item=>item.standardTaskId===task.id);return Boolean(x?.soloAt&&x?.checkedAt)}).length;
  const tasksGate=progress.completed===progress.total&&progress.total>0;
  const criticalGate=criticalCompleted===criticalTasks.length;
  const readinessPassed=version.readinessCriteria.filter(c=>process.readinessChecks.find(x=>x.criterionId===c.id)?.isPassed).length;
  const readinessGate=version.readinessCriteria.length>0&&readinessPassed===version.readinessCriteria.length;
  const readyForDecision=tasksGate&&criticalGate&&readinessGate;
  const helpState=!startComplete?"start-blocked":!tasksGate?"tasks-pending":!criticalGate?"critical-pending":!readinessGate?"readiness-pending":"ready-for-decision";

  return (
    <>
      <HelpProcessContext context={{product:"onboarding",screen:"process-detail",stage:"conduct",state:helpState}} />
      <div className="bos-standard-back"><Link href="/app/onboarding/processes">← WDROŻENIA W TOKU</Link></div>
      <nav className="bos-guided-flow" aria-label="Etapy BOS Onboarding">
        <Link href="/app/standards"><span>01</span><strong>PRZYGOTUJ</strong><small>Standard Stanowiska</small></Link>
        <Link href="/app/onboarding/processes" className="is-active"><span>02</span><strong>PRZEPROWADŹ</strong><small>Karta Postępu</small></Link>
        <Link href="/app/onboarding/closed"><span>03</span><strong>ZAMKNIJ</strong><small>Karta Zakończenia</small></Link>
      </nav>

      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / WDROŻENIA / KARTA POSTĘPU</div>
          <h1>{process.employee}</h1>
          <p>{standard.name} · Standard {process.standardVersion} · prowadzący: {process.owner}</p>
        </div>
        <div className="bos-app-build-state"><span>STATUS</span><strong>{process.status}</strong></div>
      </section>

      <section className="bos-process-summary">
        <div><span>STANDARD</span><Link href={`/app/standards/${standard.id}?version=${encodeURIComponent(process.standardVersion)}&returnTo=onboarding`}>{standard.name} {process.standardVersion} ↗</Link></div>
        <div><span>START</span><strong>{process.startedAt}</strong></div>
        <div><span>CEL</span><strong>{process.targetDate}</strong></div>
        <div><span>POSTĘP CZYNNOŚCI</span><strong>{progress.percent}%</strong></div><div><span>K — KRYTYCZNE</span><strong>{criticalCompleted}/{criticalTasks.length}</strong></div>
        <div className="bos-process-summary-progress" role="progressbar" aria-label="Postęp wdrożenia" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent}><i style={{ width: `${progress.percent}%` }} /></div>
      </section>

      <aside className="bos-context-guide"><strong>WSKAZÓWKA BOS · START</strong><p>Warunek rozpoczęcia oznacza coś, co faktycznie musi być dostępne lub przygotowane przed wdrożeniem. Potwierdź stan rzeczywisty — nie plan jego wykonania.</p></aside>
      <section className="bos-process-card">
        <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">PRZED STARTEM</span><h2>Warunki rozpoczęcia</h2></div>
          <span className="bos-dashboard-count">{process.startChecks.filter(x=>x.isSatisfied).length} z {version.startRequirements.length} potwierdzonych</span></div>
        {version.startRequirements.length===0?<div className="bos-operational-empty"><strong>Brak dodatkowych warunków rozpoczęcia</strong><p>Standard nie definiuje warunków wymagających potwierdzenia.</p></div>:
          <div className="bos-start-check-list">{version.startRequirements.map(req=>{const check=process.startChecks.find(x=>x.requirementId===req.id);const done=Boolean(check?.isSatisfied);return <div className="bos-start-check-row" key={req.id}>
            <span>{String(req.order).padStart(2,"0")}</span><div><strong>{req.requirement}</strong><small>{({TOOLS:"NARZĘDZIA",ACCESS:"DOSTĘPY",MATERIALS:"MATERIAŁY",INSTRUCTIONS:"INSTRUKCJE",WORKPLACE:"STANOWISKO PRACY",OTHER:"INNE"} as Record<string,string>)[req.category]??req.category}</small></div>
            <GateConfirmation kind="start" processId={process.id} itemId={req.id} label="Warunek spełniony — zapisz potwierdzenie" done={done} disabled={false} action={saveStartResult}/>
          </div>})}</div>}
        {!startComplete&&<div className="bos-operational-empty"><strong>Realizacja jeszcze zablokowana</strong><p>Potwierdź wszystkie warunki rozpoczęcia. Pozostały: {version.startRequirements.filter(req=>!process.startChecks.find(check=>check.requirementId===req.id)?.isSatisfied).map(req=>req.requirement).join("; ")}. Dopiero wtedy proces przejdzie z PLANOWANE do W TOKU i odblokuje etapy BOS.</p></div>}
      </section>

      <section className="bos-process-card bos-ux3-process-card">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">REALIZACJA</span><h2>Karta Postępu</h2></div>
          <span className="bos-dashboard-count">{progress.completed} z {progress.total} czynności gotowych</span>
        </div>

        <aside className="bos-guidance bos-guidance-primary"><div><span className="bos-guidance-eyebrow">TERAZ · PRZEPROWADŹ</span><strong>Prowadź każdą czynność przez 5 etapów</strong><p>Nie zaliczaj wiedzy deklarowanej. Etapy opisują rzeczywistą pracę: najpierw wyjaśnij i pokaż, potem oddawaj wykonanie pracownikowi, aż zrobi je sam i rezultat zostanie sprawdzony.</p></div><details><summary>? Jak działa 5 etapów</summary><p><b>WYJAŚNIJ</b> — pracownik rozumie co, po co i na co uważać. <b>POKAŻ</b> — widzi prawidłowe wykonanie. <b>RAZEM</b> — wykonuje z pomocą. <b>SAM</b> — wykonuje bez prowadzenia krok po kroku. <b>SPRAWDŹ</b> — oceniasz rzeczywisty rezultat według Standardu.</p></details></aside>
        <div className="bos-process-task-head">
          <span>LP.</span><span>CZYNNOŚĆ ZE STANDARDU</span><span>CO SPRAWDZIĆ</span><span>POSTĘP BOS</span>
        </div>
        {version.tasks.map((task) => {
          const state = process.tasks.find((item: { standardTaskId: string }) => item.standardTaskId === task.id);
          if (!state) return null;
          return (
            <article className="bos-process-task-row" id={`task-${task.id}`} key={task.id}>
              <span>{String(task.order).padStart(2, "0")}{task.isCritical ? " · K" : ""}</span>
              <div><strong>{task.name}</strong><p>{task.execution}</p>{task.isCritical&&<small className="bos-context-inline">K — błąd w tej czynności może mieć poważne konsekwencje. K nie oznacza po prostu „ważne”.</small>}{task.hint&&<small>WSKAZÓWKA: {task.hint}</small>}</div>
              <p>{task.readyWhen}</p>
              <div className="bos-process-stage-flow" aria-label={`Etapy BOS dla: ${task.name}`}>
                <TaskStagePanel processId={process.id} taskId={task.id} taskName={task.name} startComplete={startComplete}
                  stages={stageLabels.map(([stage,,key,actorKey])=>({stage,timestamp:state[key] ? new Date(state[key]).toISOString() : undefined,author:state[actorKey]}))}
                  action={saveStageResult}/>
                <details className="bos-error-recovery"><summary>WYSTĄPIŁ BŁĄD — jak wrócić do prawidłowego wykonania?</summary><div><b>ZATRZYMAJ → WSKAŻ → POPRAW → POWTÓRZ → SPRAWDŹ</b><p>Błąd nie kasuje wcześniejszych etapów. Zatrzymaj błędne wykonanie, wskaż konkretną różnicę względem Standardu, popraw sposób działania, pozwól powtórzyć czynność i sprawdź rezultat ponownie.</p><small>W notatce zapisuj fakt, np. „Pominięto sprawdzenie uszkodzenia opakowania”, a nie ocenę osoby, np. „nieuważny”.</small></div></details>
                <form action={saveNote} className="bos-process-note-form"><input type="hidden" name="processId" value={process.id}/><input type="hidden" name="standardTaskId" value={task.id}/><label><span>NOTATKA FAKTOGRAFICZNA</span><textarea name="note" maxLength={500} defaultValue={state.note||""} placeholder="Np. Pominięto sprawdzenie kodu produktu — powtórzyć czynność i sprawdzić rezultat."/></label><div><small>Zapisz zaobserwowany fakt lub działanie do powtórzenia. Nie oceniaj osoby.</small><button type="submit">ZAPISZ NOTATKĘ</button></div></form>
              </div>
            </article>
          );
        })}
      </section>

      <section className="bos-process-card">
        <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">OCENA GOTOWOŚCI</span><h2>Bramka gotowości</h2></div><span className={`bos-dashboard-count bos-readiness-status ${readinessGate?"is-pass":""}`}>{readinessGate?"✓ KRYTERIA POTWIERDZONE":"KRYTERIA DO POTWIERDZENIA"}</span></div>
        <div className="bos-readiness-gates">
          <div className={tasksGate?"is-pass":""}><span>01</span><strong>Wszystkie czynności</strong><b>{tasksGate?"TAK":"NIE"}</b></div>
          <div className={criticalGate?"is-pass":""}><span>02</span><strong>Wszystkie K: SAM + SPRAWDŹ</strong><b>{criticalGate?"TAK":"NIE"}</b></div>
          <div className={readinessGate?"is-pass":""}><span>03</span><strong>Kryteria gotowości</strong><b>{readinessGate?"✓":"NIE"}</b></div>
          <div className={readyForDecision?"is-pass":""}><span>04</span><strong>Gotowe do decyzji człowieka</strong><b>{readyForDecision?"TAK":"NIE"}</b></div>
        </div>
        <aside className="bos-context-guide"><strong>4×TAK · TEST JAKOŚCI KRYTERIUM</strong><p>Przed potwierdzeniem sprawdź: czy rezultat jest obserwowalny? Czy da się go sprawdzić w realnej pracy? Czy dwie osoby powinny dojść do podobnej oceny? Czy kryteria obejmują wszystkie czynności K? To kontrola jakości oceny — nie automatyczna decyzja o pracowniku.</p></aside>
        <div className="bos-readiness-list">{version.readinessCriteria.map(c=>{const check=process.readinessChecks.find(x=>x.criterionId===c.id);const passed=Boolean(check?.isPassed);return <article key={c.id} id={`readiness-${c.id}`}>
          <div><span>{String(c.order).padStart(2,"0")} · {({OBSERVATION:"OBSERWACJA",INDEPENDENT_TASK:"SAMODZIELNE ZADANIE",WORK_SAMPLE:"PRÓBKA PRACY",CONTROL_QUESTIONS:"PYTANIA KONTROLNE",KNOWLEDGE_TEST:"TEST WIEDZY",OTHER:"INNA"} as Record<string,string>)[c.verificationMethod]??c.verificationMethod}</span><strong>{c.criterion}</strong>{c.verificationMethodOther&&<p>{c.verificationMethodOther}</p>}{passed&&<><small>Potwierdził: {check?.checkedBy||"—"} · {shortDate(check?.checkedAt)}</small>{check?.note&&<p className="bos-readiness-evidence"><b>Zapisany fakt:</b> {check.note}</p>}</>}</div>
          <GateConfirmation kind="readiness" processId={process.id} itemId={c.id} label="Spełnienie ocenione — zapisz potwierdzenie" done={passed} disabled={!tasksGate||!criticalGate} blockedReason="Najpierw ukończ wszystkie czynności oraz SAM + SPRAWDŹ dla wszystkich K." note action={saveReadinessResult}/>
        </article>})}</div>
      </section>

      <aside className="bos-context-guide"><strong>WSKAZÓWKA BOS · PRZEKAZANIE</strong><p>Przy przekazaniu procesu następna osoba powinna oprzeć się na zapisanych etapach, datach i faktach. Nie zaczynaj wdrożenia od początku tylko dlatego, że zmienił się prowadzący.</p></aside>
      <section className="bos-process-next">
        <div>
          <span className="bos-dashboard-section-kicker">NASTĘPNY KROK</span>
          <strong>{readyForDecision ? "Warunki oceny spełnione — przejdź do decyzji" : progress.percent===100 ? "Czynności ukończone — potwierdź kryteria gotowości" : "Dokończ pięć etapów BOS dla wymaganych czynności"}</strong>
          <p>100% czynności nie oznacza automatycznie GOTOWY. Przed decyzją sprawdź czynności K oraz końcowe kryteria gotowości. Decyzję podejmuje człowiek.</p>
        </div>
        <div className="bos-process-next-action">
          <span>{progress.percent}%</span>
          <Link className={`bos-decision-cta ${readyForDecision?"is-ready":""}`} href={`/app/onboarding/processes/${process.id}/close`}>{readyForDecision ? "PRZEJDŹ DO DECYZJI →" : "JESZCZE NIE / STOP →"}</Link>
        </div>
      </section>
    </>
  );
}
