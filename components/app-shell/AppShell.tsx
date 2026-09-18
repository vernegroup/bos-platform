"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type AppShellProps = {
  children: React.ReactNode;
  account: { name: string; email: string; image: string | null };
  organizationName: string;
};

const navigation = [
  { label: "Strona główna", href: "/app" },
  { label: "Produkty", href: "/app/products" },
  { label: "Wyszukiwarka", href: "/app/search" },
  { label: "Użytkownicy", href: "/app/users" },
  { label: "Firma", href: "/app/organization" },
];

const utilityNavigation = [
  { label: "Aktualizacje", href: "/app/updates" },
  { label: "Ustawienia", href: "/app/settings" },
];

function isCurrentPath(pathname: string, href: string) {
  if (href === "/app") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
}

export default function AppShell({ children, account, organizationName }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bos-app-shell">
      <aside className={"bos-app-sidebar" + (mobileOpen ? " is-open" : "")}>
        <div className="bos-app-sidebar-head">
          <Link href="/app" className="bos-app-brand" aria-label="BOS — panel główny" onClick={() => setMobileOpen(false)}>
            <span className="bos-app-brand-mark">BOS</span>
            <span className="bos-app-brand-name">Business Operating Standards</span>
          </Link>
          <button className="bos-app-sidebar-close" type="button" aria-label="Zamknij menu" onClick={() => setMobileOpen(false)}>×</button>
        </div>

        <div className="bos-app-sidebar-label">BOS Core</div>
        <nav className="bos-app-nav" aria-label="Nawigacja aplikacji BOS">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} className={"bos-app-nav-link" + (isCurrentPath(pathname, item.href) ? " is-active" : "")} onClick={() => setMobileOpen(false)}>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="bos-app-sidebar-bottom">
          {utilityNavigation.map((item) => (
            <Link key={item.label} href={item.href} className={"bos-app-utility-link" + (isCurrentPath(pathname, item.href) ? " is-active" : "")} onClick={() => setMobileOpen(false)}>{item.label}</Link>
          ))}
          <Link href="/api/auth/signout" className="bos-app-utility-link">Wyloguj</Link>
          <Link href="/" className="bos-app-public-link">Strona publiczna <span aria-hidden="true">↗</span></Link>
        </div>
      </aside>

      {mobileOpen && <button className="bos-app-scrim" aria-label="Zamknij menu" onClick={() => setMobileOpen(false)} />}

      <div className="bos-app-main">
        <header className="bos-app-topbar">
          <div className="bos-app-topbar-start">
            <button className="bos-app-menu-button" type="button" aria-label="Otwórz menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
              <span /><span /><span />
            </button>
            <Link className="bos-app-search" href="/app/search" aria-label="Przejdź do wyszukiwarki BOS">
              <span className="bos-app-search-label">Szukaj</span>
              <span className="bos-app-search-placeholder">Szukaj w BOS...</span>
            </Link>
          </div>

          <div className="bos-app-account">
            <div className="bos-app-account-copy">
              <strong>{organizationName}</strong>
              <span>{account.name}</span>
            </div>
            <div className="bos-app-account-mark" aria-hidden="true">{initials(account.name)}</div>
          </div>
        </header>
        <main className="bos-app-workspace">{children}</main>
      </div>
    </div>
  );
}
