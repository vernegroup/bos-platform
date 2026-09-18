import Link from "next/link";
import { onboardingProcesses, getProcessProgress } from "@/data/onboardingProcesses";
import { onboardingStandards } from "@/data/onboardingStandards";

export default function ProcessesPage() {
  return (
    <>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / ONBOARDING / PRZEPROWADŹ</div>
          <h1>Wdrożenia w toku</h1>
          <p>Każde wdrożenie jest realizacją konkretnej, niezmiennej wersji Standardu Stanowiska.</p>
        </div>
        <div className="bos-app-build-state"><span>DANE</span><strong>DEMO / LOKALNE</strong></div>
      </section>

      <div className="bos-standard-toolbar">
        <div><span>W TOKU</span><strong>{onboardingProcesses.length}</strong></div>
        <div><span>STANDARDY W UŻYCIU</span><strong>{new Set(onboardingProcesses.map((item) => item.standardId)).size}</strong></div>
        <Link href="/app/onboarding/processes/new" className="bos-standard-primary-action">+ NOWE WDROŻENIE</Link>
      </div>

      <section className="bos-process-list" aria-label="Wdrożenia w toku">
        <div className="bos-process-list-head">
          <span>PRACOWNIK</span><span>STANDARD</span><span>WERSJA</span><span>START</span><span>CEL</span><span>POSTĘP</span><span />
        </div>
        {onboardingProcesses.map((process) => {
          const standard = onboardingStandards.find((item) => item.id === process.standardId)!;
          const progress = getProcessProgress(process);
          return (
            <Link href={`/app/onboarding/processes/${process.id}`} className="bos-process-list-row" key={process.id}>
              <strong>{process.employee}</strong>
              <span>{standard.name}</span>
              <b>{process.standardVersion}</b>
              <span>{process.startedAt}</span>
              <span>{process.targetDate}</span>
              <div className="bos-process-list-progress">
                <div><i style={{ width: `${progress.percent}%` }} /></div>
                <em>{progress.completed}/{progress.total} · {progress.percent}%</em>
              </div>
              <i aria-hidden="true">→</i>
            </Link>
          );
        })}
      </section>

      <div className="bos-standard-footnote">
        <span>POWIĄZANIE</span>
        <p>Proces nie korzysta automatycznie z najnowszej wersji standardu. Zachowuje wersję wybraną w chwili rozpoczęcia wdrożenia, dzięki czemu historia wykonania pozostaje jednoznaczna.</p>
      </div>
    </>
  );
}
