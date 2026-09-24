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
        <div className="bos-public-hero__marker" aria-hidden="true">
          <span>SCROLL</span><i />
        </div>
      </div>
    </section>
  );
}
