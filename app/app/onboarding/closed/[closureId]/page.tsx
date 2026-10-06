export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getClosure, getClosureOutcome, getStandard, reopenProcess } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

const verificationMethodLabel:Record<string,string>={OBSERVATION:"OBSERWACJA",INDEPENDENT_TASK:"SAMODZIELNE ZADANIE",WORK_SAMPLE:"PRÓBKA PRACY",CONTROL_QUESTIONS:"PYTANIA KONTROLNE",KNOWLEDGE_TEST:"TEST WIEDZY",OTHER:"INNA"};

async function reopen(formData:FormData) {
  "use server"; const access=await requireBOSAccess(); const processId=String(formData.get("processId")??""); const closureId=String(formData.get("closureId")??"");
  await reopenProcess({organizationId:access.organization.id,processId,closureId,userId:access.user.id,reason:String(formData.get("reason")??"")}); redirect(`/app/onboarding/processes/${processId}`);
}
export default async function ClosureDetailPage({ params }: { params: Promise<{ closureId: string }> }) {
  const access = await requireBOSAccess();
  const { closureId } = await params;
  const closure = await getClosure(closureId, access.organization.id);
  if (!closure) notFound();
  const [standard, outcome] = await Promise.all([getStandard(closure.standardId, access.organization.id), getClosureOutcome(closureId, access.organization.id)]);
  const version = standard?.versions.find((item) => item.version === closure.standardVersion);
  if (!standard || !version) notFound();
  const progress = closure.totalTasks ? Math.round((closure.completedTasks / closure.totalTasks) * 100) : 0;

  return (
    <>
      <div className="bos-standard-back"><Link href="/app/onboarding/closed">← ZAKOŃCZONE WDROŻENIA</Link></div>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / WDROŻENIA / KARTA ZAKOŃCZENIA</div>
          <h1>{closure.employee}</h1>
          <p>{standard.name} · Standard {closure.standardVersion} · zamknięto {closure.closedAt}</p>
        </div>
        <div className="bos-app-build-state"><span>WYNIK</span><strong>{closure.result}</strong></div>
      </section>

      <section className="bos-closure-summary">
        <div><span>STANDARD</span><Link href={`/app/standards/${standard.id}?version=${encodeURIComponent(closure.standardVersion)}`}>{standard.name} {closure.standardVersion} ↗</Link></div>
        <div><span>START</span><strong>{closure.startedAt}</strong></div>
        <div><span>ZAMKNIĘCIE</span><strong>{closure.closedAt}</strong></div>
        <div><span>PROWADZĄCY</span><strong>{closure.owner}</strong></div>
        <div><span>WERYFIKACJA</span><strong>{closure.verifiedBy}</strong></div>
      </section>

      <section className="bos-closure-result">
        <div>
          <span className="bos-dashboard-section-kicker">WERYFIKACJA</span>
          <h2>Karta Zakończenia</h2>
          <p>{closure.summary}</p>
        </div>
        <div className="bos-closure-result-number"><strong>{progress}%</strong><span>CZYNNOŚCI POTWIERDZONE</span></div>
        <div className="bos-closure-result-state"><span>WYNIK</span><strong>{closure.result}</strong></div>
      </section>

      <section className="bos-closure-checks">
        <div className="bos-closure-check-head"><span>LP.</span><span>CZYNNOŚĆ</span><span>CO SPRAWDZIĆ PRZY SPRAWDŹ</span><span>WERYFIKACJA</span></div>
        {version.tasks.map((task) => (
          <div className="bos-closure-check-row" key={task.id}>
            <span>{String(task.order).padStart(2, "0")}</span>
            <strong>{task.name}</strong>
            <p>{task.readyWhen}</p>
            <b>POTWIERDZONE</b>
          </div>
        ))}
      </section>

      <section className="bos-closure-readiness">
        <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">BRAMKA GOTOWOŚCI</span><h2>Końcowe kryteria roli</h2></div><span className="bos-dashboard-count">{version.readinessCriteria.length} kryteria</span></div>
        {version.readinessCriteria.map((criterion,index) => {
          const check=outcome?.readinessChecks.find((item)=>item.criterionId===criterion.id);
          return <div className="bos-closure-readiness-row" key={criterion.id}><span>{String(index+1).padStart(2,"0")}</span><div><strong>{criterion.criterion}</strong><p>{criterion.verificationMethodOther||verificationMethodLabel[criterion.verificationMethod]||criterion.verificationMethod}</p></div><b>{check?.isPassed?"POTWIERDZONE":"NIEPOTWIERDZONE"}</b></div>;
        })}
      </section>

      {closure.recommendations && (
        <section className="bos-closure-recommendation">
          <span>ZALECENIE PO ZAMKNIĘCIU</span><p>{closure.recommendations}</p>
        </section>
      )}

      <section className="bos-closure-record">
        <span className="bos-dashboard-section-kicker">REKORD HISTORYCZNY</span>
        <strong>{closure.employee} / {standard.name} / {closure.standardVersion}</strong>
        <p>Ten rekord reprezentuje zamknięty wynik procesu i nie powinien zmieniać się po publikacji kolejnych wersji Standardu Stanowiska.</p>
      </section>
      {closure.isLatest&&<section className="bos-process-card"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">HISTORIA DECYZJI</span><h2>Wznowienie procesu</h2></div><span className="bos-dashboard-count">DECYZJA #{closure.decisionSequence}</span></div>
        <p>Wznowienie nie usuwa tej Karty Zakończenia. Rekord pozostaje w historii, a proces wraca do pracy z zachowanym postępem.</p>
        <form action={reopen} className="bos-reopen-form"><input type="hidden" name="processId" value={closure.processId}/><input type="hidden" name="closureId" value={closure.id}/><input name="reason" required maxLength={500} placeholder="Powód wznowienia procesu"/><button type="submit">WZNÓW PROCES</button></form>
      </section>}
    </>
  );
}
