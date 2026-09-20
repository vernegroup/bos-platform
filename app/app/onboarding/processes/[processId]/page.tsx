export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { confirmReadinessCriterion, confirmStartRequirement, confirmTaskStage, getProcess, getProcessProgress, getStandard, updateTaskNote, type OnboardingTaskStage } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

async function confirmStage(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const standardTaskId=String(formData.get("standardTaskId")??""); const stage=String(formData.get("stage")??"") as OnboardingTaskStage;
  if(!["EXPLAINED","SHOWN","TOGETHER","SOLO","CHECKED"].includes(stage)) throw new Error("Nieprawidłowy etap BOS.");
  await confirmTaskStage({organizationId:access.organization.id,processId,standardTaskId,stage,userId:access.user.id}); redirect(`/app/onboarding/processes/${processId}`);
}
async function confirmStart(formData:FormData) {
  "use server";
  const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const requirementId=String(formData.get("requirementId")??"");
  await confirmStartRequirement({organizationId:access.organization.id,processId,requirementId,userId:access.user.id}); redirect(`/app/onboarding/processes/${processId}`);
}
async function saveNote(formData:FormData) {
  "use server";
  const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const standardTaskId=String(formData.get("standardTaskId")??""); const note=String(formData.get("note")??"");
  await updateTaskNote({organizationId:access.organization.id,processId,standardTaskId,note,userId:access.user.id}); redirect(`/app/onboarding/processes/${processId}`);
}
async function confirmReadiness(formData:FormData) {
  "use server"; const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const criterionId=String(formData.get("criterionId")??""); const note=String(formData.get("note")??"");
  await confirmReadinessCriterion({organizationId:access.organization.id,processId,criterionId,userId:access.user.id,note}); redirect(`/app/onboarding/processes/${processId}`);
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

  return (
    <>
      <div className="bos-standard-back"><Link href="/app/onboarding/processes">← WDROŻENIA W TOKU</Link></div>

      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / ONBOARDING / KARTA POSTĘPU</div>
          <h1>{process.employee}</h1>
          <p>{standard.name} · Standard {process.standardVersion} · prowadzący: {process.owner}</p>
        </div>
        <div className="bos-app-build-state"><span>STATUS</span><strong>{process.status}</strong></div>
      </section>

      <section className="bos-process-summary">
        <div><span>STANDARD</span><Link href={`/app/onboarding/standards/${standard.id}`}>{standard.name} {process.standardVersion} ↗</Link></div>
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
            <span>{String(req.order).padStart(2,"0")}</span><div><strong>{req.requirement}</strong><small>{req.category}</small></div>
            <form action={confirmStart}><input type="hidden" name="processId" value={process.id}/><input type="hidden" name="requirementId" value={req.id}/><button className={done?"is-done":""} disabled={done}>{done?"POTWIERDZONE ✓":"POTWIERDŹ"}</button></form>
          </div>})}</div>}
        {!startComplete&&<div className="bos-operational-empty"><strong>Realizacja jeszcze zablokowana</strong><p>Potwierdź wszystkie warunki rozpoczęcia. Dopiero wtedy proces przejdzie z PLANOWANE do W TOKU i odblokuje etapy BOS.</p></div>}
      </section>

      <section className="bos-process-card">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">REALIZACJA</span><h2>Karta Postępu</h2></div>
          <span className="bos-dashboard-count">{progress.completed} z {progress.total} czynności gotowych</span>
        </div>

        <aside className="bos-context-guide"><strong>WSKAZÓWKA BOS · 5 ETAPÓW</strong><p>WYJAŚNIJ — omów. POKAŻ — zademonstruj. RAZEM — wykonajcie wspólnie. SAM — pracownik wykonuje bez pomocy. SPRAWDŹ — oceń rezultat według warunku zaliczenia. Deklaracja „wiem” nie zastępuje SAM.</p></aside>
        <div className="bos-process-task-head">
          <span>LP.</span><span>CZYNNOŚĆ ZE STANDARDU</span><span>CO SPRAWDZIĆ</span><span>POSTĘP BOS</span>
        </div>
        {version.tasks.map((task) => {
          const state = process.tasks.find((item: { standardTaskId: string }) => item.standardTaskId === task.id);
          if (!state) return null;
          return (
            <article className="bos-process-task-row" key={task.id}>
              <span>{String(task.order).padStart(2, "0")}{task.isCritical ? " · K" : ""}</span>
              <div><strong>{task.name}</strong><p>{task.execution}</p>{task.isCritical&&<small className="bos-context-inline">K — błąd w tej czynności może mieć poważne konsekwencje. K nie oznacza po prostu „ważne”.</small>}{task.hint&&<small>WSKAZÓWKA: {task.hint}</small>}</div>
              <p>{task.readyWhen}</p>
              <div className="bos-process-stage-flow" aria-label={`Etapy BOS dla: ${task.name}`}>
                {stageLabels.map(([stage,label,key,actorKey],stageIndex)=>{ const done=Boolean(state[key]); const previousKey=stageIndex>0?stageLabels[stageIndex-1][2]:null; const previousDone=stageIndex===0||Boolean(previousKey&&state[previousKey]);
                  return <div className="bos-process-stage" key={stage}><form action={confirmStage}><input type="hidden" name="processId" value={process.id}/><input type="hidden" name="standardTaskId" value={task.id}/><input type="hidden" name="stage" value={stage}/><button type="submit" className={done?"is-done":""} disabled={done||!previousDone||!startComplete} aria-pressed={done}>{label}{done?" ✓":""}</button></form>{done&&<small>{shortDate(state[key])} · {state[actorKey]||"—"}</small>}</div>; })}
                <form action={saveNote} className="bos-process-note-form"><input type="hidden" name="processId" value={process.id}/><input type="hidden" name="standardTaskId" value={task.id}/><label><span>NOTATKA FAKTOGRAFICZNA</span><textarea name="note" maxLength={500} defaultValue={state.note||""} placeholder="Np. Dwukrotnie wybrał zły kod produktu — wrócić do listy kodów."/></label><div><small>Zapisz fakt lub działanie do powtórzenia, nie ocenę osoby. Błąd nie kasuje wcześniejszych etapów — popraw, powtórz i sprawdź ponownie.</small><button type="submit">ZAPISZ NOTATKĘ</button></div></form>
              </div>
            </article>
          );
        })}
      </section>

      <section className="bos-process-card">
        <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">OCENA GOTOWOŚCI</span><h2>Readiness Gate</h2></div><span className="bos-dashboard-count">{readinessPassed}/{version.readinessCriteria.length} kryteriów</span></div>
        <div className="bos-readiness-gates">
          <div className={tasksGate?"is-pass":""}><span>01</span><strong>Wszystkie czynności</strong><b>{tasksGate?"TAK":"NIE"}</b></div>
          <div className={criticalGate?"is-pass":""}><span>02</span><strong>Wszystkie K: SAM + SPRAWDŹ</strong><b>{criticalGate?"TAK":"NIE"}</b></div>
          <div className={readinessGate?"is-pass":""}><span>03</span><strong>Kryteria gotowości</strong><b>{readinessGate?"TAK":"NIE"}</b></div>
          <div className={readyForDecision?"is-pass":""}><span>04</span><strong>Gotowe do decyzji człowieka</strong><b>{readyForDecision?"TAK":"NIE"}</b></div>
        </div>
        <aside className="bos-context-guide"><strong>4×TAK · TEST JAKOŚCI KRYTERIUM</strong><p>Przed potwierdzeniem sprawdź: czy rezultat jest obserwowalny? Czy da się go sprawdzić w realnej pracy? Czy dwie osoby powinny dojść do podobnej oceny? Czy kryteria obejmują wszystkie czynności K? To kontrola jakości oceny — nie automatyczna decyzja o pracowniku.</p></aside>
        <div className="bos-readiness-list">{version.readinessCriteria.map(c=>{const check=process.readinessChecks.find(x=>x.criterionId===c.id);const passed=Boolean(check?.isPassed);return <article key={c.id}>
          <div><span>{String(c.order).padStart(2,"0")} · {c.verificationMethod}</span><strong>{c.criterion}</strong>{c.verificationMethodOther&&<p>{c.verificationMethodOther}</p>}{passed&&<small>Potwierdził: {check?.checkedBy||"—"} · {shortDate(check?.checkedAt)}</small>}</div>
          {passed?<b className="bos-readiness-pass">POTWIERDZONE ✓</b>:<form action={confirmReadiness}><input type="hidden" name="processId" value={process.id}/><input type="hidden" name="criterionId" value={c.id}/><input name="note" maxLength={500} placeholder="Fakt z weryfikacji (opcjonalnie)"/><button disabled={!tasksGate||!criticalGate}>POTWIERDŹ KRYTERIUM</button></form>}
        </article>})}</div>
      </section>

      <aside className="bos-context-guide"><strong>WSKAZÓWKA BOS · HANDOVER</strong><p>Przy przekazaniu procesu następna osoba powinna oprzeć się na zapisanych etapach, datach i faktach. Nie zaczynaj wdrożenia od początku tylko dlatego, że zmienił się prowadzący.</p></aside>
      <section className="bos-process-next">
        <div>
          <span className="bos-dashboard-section-kicker">NASTĘPNY KROK</span>
          <strong>{readyForDecision ? "Warunki oceny spełnione — przejdź do decyzji" : progress.percent===100 ? "Czynności ukończone — potwierdź kryteria gotowości" : "Dokończ pięć etapów BOS dla wymaganych czynności"}</strong>
          <p>100% czynności nie oznacza automatycznie GOTOWY. Przed decyzją sprawdź czynności K oraz końcowe kryteria gotowości. Decyzję podejmuje człowiek.</p>
        </div>
        <div className="bos-process-next-action">
          <span>{progress.percent}%</span>
          {readyForDecision ? (
            <Link href={`/app/onboarding/processes/${process.id}/close`}>PRZEJDŹ DO DECYZJI →</Link>
          ) : (
            <b>ZAMKNIĘCIE NIEDOSTĘPNE</b>
          )}
        </div>
      </section>
    </>
  );
}
