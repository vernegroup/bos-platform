"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  async function handleCheckout() {
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Nie udało się uruchomić płatności.");
      }
    } catch (error) {
      console.error(error);
      alert("Błąd połączenia ze Stripe.");
    }
  }

  return (
    <main>
      {/* ================= HERO ================= */}

      <section className="hero-section">
        <div
          className="container"
          style={{
            maxWidth: "980px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <Image
            src="/images/bos-logo.png"
            alt="Business Operating Standards"
            width={460}
            height={130}
            priority
            style={{
              display: "block",
              margin: "0 auto 20px auto",
              width: "100%",
              maxWidth: "460px",
              height: "auto",
            }}
          />

          <h1>Business Operating Standards</h1>

          <p>
            Gotowe standardy operacyjne dla nowoczesnych przedsiębiorstw.
          </p>
        </div>
      </section>

      {/* ================= BUTTON 1 ================= */}

      <section className="action-section">
        <div className="container">
          <button
            className="action-button"
            onClick={handleCheckout}
          >
            Kup BOS Onboarding
          </button>
        </div>
      </section>

      {/* ================= BUTTON 2 ================= */}

      <section className="action-section">
        <div className="container">
          <Link
            href="/implementation"
            className="action-button"
          >
            Wdrożenie z ekspertem
          </Link>
        </div>
      </section>

      {/* ================= SEKCJA OPISOWA ================= */}

      <section
        style={{
          padding: "70px 0 140px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "980px",
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "24px",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            boxShadow: "0 25px 70px rgba(0,0,0,.25)",
          }}
        >
          <Image
            src="/images/implementation.jpg"
            alt="Wdrożenie BOS"
            width={420}
            height={620}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          <div
            style={{
              padding: "60px",
              color: "#1c2940",
            }}
          >
            <h2
              style={{
                fontSize: "42px",
                lineHeight: 1.15,
                marginBottom: "30px",
              }}
            >
              Przestań tworzyć
              <br />
              procedury od zera.
            </h2>

            <p
              style={{
                fontSize: "20px",
                lineHeight: "1.9",
                marginBottom: "45px",
              }}
            >
              BOS Onboarding to kompletny zestaw gotowych standardów,
              dokumentów i procedur, które pozwalają uporządkować proces
              wdrażania nowych pracowników. Kupujesz rozwiązanie raz i
              wdrażasz je we własnym tempie — bez abonamentu i bez
              wielomiesięcznego projektowania procesów.
            </p>

            <h3
              style={{
                fontSize: "32px",
                lineHeight: 1.2,
                marginBottom: "25px",
              }}
            >
              Wdrożenie nie kończy się
              <br />
              na zakupie.
            </h3>

            <p
              style={{
                fontSize: "20px",
                lineHeight: "1.9",
              }}
            >
              Każda firma pracuje inaczej. Dlatego oprócz gotowego
              systemu BOS możesz skorzystać z indywidualnego wdrożenia z
              ekspertem.
              <br />
              <br />
              Przeanalizujemy sposób działania Twojej organizacji,
              pomożemy dostosować standard do realiów firmy
              i przeprowadzimy Cię przez cały proces krok po kroku.
            </p>
          </div>
        </div>
      </section>

      {/* ================= STOPKA ================= */}

      <footer
        style={{
          background: "#06162f",
          color: "#ffffff",
          padding: "45px 20px",
          borderTop: "1px solid rgba(255,255,255,.15)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "40px",
          }}
        >
          <div>
            <h3 style={{ marginBottom: "15px" }}>
              VERNE GROUP Sp. z o.o.
            </h3>

            <p>NIP: 7532466085</p>

            <p>Business Operating Standards</p>

            <p>📧 sob@vp.pl</p>

            <p>📞 +48 889 322 470</p>
          </div>

          <div>
            <h3 style={{ marginBottom: "15px" }}>
              Dokumenty
            </h3>

            <p>
              <a
                href="/documents/regulamin.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                Regulamin
              </a>
            </p>

            <p>
              <a
                href="/documents/polityka-prywatnosci.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                Polityka prywatności
              </a>
            </p>

            <p>
              <a
                href="/documents/rodo.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                Klauzula informacyjna RODO
              </a>
            </p>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            paddingTop: "25px",
            borderTop: "1px solid rgba(255,255,255,.12)",
            fontSize: "14px",
            opacity: 0.8,
          }}
        >
          © 2026 Business Operating Standards
          <br />
          by VERNE GROUP Sp. z o.o.
        </div>
      </footer>
    </main>
  );
}