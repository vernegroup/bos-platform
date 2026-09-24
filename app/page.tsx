
import "./styles.css";
import "./product-stage.css";
import "./product-flow.css";
import "./navigation.css";
import "./footer.css";
import "./mobile.css";
import "./product-alignment.css";
import "./public-scene.css";
import "./public-hero.css";
import "./public-products.css";

import TopBar from "../components/TopBar";
import BottomBar from "../components/BottomBar";
import BOSSupport from "../components/BOSSupport/BOSSupport";
import BOSIntro from "../components/home/BOSIntro";
import ProductRail from "../components/home/ProductRail";
import PublicScene from "../components/home/PublicScene";
import PublicHero from "../components/home/PublicHero";

export default function HomePage() {
  return (
    <div className="bos-public-root">
      <PublicScene />
      <div className="bos-public-content">
        <BOSIntro />
        <TopBar />

        <main className="bos-home">
          <PublicHero />

          <ProductRail />

          <section className="bos-home-why" aria-labelledby="bos-why-title">
            <div className="bos-page-width">
              <h2 id="bos-why-title">Dlaczego BOS?</h2>
              <div className="bos-home-why-grid">
                <article className="bos-home-why-item"><span className="bos-home-why-icon" aria-hidden="true">↗</span><h3>Porządek operacyjny</h3><p>BOS przekłada powtarzalne działania na czytelny model pracy z określoną kolejnością, odpowiedzialnością i kryteriami wykonania. Zespół wie, co ma zrobić, a organizacja ogranicza zależność od wiedzy pojedynczych osób.</p></article>
                <article className="bos-home-why-item"><span className="bos-home-why-icon" aria-hidden="true">◎</span><h3>Powtarzalność procesów</h3><p>Ustandaryzowane ścieżki pomagają utrzymać spójny sposób realizacji niezależnie od pracownika i momentu wejścia w proces. Sprawdzone rozwiązanie można wykorzystywać ponownie bez budowania sposobu pracy od początku.</p></article>
                <article className="bos-home-why-item"><span className="bos-home-why-icon" aria-hidden="true">◇</span><h3>Kontrola i transparentność</h3><p>Status procesu, wymagane działania i kryteria zakończenia pozostają w jednym środowisku. Manager szybciej identyfikuje odchylenia, a wiedza operacyjna pozostaje w organizacji.</p></article>
              </div>
            </div>
          </section>
        </main>

        <BottomBar />
        <BOSSupport />
      </div>
    </div>
  );
}
