export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { closeProcess, getProcess, getProcessProgress, getStandard } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

async function decide(formData:FormData) {
  "use server"; const access=await requireBOSAccess(); const processId=String(formData.get("processId")??"");
  const decision=String(formData.get("decision")??"") as "READY"|"NOT_YET"|"STOP";
  if(!["READY","NOT_YET","STOP"].includes(decision)) throw new Error("Nieprawidłowa decyzja.");
  const closureId=await closeProcess({organizationId:access.organization.id,processId,verifiedByUserId:access.user.id,decision,
    summary:String(formData.get("summary")??""),recommendations:String(formData.get("recommendations")??"")});
  redirect(`/app/onboarding/closed/${closureId}`);
}

export default async function CloseProcessPage({params}:{params:Promise<{processId:string}>}) {
 const access=await requireBOSAccess(); const {processId}=await params; const process=await getProcess(processId,access.organization.id); if(!process) notFound();
 const standard=await getStandard(process.standardId,access.organization.id); const version=standard?.versions.find(v=>v.version===process.standardVersion); if(!standard||!version) notFound();
 const progress=getProcessProgress(process); const critical=version.tasks.filter(t=>t.isCritical); const criticalDone=critical.filter(t=>{const x=process.tasks.find(p=>p.standardTaskId===t.id);return x?.soloAt&&x?.checkedAt}).length;
 const readinessDone=version.readinessCriteria.filter(c=>process.readinessChecks.find(x=>x.criterionId===c.id)?.isPassed).length;
 const ready=progress.total>0&&progress.completed===progress.total&&criticalDone===critical.length&&version.readinessCriteria.length>0&&readinessDone===version.readinessCriteria.length;
 return <><div className="bos-standard-back"><Link href={`/app/onboarding/processes/${process.id}`}>← KARTA POSTĘPU</Link></div>
 <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / ONBOARDING / ZAMKNIJ</div><h1>Decyzja końcowa</h1><p>{process.employee} · {standard.name} · Standard {process.standardVersion}</p></div><div className="bos-app-build-state"><span>READINESS GATE</span><strong>{ready?"4× TAK":"NIEPEŁNY"}</strong></div></section>
 <section className="bos-close-gate"><div><span>01</span><strong>Czynności</strong><b>{progress.completed}/{progress.total}</b></div><div><span>02</span><strong>K: SAM + SPRAWDŹ</strong><b>{criticalDone}/{critical.length}</b></div><div><span>03</span><strong>Kryteria gotowości</strong><b>{readinessDone}/{version.readinessCriteria.length}</b></div><div><span>04</span><strong>Decyzja człowieka</strong><b>{ready?"DO PODJĘCIA":"ZABLOKOWANA"}</b></div></section>
 <aside className="bos-context-guide"><strong>DECYZJA NALEŻY DO CZŁOWIEKA</strong><p>Readiness Gate porządkuje fakty. Nie podejmuje decyzji automatycznie. GOTOWY kończy wdrożenie pozytywnie. JESZCZE NIE zachowuje dotychczasowy postęp i pozwala wrócić do procesu. STOP kończy proces bez potwierdzenia gotowości.</p></aside>
 <section className="bos-process-card"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">KARTA ZAKOŃCZENIA</span><h2>Wynik weryfikacji</h2></div></div>
 <form action={decide} className="bos-close-decision-form"><input type="hidden" name="processId" value={process.id}/>
 <label><span>PODSUMOWANIE FAKTÓW</span><textarea name="summary" required maxLength={1200} placeholder="Krótko opisz podstawę decyzji."/></label>
 <label><span>POWÓD / DALSZE DZIAŁANIE</span><textarea name="recommendations" maxLength={1200} placeholder="Wymagane dla JESZCZE NIE i STOP; opcjonalne dla GOTOWY."/></label>
 <div className="bos-close-decisions"><button name="decision" value="READY" disabled={!ready}>GOTOWY</button><button name="decision" value="NOT_YET" disabled={!ready}>JESZCZE NIE</button><button name="decision" value="STOP" disabled={!ready}>STOP</button></div>
 </form></section></>;
}
