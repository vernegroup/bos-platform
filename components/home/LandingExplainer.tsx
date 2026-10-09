export default function LandingExplainer() {
  return (
    <section className="bos-land-explainer" aria-labelledby="bos-land-explainer-title">
      <div className="bos-land-explainer__inner">
        <div className="bos-land-explainer__heading">
          <span className="bos-land-explainer__eyebrow">BOS / JAK TO DZIAŁA</span>
          <h2 id="bos-land-explainer-title">Gotowy proces.<br /><em>Twoja firma.</em></h2>
          <p>Nie musisz projektować wszystkiego od początku. BOS dostarcza gotowy sposób prowadzenia konkretnego procesu w firmie — od pierwszego działania po jego zakończenie.</p>
        </div>
        <ol className="bos-land-explainer__steps">
          <li><span>01</span><div><h3>Wybierasz proces.</h3><p>Sięgasz po rozwiązanie dla konkretnego obszaru pracy.</p></div></li>
          <li><span>02</span><div><h3>Wprowadzasz dane swojej firmy.</h3><p>Dostosowujesz standard do stanowisk, osób i sposobu działania organizacji.</p></div></li>
          <li><span>03</span><div><h3>Zaczynasz go używać.</h3><p>Prowadzisz pracę według uporządkowanych etapów i zachowujesz jej przebieg.</p></div></li>
        </ol>
        <div className="bos-land-explainer__footer">
          <strong>To właśnie są Standardy Operacyjne Biznesu.</strong>
          <a href="#produkty">POZNAJ PRODUKTY <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
