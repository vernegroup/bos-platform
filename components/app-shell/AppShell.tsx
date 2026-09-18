import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
};

const navigation = [
  { label: "Strona główna", href: "/app", marker: "01" },
  { label: "Produkty", href: "/app#produkty", marker: "02" },
  { label: "Wyszukiwarka", href: "/app#wyszukiwarka", marker: "03" },
  { label: "Użytkownicy", href: "/app#uzytkownicy", marker: "04" },
  { label: "Firma", href: "/app#firma", marker: "05" },
];

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="bos-app-shell">
      <aside className="bos-app-sidebar">
        <Link href="/" className="bos-app-brand" aria-label="BOS — strona publiczna">
          <span className="bos-app-brand-mark">BOS</span>
          <span className="bos-app-brand-name">Business Operating Standards</span>
        </Link>

        <div className="bos-app-sidebar-label">Platforma</div>

        <nav className="bos-app-nav" aria-label="Nawigacja aplikacji BOS">
          {navigation.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`bos-app-nav-link${index === 0 ? " is-active" : ""}`}
            >
              <span className="bos-app-nav-marker" aria-hidden="true">
                {item.marker}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="bos-app-sidebar-bottom">
          <Link href="/app#aktualizacje" className="bos-app-utility-link">
            Aktualizacje
          </Link>
          <Link href="/app#ustawienia" className="bos-app-utility-link">
            Ustawienia
          </Link>
          <Link href="/" className="bos-app-public-link">
            Przejdź do strony BOS
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>

      <div className="bos-app-main">
        <header className="bos-app-topbar">
          <label className="bos-app-search" htmlFor="bos-app-search">
            <span className="bos-app-search-label">Szukaj</span>
            <input
              id="bos-app-search"
              type="search"
              placeholder="Szukaj w BOS..."
              disabled
              aria-label="Wyszukiwarka BOS — funkcja demonstracyjna"
            />
            <span className="bos-app-search-status">wkrótce</span>
          </label>

          <div className="bos-app-account">
            <div className="bos-app-account-copy">
              <strong>Firma demonstracyjna</strong>
              <span>Środowisko projektowe</span>
            </div>
            <div className="bos-app-account-mark" aria-hidden="true">
              FD
            </div>
          </div>
        </header>

        <main className="bos-app-workspace">{children}</main>
      </div>
    </div>
  );
}
