import Link from "next/link";

const stages = [
  {
    index: "01",
    name: "Przygotuj",
    description: "Zbuduj i utrzymuj wzorzec pracy dla stanowiska.",
    object: "Standard Stanowiska",
    metric: "3 standardy",
    href: "/app/onboarding/standards",
  },
  {
    index: "02",
    name: "Przeprowadź",
    description: "Uruchom wdrożenie na podstawie wybranego standardu i kontroluj postęp.",
    object: "Karta Postępu",
    metric: "3 w toku",
    href: "/app/onboarding/processes",
  },
  {
    index: "03",
    name: "Zamknij",
    description: "Zweryfikuj rezultat i zachowaj zakończony proces w historii organizacji.",
    object: "Karta Zakończenia",
    metric: "12 zakończonych",
    href: "/app/onboarding/closed",
  },
];

const standards = [
  { name: "Magazynier", version: "v1.2", tasks: "18 czynności", status: "AKTYWNY" },
  { name: "Sprzedawca", version: "v1.0", tasks: "16 czynności", status: "AKTYWNY" },
  { name: "Produkcja", version: "v1.1", tasks: "14 czynności", status: "AKTYWNY" },
];

const processes = [
  { employee: "Anna Nowak", role: "Magazynier", version: "v1.2", progress: "78%", tasks: "14 / 18" },
  { employee: "Piotr Kowalski", role: "Sprzedawca", version: "v1.0", progress: "38%", tasks: "6 / 16" },
  { employee: "Marek Zieliński", role: "Produkcja", version: "v1.1", progress: "57%", tasks: "8 / 14" },
];

export default function OnboardingEntryPage() {
  return (
    <>
      <section className="bos-app-intro bos-onboarding-intro">
        <div>
          <div className="bos-app-kicker">BOS / ONBOARDING</div>
          <h1>BOS Onboarding</h1>
          <p>
            Proces wdrożenia prowadzony od przygotowanego wzorca stanowiska,
            przez realizację, do kontrolowanego zamknięcia.
          </p>
        </div>

        <div className="bos-app-build-state">
          <span>PRODUKT</span>
          <strong>DEMO / BEZ BAZY DANYCH</strong>
        </div>
      </section>

      <nav className="bos-onboarding-flow" aria-label="Etapy BOS Onboarding">
        {stages.map((stage) => (
          <Link className="bos-onboarding-flow-step" href={stage.href} key={stage.name}>
            <span className="bos-onboarding-flow-index">{stage.index}</span>
            <div className="bos-onboarding-flow-copy">
              <strong>{stage.name}</strong>
              <small>{stage.object}</small>
            </div>
            <span className="bos-onboarding-flow-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>

      <section className="bos-onboarding-stages" aria-labelledby="onboarding-process-title">
        <div className="bos-dashboard-section-head">
          <div>
            <span className="bos-dashboard-section-kicker">PROCES</span>
            <h2 id="onboarding-process-title">Trzy etapy pracy</h2>
          </div>
          <span className="bos-dashboard-count">wzorzec → realizacja → weryfikacja</span>
        </div>

        <div className="bos-onboarding-stage-list">
          {stages.map((stage) => (
            <article className="bos-onboarding-stage-row" key={stage.index}>
              <span className="bos-onboarding-stage-number">{stage.index}</span>
              <div>
                <h3>{stage.name}</h3>
                <p>{stage.description}</p>
              </div>
              <div className="bos-onboarding-stage-object">
                <span>OBIEKT ROBOCZY</span>
                <strong>{stage.object}</strong>
              </div>
              <div className="bos-onboarding-stage-metric">
                <span>STAN DEMO</span>
                <strong>{stage.metric}</strong>
              </div>
              <Link href={stage.href} className="bos-onboarding-stage-open">
                OTWÓRZ <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bos-onboarding-work-grid">
        <div className="bos-onboarding-work">
          <div className="bos-dashboard-section-head">
            <div>
              <span className="bos-dashboard-section-kicker">PRZYGOTUJ</span>
              <h2>Standardy stanowisk</h2>
            </div>
            <Link href="/app/onboarding/standards" className="bos-onboarding-text-link">
              WSZYSTKIE →
            </Link>
          </div>

          <div className="bos-onboarding-table">
            {standards.map((standard) => (
              <div className="bos-onboarding-table-row" key={standard.name}>
                <strong>{standard.name}</strong>
                <span>{standard.version}</span>
                <span>{standard.tasks}</span>
                <b>{standard.status}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="bos-onboarding-work">
          <div className="bos-dashboard-section-head">
            <div>
              <span className="bos-dashboard-section-kicker">PRZEPROWADŹ</span>
              <h2>Wdrożenia w toku</h2>
            </div>
            <Link href="/app/onboarding/processes" className="bos-onboarding-text-link">
              WSZYSTKIE →
            </Link>
          </div>

          <div className="bos-onboarding-process-list">
            {processes.map((process) => (
              <div className="bos-onboarding-process-row" key={process.employee}>
                <div>
                  <strong>{process.employee}</strong>
                  <span>{process.role} · Standard {process.version}</span>
                </div>
                <div className="bos-onboarding-progress" aria-label={`Postęp ${process.progress}`}>
                  <span style={{ width: process.progress }} />
                </div>
                <b>{process.tasks}</b>
                <em>{process.progress}</em>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bos-onboarding-close-summary">
        <div>
          <span className="bos-dashboard-section-kicker">ZAMKNIJ</span>
          <h2>Zakończone wdrożenia</h2>
          <p>
            Zamknięte procesy pozostają jako historia wykonania konkretnej
            wersji Standardu Stanowiska.
          </p>
        </div>
        <div className="bos-onboarding-close-number">
          <strong>12</strong>
          <span>ZAKOŃCZONYCH</span>
        </div>
        <Link href="/app/onboarding/closed" className="bos-onboarding-stage-open">
          HISTORIA <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}
