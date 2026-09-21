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
import BottomBar from "../components/BottomBar";
import BOSSupport from "../components/BOSSupport/BOSSupport";
import BOSIntro, { BOSIntroTrigger } from "../components/home/BOSIntro";
import ProductDetailsModal from "../components/home/ProductDetailsModal";

export default function HomePage() {
  return (
    <>
      <BOSIntro />
      <TopBar />

      <main className="bos-home">
        <section className="bos-home-hero" aria-labelledby="bos-home-title">
          <div className="bos-page-width bos-home-hero-grid">
            <div className="bos-home-hero-copy">
              <span className="bos-home-hero-kicker">
                SYSTEMY OPERACYJNE DLA MŚP
              </span>

              <h1 id="bos-home-title">Uporządkowana firma</h1>

              <p className="bos-home-hero-lead">
                gotowe rozwiązania do codziennej pracy organizacji.
              </p>

              <p className="bos-home-hero-description">
                BOS porządkuje powtarzalne procesy firmy i zamienia je w rozwiązania, z których zespół może korzystać w codziennej pracy.
              </p>

              <div className="bos-home-hero-actions">
                <a href="#produkty" className="bos-home-primary-action">
                  POZNAJ PRODUKTY <span aria-hidden="true">→</span>
                </a>
                <BOSIntroTrigger />
              </div>

              <div className="bos-home-hero-reference">
                PORZĄDEK · POWTARZALNOŚĆ · TRWAŁY EFEKT
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
            <h2 id="bos-products-title">Dwa produkty. Jeden system działania.</h2>

            <div className="bos-home-product-cards">
              <article className="bos-home-product-card">
                <div className="bos-home-product-icon" aria-hidden="true">○</div>
                <div>
                  <h3>BOS Wdrożenia</h3>
                  <span className="bos-home-product-type">System wdrożenia pracownika</span>
                </div>
                <p>
                  Przygotuj, przeprowadź i zamknij wdrożenie w oparciu o jeden
                  standard.
                </p>
                <ProductDetailsModal product="onboarding" />
              </article>

              <aside className="bos-home-register-card" aria-labelledby="bos-register-title">
                <div className="bos-home-register-icon" aria-hidden="true">◎</div>
                <h3 id="bos-register-title">Zarejestruj się,<br />aby skorzystać</h3>
                <p>Utwórz konto BOS, uzyskaj dostęp do zakupionych produktów i zarządzaj nimi w swojej organizacji.</p>
                <Link className="bos-home-register-action" href="/register">Załóż konto <span aria-hidden="true">→</span></Link>
                <div className="bos-home-register-meta">Jedno konto · Produkty BOS · Panel organizacji</div>
              </aside>

              <article className="bos-home-product-card">
                <div className="bos-home-product-icon bos-home-product-icon-promotions" aria-hidden="true">↗</div>
                <div>
                  <h3>BOS Awanse</h3>
                  <span className="bos-home-product-type">System awansów wewnętrznych</span>
                </div>
                <p>
                  Rozwijaj kompetencje i buduj ścieżki rozwoju w organizacji.
                </p>
                <ProductDetailsModal product="promotions" />
              </article>
            </div>
          </div>
        </section>

        <section className="bos-home-why" aria-labelledby="bos-why-title">
          <div className="bos-page-width">
            <h2 id="bos-why-title">Dlaczego BOS?</h2>

            <div className="bos-home-why-grid">
              <article className="bos-home-why-item">
                <span className="bos-home-why-icon" aria-hidden="true">↗</span>
                <h3>Porządek operacyjny</h3>
                <p>BOS przekłada powtarzalne działania na czytelny model pracy z określoną kolejnością, odpowiedzialnością i kryteriami wykonania. Zespół wie, co ma zrobić, a organizacja ogranicza zależność od wiedzy pojedynczych osób.</p>
              </article>

              <article className="bos-home-why-item">
                <span className="bos-home-why-icon" aria-hidden="true">◎</span>
                <h3>Powtarzalność procesów</h3>
                <p>Ustandaryzowane ścieżki pomagają utrzymać spójny sposób realizacji niezależnie od pracownika i momentu wejścia w proces. Sprawdzone rozwiązanie można wykorzystywać ponownie bez budowania sposobu pracy od początku.</p>
              </article>

              <article className="bos-home-why-item">
                <span className="bos-home-why-icon" aria-hidden="true">◇</span>
                <h3>Kontrola i transparentność</h3>
                <p>Status procesu, wymagane działania i kryteria zakończenia pozostają w jednym środowisku. Manager szybciej identyfikuje odchylenia, a wiedza operacyjna pozostaje w organizacji.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <BottomBar />
      <BOSSupport />
    </>
  );
}
