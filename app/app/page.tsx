import Link from "next/link";

const products = [
  {
    index: "01",
    name: "BOS Onboarding",
    description: "System wdrażania nowych pracowników",
    status: "AKTYWNY",
    metric: "3 wdrożenia",
    href: "/app/onboarding",
  },
  {
    index: "02",
    name: "BOS Promotions",
    description: "System awansów i zmian ról",
    status: "AKTYWNY",
    metric: "1 proces",
    href: "/app/promotions",
  },
];

const activity = [
  {
    date: "18.09",
    type: "STANDARD",
    title: "Zmieniono Standard Magazynier v1.2",
    context: "BOS Onboarding",
  },
  {
    date: "17.09",
    type: "WDROŻENIE",
    title: "Zakończono wdrożenie Anna Nowak",
    context: "BOS Onboarding",
  },
  {
    date: "16.09",
    type: "PROCES",
    title: "Rozpoczęto proces awansu",
    context: "BOS Promotions",
  },
  {
    date: "12.09",
    type: "AKTUALIZACJA",
    title: "BOS Onboarding został zaktualizowany",
    context: "System BOS",
  },
];

export default function BOSAppPage() {
  return (
    <>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / PANEL KLIENTA</div>
          <h1>Firma demonstracyjna</h1>
          <p>
            Produkty, bieżąca praca i ostatnia aktywność organizacji w jednym
            środowisku BOS.
          </p>
        </div>

        <div className="bos-app-build-state">
          <span>ŚRODOWISKO</span>
          <strong>DEMO / BEZ BAZY DANYCH</strong>
        </div>
      </section>

      <section className="bos-dashboard-section" id="produkty" aria-labelledby="products-title">
        <div className="bos-dashboard-section-head">
          <div>
            <span className="bos-dashboard-section-kicker">PRODUKTY</span>
            <h2 id="products-title">Aktywne moduły BOS</h2>
          </div>
          <span className="bos-dashboard-count">2 aktywne</span>
        </div>

        <div className="bos-dashboard-products">
          {products.map((product) => (
            <article className="bos-dashboard-product" key={product.name}>
              <div className="bos-dashboard-product-index">{product.index}</div>

              <div className="bos-dashboard-product-copy">
                <div className="bos-dashboard-product-topline">
                  <h3>{product.name}</h3>
                  <span className="bos-dashboard-status">{product.status}</span>
                </div>
                <p>{product.description}</p>
              </div>

              <div className="bos-dashboard-product-metric">
                <span>BIEŻĄCA PRACA</span>
                <strong>{product.metric}</strong>
              </div>

              <Link className="bos-dashboard-open" href={product.href}>
                OTWÓRZ
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bos-dashboard-grid">
        <div className="bos-dashboard-section bos-dashboard-activity">
          <div className="bos-dashboard-section-head">
            <div>
              <span className="bos-dashboard-section-kicker">AKTYWNOŚĆ</span>
              <h2>Ostatnie zmiany</h2>
            </div>
            <span className="bos-dashboard-count">ostatnie 7 dni</span>
          </div>

          <div className="bos-dashboard-activity-list">
            {activity.map((item) => (
              <div className="bos-dashboard-activity-row" key={`${item.date}-${item.title}`}>
                <time>{item.date}</time>
                <span className="bos-dashboard-activity-type">{item.type}</span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.context}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="bos-dashboard-side" aria-label="Podsumowanie organizacji">
          <div className="bos-dashboard-side-block">
            <span className="bos-dashboard-section-kicker">ORGANIZACJA</span>
            <strong>Firma demonstracyjna</strong>
            <dl>
              <div>
                <dt>Użytkownicy</dt>
                <dd>4</dd>
              </div>
              <div>
                <dt>Produkty</dt>
                <dd>2</dd>
              </div>
              <div>
                <dt>Licencje</dt>
                <dd>2 aktywne</dd>
              </div>
            </dl>
          </div>

          <div className="bos-dashboard-side-block" id="aktualizacje">
            <span className="bos-dashboard-section-kicker">BOS</span>
            <strong>Aktualizacje produktów</strong>
            <p>
              W przyszłości tutaj pojawią się informacje o nowych wersjach
              zakupionych modułów.
            </p>
          </div>
        </aside>
      </section>

      <div id="wyszukiwarka" className="bos-app-anchor" />
      <div id="uzytkownicy" className="bos-app-anchor" />
      <div id="firma" className="bos-app-anchor" />
      <div id="ustawienia" className="bos-app-anchor" />
    </>
  );
}
