export default function PublicStory(){
  return (
    <section className="bos-public-story" aria-label="Jak działa BOS">
      <div className="bos-public-story__passage bos-public-story__passage--left">
        <span>SPOSÓB DZIAŁANIA</span>
        <h2>Wiedza przestaje<br/>być domysłem.</h2>
        <p>To, co dotąd zależało od pamięci i doświadczenia pojedynczych osób, staje się czytelnym sposobem pracy organizacji.</p>
      </div>

      <div className="bos-public-story__passage bos-public-story__passage--right">
        <span>POWTARZALNOŚĆ</span>
        <h2>Proces można<br/>wykonać ponownie.</h2>
        <p>Kolejne osoby nie zaczynają od zera. Firma zachowuje sposób działania i może świadomie go rozwijać.</p>
      </div>

      <div className="bos-public-story__passage bos-public-story__passage--center">
        <span>KONTROLA</span>
        <h2>Wiadomo, gdzie<br/>jest proces.</h2>
        <p>Stan, wymagane działania i kryterium zakończenia pozostają widoczne bez dokładania kolejnej warstwy chaosu.</p>
      </div>

      <div className="bos-public-story__closing">
        <p>BOS nie opisuje firmy z boku.</p>
        <h2>Staje się częścią<br/>jej działania.</h2>
        <a href="#produkty">ZOBACZ PRODUKTY <span aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}
