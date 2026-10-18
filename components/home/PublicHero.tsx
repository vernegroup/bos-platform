"use client";

export default function PublicHero() {
  return (
    <section className="bos-public-hero bos-public-hero--wordmark" aria-labelledby="bos-home-title">
      <div className="bos-public-hero__sticky">
        <h1 id="bos-home-title" className="bos-public-wordmark">
          <span>STANDARDY</span>
          <em>OPERACYJNE</em>
          <span>BIZNESU</span>
        </h1>
        <div className="bos-land03-hero-copy">
          <p>BOS porządkuje wdrażanie pracowników i przygotowanie do nowych ról — od wymagań stanowiska do udokumentowanej decyzji o gotowości.</p>
          <div className="bos-land03-hero-actions"><a href="#demonstracja">ZOBACZ, JAK DZIAŁA <span aria-hidden="true">→</span></a><a href="#produkty">POZNAJ OFERTĘ</a></div>
        </div>
        <div className="bos-public-hero__marker" aria-hidden="true">
          <span>PRZEWIŃ</span><i />
        </div>
      </div>
    </section>
  );
}
