export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcess, getProcessProgress, getStandard } from "@/lib/bos/onboardingRepository";
import { requireBOSAccess } from "@/lib/bos/access";

export default async function ProcessDetailPage({ params }: { params: Promise<{ processId: string }> }) {
  const access = await requireBOSAccess();
  const { processId } = await params;
  const process = await getProcess(processId, access.organization.id);
  if (!process) notFound();

  const standard = await getStandard(process.standardId, access.organization.id);
  const version = standard?.versions.find((item) => item.version === process.standardVersion);
  if (!standard || !version) notFound();

  const progress = getProcessProgress(process);

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
        <div><span>POSTĘP</span><strong>{progress.percent}%</strong></div>
        <div className="bos-process-summary-progress"><i style={{ width: `${progress.percent}%` }} /></div>
      </section>

      <section className="bos-process-card">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">REALIZACJA</span><h2>Karta Postępu</h2></div>
          <span className="bos-dashboard-count">{progress.completed} z {progress.total} czynności gotowych</span>
        </div>

        <div className="bos-process-task-head">
          <span>LP.</span><span>CZYNNOŚĆ ZE STANDARDU</span><span>KRYTERIUM GOTOWOŚCI</span><span>STATUS</span><span>UWAGA / DATA</span>
        </div>
        {version.tasks.map((task) => {
          const state = process.tasks.find((item: { standardTaskId: string }) => item.standardTaskId === task.id);
          if (!state) return null;
          return (
            <article className="bos-process-task-row" key={task.id}>
              <span>{String(task.order).padStart(2, "0")}</span>
              <div><strong>{task.name}</strong><p>{task.execution}</p></div>
              <p>{task.readyWhen}</p>
              <b data-status={state.status}>{state.status}</b>
              <span>{state.completedAt ?? state.note ?? "—"}</span>
            </article>
          );
        })}
      </section>

      <section className="bos-process-next">
        <div>
          <span className="bos-dashboard-section-kicker">NASTĘPNY KROK</span>
          <strong>{progress.percent === 100 ? "Proces gotowy do zamknięcia" : "Dokończ czynności i potwierdź kryteria gotowości"}</strong>
          <p>Karta Zakończenia powstaje dopiero po potwierdzeniu wykonania wszystkich wymaganych czynności i ich kryteriów gotowości.</p>
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
