export default function BOSAppLoading() {
  return (
    <section className="bos-system-state bos-system-loading" aria-live="polite" aria-busy="true">
      <span className="bos-system-state-kicker">BOS / ŁADOWANIE</span>
      <h1>Przygotowujemy środowisko pracy</h1>
      <p>Pobieramy dane organizacji, licencje i bieżący stan procesów.</p>
      <div className="bos-system-loading-lines" aria-hidden="true">
        <i /><i /><i />
      </div>
    </section>
  );
}
