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
            BUSINESS OPERATING STANDARDS
          </span>
        </Link>

        <nav className="bos-topbar-right" aria-label="Główna nawigacja">
          <a className="bos-topbar-link" href="#produkty">
            Produkty
          </a>

          <Link className="bos-topbar-link" href="/implementation">
            Implementation
          </Link>

          <a className="bos-topbar-link bos-topbar-contact" href="#kontakt">
            Kontakt
          </a>
        </nav>
      </div>

      <div className="bos-topbar-line" />
    </header>
  );
}
