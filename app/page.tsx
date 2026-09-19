import Image from "next/image";
import Link from "next/link";

import "./styles.css";
import "./product-stage.css";
import "./product-flow.css";
import "./navigation.css";
import "./footer.css";
import "./mobile.css";
import "./product-alignment.css";

import TopBar from "../components/TopBar";
import FeatureCards from "../components/FeatureCards";
import BottomBar from "../components/BottomBar";
import BOSSupport from "../components/BOSSupport/BOSSupport";

export default function HomePage() {
  return (
    <>
      <TopBar />

      <main className="bos-home">
        <section className="bos-home-hero" aria-labelledby="bos-home-title">
          <div className="bos-page-width bos-home-hero-grid">
            <div className="bos-home-hero-copy">
              <span className="bos-home-hero-kicker">
                SYSTEM WDRAŻANIA NOWYCH PRACOWNIKÓW
              </span>

              <h1 id="bos-home-title">Gotowe rozwiązanie</h1>

              <p className="bos-home-hero-lead">
                konkretne, praktyczne i pozostające w organizacji na stałe.
              </p>

              <p className="bos-home-hero-description">
                Porządkuje cały proces wdrożenia pracownika — od przygotowania
                stanowiska, przez pierwszy dzień, aż po samodzielną pracę.
              </p>

              <div className="bos-home-hero-actions">
                <a href="#produkty" className="bos-home-primary-action">
                  KUP BOS ONBOARDING <span aria-hidden="true">→</span>
                </a>
              </div>

              <div className="bos-home-hero-reference">
                STRUKTURA · KONTROLA · POWTARZALNOŚĆ
              </div>
            </div>

            <div className="bos-home-hero-visual">
              <Image
                src="/images/hero-office.png"
                alt="Środowisko pracy Business Operating Standards"
                width={1023}
                height={840}
                priority
                className="bos-home-hero-image"
                sizes="(max-width: 800px) 100vw, 55vw"
              />
            </div>
          </div>
        </section>

        <section id="produkty" className="bos-home-products" aria-labelledby="bos-products-title">
          <div className="bos-page-width">
            <h2 id="bos-products-title">Dwa produkty. Jeden standard.</h2>

            <div className="bos-home-product-cards">
              <article className="bos-home-product-card">
                <div className="bos-home-product-icon" aria-hidden="true">○</div>
                <div>
                  <h3>BOS Onboarding</h3>
                  <span className="bos-home-product-type">System wdrożenia pracownika</span>
                </div>
                <p>
                  Przygotuj, przeprowadź i zamknij wdrożenie w oparciu o jeden
                  standard.
                </p>
                <a href="#onboarding">
                  Dowiedz się więcej <span aria-hidden="true">→</span>
                </a>
              </article>

              <article className="bos-home-product-card">
                <div className="bos-home-product-icon bos-home-product-icon-promotions" aria-hidden="true">↗</div>
                <div>
                  <h3>BOS Promotions</h3>
                  <span className="bos-home-product-type">System awansów wewnętrznych</span>
                </div>
                <p>
                  Rozwijaj kompetencje i buduj ścieżki rozwoju w organizacji.
                </p>
                <a href="#promotions">
                  Dowiedz się więcej <span aria-hidden="true">→</span>
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className="bos-home-platform">
          <div className="bos-page-width bos-home-platform-grid">
            <div>
              <span className="bos-home-platform-kicker">BOS PLATFORM</span>
              <h2>Nie dokument. Środowisko pracy.</h2>
            </div>
            <div className="bos-home-platform-copy">
              <p>
                Standard jest punktem wyjścia. Dalej BOS prowadzi przez realny
                proces, zapisuje postęp i pozostawia historię tego, co faktycznie
                wydarzyło się w organizacji.
              </p>
              <Link href="/login">PRZEJDŹ DO PANELU KLIENTA <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <FeatureCards />
      </main>

      <BottomBar />
      <BOSSupport />
    </>
  );
}
