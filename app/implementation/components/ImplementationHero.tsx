import "../styles.css";

export default function ImplementationHero() {
  return (
    <section className="bos-hero">

      <div className="bos-hero-eyebrow">
        WDROŻENIE Z ZESPOŁEM BOS
      </div>

      <h1 className="bos-hero-title">
        WDROŻENIE W TWOJEJ FIRMIE
        <br />
        
      </h1>

      <p className="bos-hero-description">
        Przyjeżdżamy do Twojej firmy i pomagamy wdrożyć BOS w praktyce — od dopasowania rozwiązania do organizacji, przez przygotowanie zespołu, po uruchomienie go w codziennej pracy.
      </p>

      <div className="bos-hero-features">

        <div className="bos-feature">

          <div className="bos-feature-line" />

          <div className="bos-feature-content">

            <div className="bos-feature-title">
              BEZPOŚREDNIE PROWADZENIE WDROŻENIA
            </div>

            <div className="bos-feature-text">
              Proces prowadzony przez BOS od ustalenia zakresu po uruchomienie rozwiązania w codziennej pracy firmy.
            </div>

          </div>

        </div>

        <div className="bos-feature">

          <div className="bos-feature-line" />

          <div className="bos-feature-content">

            <div className="bos-feature-title">
              INDYWIDUALNY ZAKRES WDROŻENIA
            </div>

            <div className="bos-feature-text">
              Ustalamy zakres prac, sposób realizacji i potrzebne wsparcie odpowiednio do rozwiązania BOS oraz sposobu działania Twojej firmy.
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}