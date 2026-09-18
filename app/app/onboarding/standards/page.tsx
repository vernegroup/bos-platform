import Link from "next/link";
import { onboardingStandards } from "@/data/onboardingStandards";

export default function StandardsPage() {
  return (
    <>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / ONBOARDING / PRZYGOTUJ</div>
          <h1>Standardy stanowisk</h1>
          <p>
            Standard jest wzorcem pracy używanym później do prowadzenia
            konkretnych wdrożeń. Zmiana opublikowanego standardu tworzy nową wersję.
          </p>
        </div>
        <div className="bos-app-build-state"><span>DANE</span><strong>DEMO / LOKALNE</strong></div>
      </section>

      <div className="bos-standard-toolbar">
        <div><span>STANDARDY</span><strong>{onboardingStandards.length}</strong></div>
        <div><span>AKTYWNE</span><strong>{onboardingStandards.filter((item) => item.status === "AKTYWNY").length}</strong></div>
        <Link href="/app/onboarding/standards/new" className="bos-standard-primary-action">+ NOWY STANDARD</Link>
      </div>

      <section className="bos-standard-list" aria-label="Lista Standardów Stanowiska">
        <div className="bos-standard-list-head">
          <span>STANOWISKO</span><span>OBSZAR</span><span>WERSJA</span><span>CZYNNOŚCI</span><span>AKTUALIZACJA</span><span>STATUS</span><span />
        </div>
        {onboardingStandards.map((standard) => {
          const current = standard.versions.find((version) => version.version === standard.currentVersion)!;
          return (
            <Link href={`/app/onboarding/standards/${standard.id}`} className="bos-standard-list-row" key={standard.id}>
              <strong>{standard.name}</strong>
              <span>{standard.area}</span>
              <b>{standard.currentVersion}</b>
              <span>{current.tasks.length}</span>
              <span>{standard.updatedAt}</span>
              <em>{standard.status}</em>
              <i aria-hidden="true">→</i>
            </Link>
          );
        })}
      </section>

      <div className="bos-standard-footnote">
        <span>MODEL WERSJI</span>
        <p>Wdrożenie pozostaje powiązane z wersją standardu, na której zostało rozpoczęte. Nowa wersja nie nadpisuje historii wcześniejszych procesów.</p>
      </div>
    </>
  );
}
