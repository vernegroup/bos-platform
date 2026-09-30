import Link from "next/link";

export default function TopBar() {
  return (
    <header className="bos-topbar">
      <div className="bos-topbar-container">
        <Link href="/" className="bos-topbar-left" aria-label="BOS — strona główna">
          <span className="bos-logo-bos">BOS</span>

          <span className="bos-logo-divider" aria-hidden="true">
            |
          </span>

          <span className="bos-logo-title">
            STANDARDY OPERACYJNE BIZNESU
          </span>
        </Link>

        <nav className="bos-topbar-right" aria-label="Główna nawigacja">
          <div className="bos-topbar-primary-links">
          </div>

          <div className="bos-topbar-auth">
            <Link className="bos-topbar-login" href="/login">
              Zaloguj się
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="bos-topbar-register" href="/register">
              Zarejestruj się
            </Link>
          </div>

          <div className="bos-topbar-secondary-links">
            <a className="bos-topbar-link" href="#produkty">Produkty</a>
            <a className="bos-topbar-link" href="#kontakt">Kontakt</a>
          </div>
        </nav>
      </div>

      <div className="bos-topbar-line" />
    </header>
  );
}
