export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClosure, getClosureOutcome, getStandard, reopenProcess } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

async function reopen(formData:FormData) {
  "use server"; const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const closureId=String(formData.get("closureId")??"");
  await reopenProcess({organizationId:access.organization.id,processId,closureId,userId:access.user.id,reason:String(formData.get("reason")??"")}); redirect(`/app/onboarding/processes/${processId}`);
}
const mark=(value?:string|Date)=>value?"✓":"—";
const shortDate=(value?:string|Date)=>value?new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(value)):"—";

export default async function ClosureDetailPage({ params }: { params: Promise<{ closureId: string }> }) {
  const access=await requireBOSAccess(); const {closureId}=await params;
  const [closure,outcome]=await Promise.all([getClosure(closureId,access.organization.id),getClosureOutcome(closureId,access.organization.id)]);
  if(!closure||!outcome) notFound();
  const standard=await getStandard(closure.standardId,access.organization.id);
  const version=standard?.versions.find(item=>item.version===closure.standardVersion);
  if(!standard||!version) notFound();
  const resultClass=closure.result==="GOTOWY"?"is-ready":closure.result==="STOP"?"is-stop":"is-not-yet";
  const critical=version.tasks.filter(t=>t.isCritical);
  const criticalDone=critical.filter(t=>{const x=outcome.tasks.find(p=>p.standardTaskId===t.id);return x?.soloAt&&x?.checkedAt}).length;
  const readinessDone=version.readinessCriteria.filter(c=>outcome.readinessChecks.find(x=>x.criterionId===c.id)?.isPassed).length;

  return <>
    <div className="bos-standard-back"><Link href="/app/onboarding/closed">← ZAKOŃCZONE WDROŻENIA</Link></div>
    <section className="bos-outcome-shell">
      <header className="bos-outcome-head">
        <div><span>BOS · BUSINESS OPERATING STANDARDS</span><h1>KARTA ZAKOŃCZENIA WDROŻENIA</h1><p>PRZYGOTUJ → PRZEPROWADŹ → ZAMKNIJ</p></div>
        <div className={`bos-outcome-result ${resultClass}`}><span>DECYZJA</span><strong>{closure.result}</strong></div>
      </header>

      <section className="bos-outcome-meta">
        <div><span>PRACOWNIK</span><strong>{closure.employee}</strong></div>
        <div><span>STANOWISKO</span><strong>{outcome.position||standard.name}</strong></div>
        <div><span>STANDARD</span><strong>{standard.name}</strong></div>
        <div><span>WERSJA STANDARDU</span><strong>{closure.standardVersion}</strong></div>
        <div><span>DATA ROZPOCZĘCIA</span><strong>{closure.startedAt}</strong></div>
        <div><span>DATA DECYZJI</span><strong>{closure.closedAt}</strong></div>
        <div><span>OSOBA WDRAŻAJĄCA</span><strong>{closure.owner}</strong></div>
        <div><span>OSOBA OCENIAJĄCA</span><strong>{closure.verifiedBy}</strong></div>
      </section>

      <section className="bos-outcome-section">
        <div className="bos-outcome-title"><span>01</span><div><strong>KARTA POSTĘPU</strong><small>Przebieg według wersji Standardu użytej w tym wdrożeniu</small></div></div>
        <div className="bos-outcome-task-table">
          <div className="bos-outcome-task-head"><span>NR</span><span>CZYNNOŚĆ</span><span>WYJAŚNIJ</span><span>POKAŻ</span><span>RAZEM</span><span>SAM</span><span>SPRAWDŹ</span></div>
          {version.tasks.map(task=>{const x=outcome.tasks.find(t=>t.standardTaskId===task.id);return <div className="bos-outcome-task-row" key={task.id}>
            <span>{String(task.order).padStart(2,"0")}{task.isCritical?" · K":""}</span><strong>{task.name}</strong>
            <b>{mark(x?.explainedAt)}</b><b>{mark(x?.shownAt)}</b><b>{mark(x?.togetherAt)}</b>
            <b title={shortDate(x?.soloAt)}>{mark(x?.soloAt)}</b><b title={shortDate(x?.checkedAt)}>{mark(x?.checkedAt)}</b>
            {x?.note&&<small>{x.note}</small>}
          </div>})}
        </div>
        <div className="bos-outcome-facts"><span>WYMAGANE CZYNNOŚCI <b>{closure.completedTasks}/{closure.totalTasks} ✓</b></span><span>CZYNNOŚCI K <b>{criticalDone}/{critical.length} ✓</b></span></div>
      </section>

      <section className="bos-outcome-section">
        <div className="bos-outcome-title"><span>02</span><div><strong>KRYTERIA GOTOWOŚCI</strong><small>Wyniki końcowej weryfikacji</small></div></div>
        <div className="bos-outcome-readiness">
          {version.readinessCriteria.map(c=>{const x=outcome.readinessChecks.find(v=>v.criterionId===c.id);return <div key={c.id} className={x?.isPassed?"is-pass":""}><span>{x?.isPassed?"✓":"—"}</span><div><strong>{c.criterion}</strong><small>{c.verificationMethod}{x?.checkedAt?` · ${shortDate(x.checkedAt)}`:""}</small>{x?.note&&<p>{x.note}</p>}</div></div>})}
        </div>
        <div className="bos-outcome-facts"><span>KRYTERIA POTWIERDZONE <b>{readinessDone===version.readinessCriteria.length&&version.readinessCriteria.length>0?"✓":"—"}</b></span></div>
      </section>

      <section className="bos-outcome-section">
        <div className="bos-outcome-title"><span>03</span><div><strong>DECYZJA KOŃCOWA</strong><small>Wynik wewnętrznej oceny operacyjnej</small></div></div>
        <div className={`bos-outcome-decision ${resultClass}`}><span>WYNIK</span><strong>{closure.result}</strong><p>{closure.summary}</p></div>
        {closure.recommendations&&<div className="bos-outcome-followup"><span>{closure.result==="GOTOWY"?"ZALECENIE":"DALSZA PRACA / POWÓD"}</span><p>{closure.recommendations}</p></div>}
        <div className="bos-outcome-signoff"><div><span>OSOBA DOKONUJĄCA WEWNĘTRZNEJ OCENY</span><strong>{closure.verifiedBy}</strong></div><div><span>DATA</span><strong>{closure.closedAt}</strong></div></div>
      </section>

      <footer className="bos-outcome-footer"><p>Rekord historyczny. Karta zachowuje dokładną wersję Standardu użytą podczas wdrożenia. BOS dokumentuje wdrożenie operacyjne i nie zastępuje wymaganych szkoleń, badań, uprawnień ani formalności.</p><span>BOS ONBOARDING</span></footer>
    </section>

    <div className="bos-outcome-actions"><Link href={`/app/onboarding/employees/${closure.employeeId??""}`} aria-disabled={!closure.employeeId}>HISTORIA PRACOWNIKA →</Link><button type="button" className="bos-outcome-print" onClick={undefined}>POBIERZ / ZAPISZ PDF</button></div>
    <script dangerouslySetInnerHTML={{__html:`document.addEventListener("click",function(e){var b=e.target.closest(".bos-outcome-print");if(b){window.print();}})`}} />

    {closure.isLatest&&<section className="bos-process-card"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">HISTORIA DECYZJI</span><h2>Wznowienie procesu</h2></div><span className="bos-dashboard-count">DECYZJA #{closure.decisionSequence}</span></div>
      <p>Wznowienie nie usuwa tej Karty Zakończenia. Rekord pozostaje w historii, a proces wraca do pracy z zachowanym postępem.</p>
      <form action={reopen} className="bos-reopen-form"><input type="hidden" name="processId" value={closure.processId}/><input type="hidden" name="closureId" value={closure.id}/><input name="reason" required maxLength={500} placeholder="Powód wznowienia procesu"/><button type="submit">WZNÓW PROCES</button></form>
    </section>}
  </>;
}
