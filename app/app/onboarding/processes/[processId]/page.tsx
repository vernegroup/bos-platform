export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { confirmTaskStage, getProcess, getProcessProgress, getStandard, type OnboardingTaskStage } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

async function confirmStage(formData: FormData) {
  "use server";
  const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const standardTaskId=String(formData.get("standardTaskId")??""); const stage=String(formData.get("stage")??"") as OnboardingTaskStage;
  if(!["EXPLAINED","SHOWN","TOGETHER","SOLO","CHECKED"].includes(stage)) throw new Error("Nieprawidłowy etap BOS.");
  await confirmTaskStage({organizationId:access.organization.id,processId,standardTaskId,stage,userId:access.user.id}); redirect(`/app/onboarding/processes/${processId}`);
}
const stageLabels=[["EXPLAINED","WYJAŚNIJ"],["SHOWN","POKAŻ"],["TOGETHER","RAZEM"],["SOLO","SAM"],["CHECKED","SPRAWDŹ"]] as const;

export default async function ProcessDetailPage({ params }: { params: Promise<{ processId: string }> }) {
  const access = await requireBOSAccess();
  const { processId } = await params;
  const process = await getProcess(processId, access.organization.id);
  if (!process) notFound();

  const standard = await getStandard(process.standardId, access.organization.id);
  const version = standard?.versions.find((item) => item.version === process.standardVersion);
  if (!standard || !version) notFound();

  const progress = getProcessProgress(process);
  const criticalTasks=version.tasks.filter(task=>task.isCritical);
  const criticalCompleted=criticalTasks.filter(task=>Boolean(process.tasks.find(item=>item.standardTaskId===task.id)?.completedAt)).length;

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

      <section className="bos-process-card">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">REALIZACJA</span><h2>Karta Postępu</h2></div>
          <span className="bos-dashboard-count">{progress.completed} z {progress.total} czynności gotowych</span>
        </div>

        <div className="bos-process-task-head">
          <span>LP.</span><span>CZYNNOŚĆ ZE STANDARDU</span><span>CO SPRAWDZIĆ</span><span>POSTĘP BOS</span>
        </div>
        {version.tasks.map((task) => {
          const state = process.tasks.find((item: { standardTaskId: string }) => item.standardTaskId === task.id);
          if (!state) return null;
          return (
            <article className="bos-process-task-row" key={task.id}>
              <span>{String(task.order).padStart(2, "0")}{task.isCritical ? " · K" : ""}</span>
              <div><strong>{task.name}</strong><p>{task.execution}</p>{task.hint&&<small>WSKAZÓWKA: {task.hint}</small>}</div>
              <p>{task.readyWhen}</p>
              <div className="bos-process-stage-flow" aria-label={`Etapy BOS dla: ${task.name}`}>
                {stageLabels.map(([stage,label],stageIndex)=>{ const keys=["explainedAt","shownAt","togetherAt","soloAt","checkedAt"] as const; const done=Boolean(state[keys[stageIndex]]); const previousDone=stageIndex===0||Boolean(state[keys[stageIndex-1]]);
                  return <form action={confirmStage} key={stage}><input type="hidden" name="processId" value={process.id}/><input type="hidden" name="standardTaskId" value={task.id}/><input type="hidden" name="stage" value={stage}/><button type="submit" className={done?"is-done":""} disabled={done||!previousDone} aria-pressed={done}>{label}{done?" ✓":""}</button></form>; })}
                {state.note&&<small className="bos-process-task-note">{state.note}</small>}
              </div>
            </article>
          );
        })}
      </section>

      <section className="bos-process-next">
        <div>
          <span className="bos-dashboard-section-kicker">NASTĘPNY KROK</span>
          <strong>{progress.percent === 100 ? "Czynności ukończone — przejdź do oceny gotowości" : "Dokończ pięć etapów BOS dla wymaganych czynności"}</strong>
          <p>100% czynności nie oznacza automatycznie GOTOWY. Przed decyzją sprawdź czynności K oraz końcowe kryteria gotowości. Decyzję podejmuje człowiek.</p>
        </div>
        <div className="bos-process-next-action">
          <span>{progress.percent}%</span>
          {progress.percent === 100 ? (
            <Link href={`/app/onboarding/processes/${process.id}/close`}>PRZEJDŹ DO WERYFIKACJI →</Link>
          ) : (
            <b>ZAMKNIĘCIE NIEDOSTĘPNE</b>
          )}
        </div>
      </section>
    </>
  );
}
