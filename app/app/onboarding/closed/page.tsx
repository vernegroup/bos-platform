import Link from "next/link";
import { onboardingClosures } from "@/data/onboardingClosures";
import { onboardingStandards } from "@/data/onboardingStandards";

export default function ClosedPage() {
  return (
    <>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / ONBOARDING / ZAMKNIJ</div>
          <h1>Zakończone wdrożenia</h1>
          <p>Historia wyników procesów. Każdy rekord zachowuje pracownika, użyty Standard Stanowiska, jego wersję oraz wynik weryfikacji.</p>
        </div>
        <div className="bos-app-build-state"><span>REKORDY</span><strong>DEMO / HISTORIA</strong></div>
      </section>

      <div className="bos-standard-toolbar">
        <div><span>ZAKOŃCZONE</span><strong>{onboardingClosures.length}</strong></div>
        <div><span>Z ZALECENIAMI</span><strong>{onboardingClosures.filter((item) => item.result === "ZAKOŃCZONE Z ZALECENIAMI").length}</strong></div>
        <Link href="/app/onboarding/processes" className="bos-onboarding-text-link">WDROŻENIA W TOKU →</Link>
      </div>

      <section className="bos-closure-list" aria-label="Historia zakończonych wdrożeń">
        <div className="bos-closure-list-head">
          <span>PRACOWNIK</span><span>STANDARD</span><span>WERSJA</span><span>START</span><span>ZAMKNIĘCIE</span><span>WYNIK</span><span />
        </div>
        {onboardingClosures.map((closure) => {
          const standard = onboardingStandards.find((item) => item.id === closure.standardId);
          return (
            <Link href={`/app/onboarding/closed/${closure.id}`} className="bos-closure-list-row" key={closure.id}>
              <strong>{closure.employee}</strong>
              <span>{standard?.name ?? closure.standardId}</span>
              <b>{closure.standardVersion}</b>
              <span>{closure.startedAt}</span>
              <span>{closure.closedAt}</span>
              <em data-result={closure.result}>{closure.result}</em>
              <i aria-hidden="true">→</i>
            </Link>
          );
        })}
      </section>

      <div className="bos-standard-footnote">
        <span>HISTORIA</span>
        <p>Zamknięcie nie usuwa Karty Postępu. Docelowy rekord przechowuje wynik procesu oraz odniesienie do dokładnej wersji standardu użytej podczas realizacji.</p>
      </div>
    </>
  );
}
