export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClosure, getStandard } from "@/lib/bos/onboardingRepository";

export default async function ClosureDetailPage({ params }: { params: Promise<{ closureId: string }> }) {
  const { closureId } = await params;
  const closure = await getClosure(closureId);
  if (!closure) notFound();
  const standard = await getStandard(closure.standardId);
  const version = standard?.versions.find((item) => item.version === closure.standardVersion);
  if (!standard || !version) notFound();
  const progress = closure.totalTasks ? Math.round((closure.completedTasks / closure.totalTasks) * 100) : 0;

  return (
    <>
      <div className="bos-standard-back"><Link href="/app/onboarding/closed">← ZAKOŃCZONE WDROŻENIA</Link></div>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / ONBOARDING / KARTA ZAKOŃCZENIA</div>
          <h1>{closure.employee}</h1>
          <p>{standard.name} · Standard {closure.standardVersion} · zamknięto {closure.closedAt}</p>
        </div>
        <div className="bos-app-build-state"><span>WYNIK</span><strong>{closure.result}</strong></div>
      </section>

      <section className="bos-closure-summary">
        <div><span>STANDARD</span><Link href={`/app/onboarding/standards/${standard.id}`}>{standard.name} {closure.standardVersion} ↗</Link></div>
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
        <div className="bos-closure-check-head"><span>LP.</span><span>CZYNNOŚĆ</span><span>KRYTERIUM GOTOWOŚCI</span><span>WERYFIKACJA</span></div>
        {version.tasks.map((task) => (
          <div className="bos-closure-check-row" key={task.id}>
            <span>{String(task.order).padStart(2, "0")}</span>
            <strong>{task.name}</strong>
            <p>{task.readyWhen}</p>
            <b>POTWIERDZONE</b>
          </div>
        ))}
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
    </>
  );
}
