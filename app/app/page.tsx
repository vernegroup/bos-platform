export default function BOSAppPage() {
  return (
    <>
      <section className="bos-app-intro">
        <div>
          <div className="bos-app-kicker">BOS / PANEL KLIENTA</div>
          <h1>Środowisko operacyjne firmy</h1>
          <p>
            Szkielet aplikacji BOS. Na tym etapie interfejs nie korzysta z bazy
            danych, logowania ani prawdziwych danych klienta.
          </p>
        </div>

        <div className="bos-app-build-state">
          <span>ETAP</span>
          <strong>02 / APP SHELL</strong>
        </div>
      </section>

      <section className="bos-app-placeholder" id="produkty">
        <div className="bos-app-placeholder-heading">
          <span>OBSZAR ROBOCZY</span>
          <strong>Dashboard klienta powstanie w punkcie 3</strong>
        </div>

        <div className="bos-app-placeholder-grid">
          <div className="bos-app-placeholder-line">
            <span>Produkty</span>
            <span>miejsce na aktywne moduły BOS</span>
          </div>
          <div className="bos-app-placeholder-line" id="wyszukiwarka">
            <span>Aktywność</span>
            <span>miejsce na historię pracy i aktualizacje</span>
          </div>
          <div className="bos-app-placeholder-line" id="uzytkownicy">
            <span>Organizacja</span>
            <span>miejsce na użytkowników i dane firmy</span>
          </div>
        </div>
      </section>

      <div id="firma" className="bos-app-anchor" />
      <div id="aktualizacje" className="bos-app-anchor" />
      <div id="ustawienia" className="bos-app-anchor" />
    </>
  );
}
