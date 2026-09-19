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
import ProductStory from "../components/ProductStory";
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
              <span className="bos-home-hero-kicker">BUSINESS OPERATING STANDARDS</span>
              <h1 id="bos-home-title">
                Firma działa lepiej,
                <br />
                gdy sposób pracy
                <br />
                nie jest przypadkiem.
              </h1>
              <p>
                Gotowe systemy operacyjne dla małych i średnich firm. Porządkują
                powtarzalne procesy, prowadzą użytkownika przez wykonanie i
                zachowują wiedzę w organizacji.
              </p>
              <div className="bos-home-hero-actions">
                <a href="#produkty" className="bos-home-primary-action">
                  ZOBACZ PRODUKTY <span aria-hidden="true">→</span>
                </a>
                <Link href="/login" className="bos-home-secondary-action">
                  ZALOGUJ SIĘ
                </Link>
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
              <div className="bos-home-hero-note">
                <span>01</span>
                <div>
                  <strong>OD STANDARDU DO WYKONANIA</strong>
                  <p>Jedna platforma. Powtarzalny sposób pracy. Historia procesu.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bos-page-width">
            <div className="bos-home-principles" aria-label="Założenia platformy BOS">
              <span>GOTOWA ARCHITEKTURA PROCESU</span>
              <span>DOŻYWOTNIA LICENCJA</span>
              <span>AKTUALIZACJE W RAMACH PRODUKTU</span>
            </div>
          </div>
        </section>

        <section className="bos-home-products-intro">
          <div className="bos-page-width bos-home-section-head">
            <div>
              <span>PRODUKTY BOS</span>
              <h2>Systemy do konkretnych procesów.</h2>
            </div>
            <p>
              Nie zaczynasz od pustego narzędzia. Każdy moduł BOS dostarcza
              strukturę pracy, kontrolę wykonania i zapis rezultatu.
            </p>
          </div>
        </section>

        <ProductStory />

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
