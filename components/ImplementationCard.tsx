export default function ImplementationCard() {
  return (
    <a
      href="/implementation"
      className="bos-card-link"
      aria-label="Zapytaj o wdrożenie BOS"
    >
      <div className="bos-implementation-card">

        <div className="bos-implementation-card-label">
          REALIZACJA U CIEBIE
        </div>

        <h2 className="bos-implementation-card-title">
          Zostaw 
          <br />
          Kontakt
        </h2>

        <div className="bos-implementation-card-description">
          Pracujemy bezpośrednio z Twoją firmą, aby dopasować wybrane rozwiązanie BOS i pomóc wdrożyć je w codziennej pracy.
        </div>

        <div className="bos-implementation-card-button">

          <span>
            Wypełnij formularz
          </span>

          <span className="bos-arrow">
            →
          </span>

        </div>

      </div>
    </a>
  );
}