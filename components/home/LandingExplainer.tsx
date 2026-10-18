export default function LandingExplainer() {
  return (
    <section className="bos-land-explainer" aria-labelledby="bos-land-explainer-title">
      <div className="bos-land-explainer__inner">
        <div className="bos-land-explainer__heading">
          <span className="bos-land-explainer__eyebrow">BOS / JAK TO DZIAŁA</span>
          <h2 id="bos-land-explainer-title">Gotowy proces.<br /><em>Twoja firma.</em></h2>
          <p>Wybierz Wdrożenia lub Awanse, przygotuj Standard stanowiska i przypisz pracownika. BOS wskazuje kolejne działania, brakujące potwierdzenia i warunki zakończenia procesu.</p>
        </div>
        <ol className="bos-land-explainer__steps">
          <li><span aria-hidden="true">›</span><div><h3>Wybierasz moduł i Standard.</h3><p>Wdrożenia dla nowej osoby albo Awanse dla pracownika zmieniającego rolę.</p></div></li>
          <li><span aria-hidden="true">›</span><div><h3>Określasz wymagania.</h3><p>Wskazujesz stanowisko, zadania, kryteria gotowości i osobę prowadzącą.</p></div></li>
          <li><span aria-hidden="true">›</span><div><h3>Prowadzisz i dokumentujesz.</h3><p>Potwierdzasz wykonanie działań, sprawdzasz warunki i zapisujesz wynik.</p></div></li>
        </ol>
        <div className="bos-land-explainer__footer">
          <strong>To właśnie są Standardy Operacyjne Biznesu.</strong>
          <a href="#produkty">POZNAJ PRODUKTY <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
