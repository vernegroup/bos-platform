export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { closeProcess, getProcess, getProcessProgress, getStandard } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";
import CloseDecisionForm, { type CloseDecisionState } from "./CloseDecisionForm";

async function decide(_state:CloseDecisionState,formData:FormData):Promise<CloseDecisionState> {
  "use server";
  const access=await requireBOSAccess();
  const processId=String(formData.get("processId")??"");
  const decision=String(formData.get("decision")??"") as "READY"|"NOT_YET"|"STOP";
  const summary=String(formData.get("summary")??"");
  const recommendations=String(formData.get("recommendations")??"");
  const formalitiesConfirmed=formData.get("formalitiesConfirmed")==="on";
  if(!["READY","NOT_YET","STOP"].includes(decision)) throw new Error("Nieprawidłowa decyzja.");
  if(decision==="READY"&&!formalitiesConfirmed) return {formalitiesError:true,summary,recommendations};
  const closureId=await closeProcess({organizationId:access.organization.id,processId,verifiedByUserId:access.user.id,decision,summary,recommendations,formalitiesConfirmed});
  redirect(`/app/onboarding/closed/${closureId}`);
}

export default async function CloseProcessPage({params}:{params:Promise<{processId:string}>}) {
 const access=await requireBOSAccess();
 const {processId}=await params;
 const process=await getProcess(processId,access.organization.id); if(!process) notFound();
 const standard=await getStandard(process.standardId,access.organization.id); const version=standard?.versions.find(v=>v.version===process.standardVersion); if(!standard||!version) notFound();
 const progress=getProcessProgress(process); const critical=version.tasks.filter(t=>t.isCritical); const criticalDone=critical.filter(t=>{const x=process.tasks.find(p=>p.standardTaskId===t.id);return x?.soloAt&&x?.checkedAt}).length;
 const readinessDone=version.readinessCriteria.filter(c=>process.readinessChecks.find(x=>x.criterionId===c.id)?.isPassed).length;
 const missingTasks=version.tasks.filter(t=>!process.tasks.find(p=>p.standardTaskId===t.id)?.checkedAt).map(t=>t.name);
 const missingCritical=critical.filter(t=>{const x=process.tasks.find(p=>p.standardTaskId===t.id);return !x?.soloAt||!x?.checkedAt}).map(t=>t.name);
 const missingReadiness=version.readinessCriteria.filter(c=>!process.readinessChecks.find(x=>x.criterionId===c.id)?.isPassed).map(c=>c.criterion);
 const ready=progress.total>0&&progress.completed===progress.total&&criticalDone===critical.length&&version.readinessCriteria.length>0&&readinessDone===version.readinessCriteria.length;
 return <><div className="bos-standard-back"><Link href={`/app/onboarding/processes/${process.id}`}>← KARTA POSTĘPU</Link></div>
 <nav className="bos-guided-flow" aria-label="Etapy BOS Onboarding">
   <Link href="/app/standards"><span>01</span><strong>PRZYGOTUJ</strong><small>Standard Stanowiska</small></Link>
   <Link href={`/app/onboarding/processes/${process.id}`}><span>02</span><strong>PRZEPROWADŹ</strong><small>Karta Postępu</small></Link>
   <Link href="/app/onboarding/closed" className="is-active"><span>03</span><strong>ZAMKNIJ</strong><small>Karta Zakończenia</small></Link>
 </nav>
 <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / WDROŻENIA / ZAMKNIJ</div><h1>Decyzja końcowa</h1><p>{process.employee} · {standard.name} · Standard {process.standardVersion}</p></div><div className="bos-app-build-state"><span>BRAMKA GOTOWOŚCI</span><strong>{ready?"GOTOWY DO DECYZJI":"NIEPEŁNY"}</strong></div></section>
 <aside className="bos-guidance bos-guidance-primary"><div><span className="bos-guidance-eyebrow">TERAZ · ZAMKNIJ</span><strong>Sprawdź fakty przed decyzją</strong><p>Zamknięcie nie jest kolejnym etapem nauki. Porównujesz zapis wdrożenia z dokładnie tą wersją Standardu, z którą proces został rozpoczęty, a następnie podejmujesz decyzję jako człowiek.</p></div><details><summary>? Co sprawdza Bramka Gotowości</summary><p>System porządkuje trzy grupy zapisanych potwierdzeń: wszystkie wymagane czynności, wszystkie czynności K zakończone SAM + SPRAWDŹ oraz końcowe Kryteria Gotowości. Spełnienie warunków otwiera decyzję — nie podejmuje jej za managera.</p></details></aside>
 <section className="bos-close-gate bos-guided-close-gate">
   <div className={progress.total>0&&progress.completed===progress.total?"is-pass":""}><span>01</span><strong>Wszystkie wymagane czynności</strong><p>Każda czynność przeszła pełną ścieżkę do SPRAWDŹ.</p><b>{progress.completed===progress.total&&progress.total>0?"TAK":"NIE"} · {progress.completed}/{progress.total}</b></div>
   <div className={criticalDone===critical.length?"is-pass":""}><span>02</span><strong>Wszystkie K: SAM + SPRAWDŹ</strong><p>Dla czynności krytycznych zapisano potwierdzenia etapów SAM i SPRAWDŹ.</p><b>{criticalDone===critical.length?"TAK":"NIE"} · {criticalDone}/{critical.length}</b></div>
   <div className={version.readinessCriteria.length>0&&readinessDone===version.readinessCriteria.length?"is-pass":""}><span>03</span><strong>Kryteria Gotowości</strong><p>Prowadzący zapisał ocenę końcowych kryteriów roli.</p><b>{version.readinessCriteria.length>0&&readinessDone===version.readinessCriteria.length?"TAK":"NIE"} · {readinessDone}/{version.readinessCriteria.length}</b></div>
   <div className={ready?"is-pass":""}><span>04</span><strong>Gotowe do decyzji człowieka</strong><p>Bramka Gotowości nie wydaje werdyktu. Potwierdza tylko kompletność podstawy decyzji.</p><b>{ready?"TAK":"NIE"}</b></div>
 </section>
 {!ready&&<section className="bos-process-card bos-ux3-closure-missing" aria-labelledby="ux3-missing-heading">
   <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">PRZED DECYZJĄ GOTOWY</span><h2 id="ux3-missing-heading">Co pozostało do udokumentowania?</h2></div></div>
   <p>BOS pokazuje brakujące potwierdzenia. Nie ocenia samodzielnie kompetencji pracownika.</p>
   {progress.total===0&&<p>Brak czynności w przypisanej wersji Standardu.</p>}
   {version.readinessCriteria.length===0&&<p>Brak kryteriów gotowości w przypisanej wersji Standardu.</p>}
   {missingTasks.length>0&&<div><strong>Czynności do ukończenia ({missingTasks.length})</strong><ul>{missingTasks.map((name,i)=><li key={i}>{name}</li>)}</ul></div>}
   {missingCritical.length>0&&<div><strong>Krytyczne: brak SAM lub SPRAWDŹ ({missingCritical.length})</strong><ul>{missingCritical.map((name,i)=><li key={i}>{name}</li>)}</ul></div>}
   {missingReadiness.length>0&&<div><strong>Kryteria do oceny ({missingReadiness.length})</strong><ul>{missingReadiness.map((name,i)=><li key={i}>{name}</li>)}</ul></div>}
   <Link href={`/app/onboarding/processes/${process.id}`}>← Wróć do Karty Postępu i uzupełnij braki</Link>
 </section>}
 <aside className="bos-guidance"><div><span className="bos-guidance-eyebrow">DECYZJA</span><strong>Decyzja należy do człowieka</strong><p><b>GOTOWY</b> potwierdza zakończenie wdrożenia. <b>JESZCZE NIE</b> oznacza potrzebę dalszej pracy przy zachowaniu dotychczasowego postępu. <b>STOP</b> kończy proces bez potwierdzenia gotowości.</p></div><details><summary>? Czego system nie ocenia</summary><p>BOS nie ocenia „czy ktoś jest dobrym pracownikiem”. Porządkuje zapisane potwierdzenia czynności, etapów K i Kryteriów Gotowości względem konkretnej wersji Standardu.</p></details></aside>
 <section className="bos-process-card"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">KARTA ZAKOŃCZENIA</span><h2>Wynik weryfikacji</h2></div></div>
 <CloseDecisionForm action={decide} processId={process.id} ready={ready}/></section></>;
}
