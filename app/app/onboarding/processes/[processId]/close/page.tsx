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
    summary:String(formData.get("summary")??""),recommendations:String(formData.get("recommendations")??""),formalitiesConfirmed:formData.get("formalitiesConfirmed")==="on"});
  redirect(`/app/onboarding/closed/${closureId}`);
}

export default async function CloseProcessPage({params}:{params:Promise<{processId:string}>}) {
 const access=await requireBOSAccess(); const {processId}=await params; const process=await getProcess(processId,access.organization.id); if(!process) notFound();
 const standard=await getStandard(process.standardId,access.organization.id); const version=standard?.versions.find(v=>v.version===process.standardVersion); if(!standard||!version) notFound();
 const progress=getProcessProgress(process); const critical=version.tasks.filter(t=>t.isCritical); const criticalDone=critical.filter(t=>{const x=process.tasks.find(p=>p.standardTaskId===t.id);return x?.soloAt&&x?.checkedAt}).length;
 const readinessDone=version.readinessCriteria.filter(c=>process.readinessChecks.find(x=>x.criterionId===c.id)?.isPassed).length;
 const ready=progress.total>0&&progress.completed===progress.total&&criticalDone===critical.length&&version.readinessCriteria.length>0&&readinessDone===version.readinessCriteria.length;
 return <><div className="bos-standard-back"><Link href={`/app/onboarding/processes/${process.id}`}>← KARTA POSTĘPU</Link></div>
 <nav className="bos-guided-flow" aria-label="Etapy BOS Onboarding">
   <Link href="/app/onboarding/standards"><span>01</span><strong>PRZYGOTUJ</strong><small>Standard Stanowiska</small></Link>
   <Link href={`/app/onboarding/processes/${process.id}`}><span>02</span><strong>PRZEPROWADŹ</strong><small>Karta Postępu</small></Link>
   <Link href="/app/onboarding/closed" className="is-active"><span>03</span><strong>ZAMKNIJ</strong><small>Karta Zakończenia</small></Link>
 </nav>
 <section className="bos-app-intro"><div><div className="bos-app-kicker">BOS / ONBOARDING / ZAMKNIJ</div><h1>Decyzja końcowa</h1><p>{process.employee} · {standard.name} · Standard {process.standardVersion}</p></div><div className="bos-app-build-state"><span>BRAMKA GOTOWOŚCI</span><strong>{ready?"GOTOWY DO DECYZJI":"NIEPEŁNY"}</strong></div></section>
 <aside className="bos-guidance bos-guidance-primary"><div><span className="bos-guidance-eyebrow">TERAZ · ZAMKNIJ</span><strong>Sprawdź fakty przed decyzją</strong><p>Zamknięcie nie jest kolejnym etapem nauki. Porównujesz zapis wdrożenia z dokładnie tą wersją Standardu, z którą proces został rozpoczęty, a następnie podejmujesz decyzję jako człowiek.</p></div><details><summary>? Co sprawdza Readiness Gate</summary><p>System porządkuje trzy grupy dowodów: wszystkie wymagane czynności, wszystkie czynności K zakończone SAM + SPRAWDŹ oraz końcowe Kryteria Gotowości. Spełnienie warunków otwiera decyzję — nie podejmuje jej za managera.</p></details></aside>
 <section className="bos-close-gate bos-guided-close-gate">
   <div className={progress.total>0&&progress.completed===progress.total?"is-pass":""}><span>01</span><strong>Wszystkie wymagane czynności</strong><p>Każda czynność przeszła pełną ścieżkę do SPRAWDŹ.</p><b>{progress.completed===progress.total&&progress.total>0?"TAK":"NIE"} · {progress.completed}/{progress.total}</b></div>
   <div className={criticalDone===critical.length?"is-pass":""}><span>02</span><strong>Wszystkie K: SAM + SPRAWDŹ</strong><p>Czynności krytyczne mają dowód samodzielnego wykonania i sprawdzenia.</p><b>{criticalDone===critical.length?"TAK":"NIE"} · {criticalDone}/{critical.length}</b></div>
   <div className={version.readinessCriteria.length>0&&readinessDone===version.readinessCriteria.length?"is-pass":""}><span>03</span><strong>Kryteria Gotowości</strong><p>Końcowe kryteria roli zostały zweryfikowane w rzeczywistej pracy.</p><b>{version.readinessCriteria.length>0&&readinessDone===version.readinessCriteria.length?"TAK":"NIE"} · {readinessDone}/{version.readinessCriteria.length}</b></div>
   <div className={ready?"is-pass":""}><span>04</span><strong>Gotowe do decyzji człowieka</strong><p>Readiness Gate nie wydaje werdyktu. Potwierdza tylko kompletność podstawy decyzji.</p><b>{ready?"TAK":"NIE"}</b></div>
 </section>
 <aside className="bos-guidance"><div><span className="bos-guidance-eyebrow">DECYZJA</span><strong>Decyzja należy do człowieka</strong><p><b>GOTOWY</b> potwierdza zakończenie wdrożenia. <b>JESZCZE NIE</b> oznacza potrzebę dalszej pracy przy zachowaniu dotychczasowego postępu. <b>STOP</b> kończy proces bez potwierdzenia gotowości.</p></div><details><summary>? Czego system nie ocenia</summary><p>BOS nie ocenia „czy ktoś jest dobrym pracownikiem”. Porządkuje wykonanie czynności, dowody dla K i Kryteria Gotowości względem konkretnej wersji Standardu.</p></details></aside>
 <section className="bos-process-card"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">KARTA ZAKOŃCZENIA</span><h2>Wynik weryfikacji</h2></div></div>
 <form action={decide} className="bos-close-decision-form"><input type="hidden" name="processId" value={process.id}/>
 <aside className="bos-guidance bos-guidance-formalities"><div><span className="bos-guidance-eyebrow">PRZED ZAPISEM DECYZJI</span><strong>Formalności pozostają poza BOS</strong><p>Potwierdź tylko, że wymagane szkolenia BHP, badania, uprawnienia, instruktaże lub inne obowiązki zostały zweryfikowane w odpowiednim systemie albo dokumentacji.</p></div><details><summary>? Dlaczego osobne potwierdzenie</summary><p>BOS dokumentuje gotowość operacyjną według Standardu. Nie zastępuje prawnych ani branżowych procedur dopuszczenia do pracy.</p></details></aside>
 <label><span>POTWIERDZENIE FORMALNOŚCI</span><span><input type="checkbox" name="formalitiesConfirmed" required/> Potwierdzam, że wymagane formalności dotyczące dopuszczenia do pracy zostały zweryfikowane poza BOS.</span><small>Wymagane wyłącznie dla decyzji GOTOWY.</small></label>
 <label className="bos-close-guided-field"><span>PODSUMOWANIE FAKTÓW</span><small>Zapisz obserwowalne fakty będące podstawą decyzji. Nie opisuj cech osoby.</small><textarea name="summary" required maxLength={1200} placeholder="Np. Wszystkie czynności wykonane i sprawdzone; 2/2 K zaliczone; kryterium kompletacji bez braków potwierdzone w realnej pracy."/></label>
 <label className="bos-close-guided-field"><span>POWÓD / DALSZE DZIAŁANIE</span><small>Wymagane znaczeniowo dla JESZCZE NIE i STOP; przy GOTOWY możesz zapisać dalsze zalecenia operacyjne.</small><textarea name="recommendations" maxLength={1200} placeholder="Np. Powtórzyć czynność 04 na kolejnej zmianie i ponownie sprawdzić rezultat."/></label>
 <div className="bos-close-decision-guide"><strong>Wybierz decyzję</strong><p>{ready?"Readiness Gate jest kompletny. GOTOWY jest dostępne, ale decyzję nadal podejmuje człowiek.":"Readiness Gate jest niepełny. GOTOWY pozostaje zablokowane; możesz wybrać JESZCZE NIE, aby zachować postęp i wrócić do pracy, albo STOP, aby zakończyć proces bez potwierdzenia gotowości."}</p></div>
 <div className="bos-close-decisions bos-guided-decisions"><button name="decision" value="READY" disabled={!ready}><strong>GOTOWY</strong><span>{ready?"zakończ wdrożenie pozytywnie":"wymaga kompletnego Readiness Gate"}</span></button><button name="decision" value="NOT_YET" formNoValidate><strong>JESZCZE NIE</strong><span>zachowaj postęp i wróć do pracy</span></button><button name="decision" value="STOP" formNoValidate><strong>STOP</strong><span>zakończ bez potwierdzenia gotowości</span></button></div>
 </form></section></>;
}
