export default function FeatureCards() {
  return (
    <section className="bos-feature-strip" aria-label="Informacje o BOS">
      <div className="bos-page-width">
        <div className="bos-feature-grid">
          <article className="bos-feature-card">
            <span className="bos-feature-number" aria-hidden="true">
              01
            </span>

            <div className="bos-feature-content">
              <h3 className="bos-feature-title">Dlaczego BOS?</h3>

              <p className="bos-feature-text">
                BOS porządkuje procesy, które w małych i średnich firmach
                często zależą od pamięci, doświadczenia i sposobu pracy
                konkretnej osoby. Rozwiązanie pozostaje w organizacji i może
                być używane ponownie.
              </p>
            </div>
          </article>

          <article className="bos-feature-card">
            <span className="bos-feature-number" aria-hidden="true">
              02
            </span>

            <div className="bos-feature-content">
              <h3 className="bos-feature-title">Dla kogo?</h3>

              <p className="bos-feature-text">
                Dla małych i średnich przedsiębiorstw, które chcą uporządkować
                powtarzalne działania bez budowania rozbudowanej struktury
                administracyjnej i bez projektowania całego procesu od zera.
              </p>
            </div>
          </article>

          <article className="bos-feature-card">
            <span className="bos-feature-number" aria-hidden="true">
              03
            </span>

            <div className="bos-feature-content">
              <h3 className="bos-feature-title">Co otrzymujesz?</h3>

              <p className="bos-feature-text">
                Gotowe narzędzie operacyjne wraz z dokumentami, formularzami i
                mechanizmami kontroli potrzebnymi do uruchomienia konkretnego
                procesu w firmie.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
