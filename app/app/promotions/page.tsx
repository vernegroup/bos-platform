import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listPromotionClosures, listPromotionProcesses } from "@/lib/bos/promotionsRepository";

export const dynamic = "force-dynamic";

export default async function PromotionsEntryPage() {
  const access = await requireBOSAccess();
  const [active, closed] = await Promise.all([
    listPromotionProcesses(access),
    listPromotionClosures(access),
  ]);
  const completedChecks = active.reduce((sum, process) => sum + process.done, 0);
  const totalChecks = active.reduce((sum, process) => sum + process.total, 0);
  const readiness = totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0;
  const recommendations = closed.filter((item) => item.result !== "COMPLETED").length;

  return (
    <>
      <section className="bos-app-intro bos-promotions-intro">
        <div>
          <div className="bos-app-kicker">BOS / PROMOTIONS</div>
          <h1>BOS Promotions</h1>
          <p>Awans lub przesunięcie poziome prowadzone od decyzji, przez przygotowanie i przejście, do weryfikacji oraz trwałego zapisu wyniku.</p>
        </div>
        <div className="bos-app-build-state"><span>PRODUKT</span><strong>WEB 1.0 / DANE ORGANIZACJI</strong></div>
      </section>

      <section className="bos-promotions-commandbar" aria-label="Stan procesów Promotions">
        <div><span>W TOKU</span><strong>{active.length}</strong></div>
        <div><span>GOTOWOŚĆ KONTROLI</span><strong>{readiness}%</strong></div>
        <div><span>ZAMKNIĘTE</span><strong>{closed.length}</strong></div>
        <div><span>Z ZALECENIAMI</span><strong>{recommendations}</strong></div>
      </section>

      <section className="bos-promotions-path">
        <div className="bos-dashboard-section-head">
          <div><span className="bos-dashboard-section-kicker">MECHANIZM</span><h2>Pięć bramek zmiany stanowiska</h2></div>
          <span className="bos-dashboard-count">decyzja → zapis historii</span>
        </div>
        <div className="bos-promotions-gates">
          {[
            ["01", "Decyzja", "Zakres i typ zmiany"],
            ["02", "Przygotowanie", "Warunki wejścia"],
            ["03", "Przejście", "Realizacja zmiany"],
            ["04", "Weryfikacja", "Kryteria gotowości"],
            ["05", "Zapis", "Wynik i historia"],
          ].map(([number, name, description]) => (
            <div key={number}>
              <span>{number}</span>
              <strong>{name}</strong>
              <small>{description}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="bos-promotions-work-grid">
        <div className="bos-promotions-work">
          <div className="bos-dashboard-section-head">
            <div><span className="bos-dashboard-section-kicker">PRZEPROWADŹ</span><h2>Zmiany w toku</h2></div>
            <Link href="/app/promotions/processes" className="bos-onboarding-text-link">WSZYSTKIE →</Link>
          </div>
          <div className="bos-promotions-preview-list">
            {active.slice(0, 5).map((process) => {
              const percent = process.total ? Math.round((process.done / process.total) * 100) : 0;
              return (
                <Link href={`/app/promotions/processes/${process.id}`} key={process.id}>
                  <div><strong>{process.employee}</strong><span>{process.fromRole} → {process.toRole}</span></div>
                  <b>{process.type}</b>
                  <div className="bos-promotions-mini-progress"><i style={{ width: `${percent}%` }} /></div>
                  <em>{percent}%</em>
                </Link>
              );
            })}
            {!active.length && <p className="bos-global-search-empty">Brak aktywnych zmian stanowiska.</p>}
          </div>
        </div>

        <div className="bos-promotions-work">
          <div className="bos-dashboard-section-head">
            <div><span className="bos-dashboard-section-kicker">ZAMKNIJ</span><h2>Ostatnie wyniki</h2></div>
            <Link href="/app/promotions/closed" className="bos-onboarding-text-link">HISTORIA →</Link>
          </div>
          <div className="bos-promotions-preview-list bos-promotions-preview-history">
            {closed.slice(0, 5).map((closure) => (
              <Link href={`/app/promotions/closed/${closure.id}`} key={closure.id}>
                <time>{closure.verifiedAt}</time>
                <div><strong>{closure.employee}</strong><span>{closure.fromRole} → {closure.toRole}</span></div>
                <b>{closure.result === "COMPLETED" ? "ZAKOŃCZONE" : "Z ZALECENIAMI"}</b>
              </Link>
            ))}
            {!closed.length && <p className="bos-global-search-empty">Brak zamkniętych procesów.</p>}
          </div>
        </div>
      </section>
    </>
  );
}
