"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
  account: { name: string; email: string; image: string | null };
};

const navigation = [
  { label: "Strona główna", href: "/app", marker: "01" },
  { label: "Produkty", href: "/app/products", marker: "02" },
  { label: "Wyszukiwarka", href: "/app/search", marker: "03" },
  { label: "Użytkownicy", href: "/app/users", marker: "04" },
  { label: "Firma", href: "/app/organization", marker: "05" },
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

export default function AppShell({ children, account }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="bos-app-shell">
      <aside className="bos-app-sidebar">
        <Link href="/" className="bos-app-brand" aria-label="BOS — strona publiczna">
          <span className="bos-app-brand-mark">BOS</span>
          <span className="bos-app-brand-name">Business Operating Standards</span>
        </Link>
        <div className="bos-app-sidebar-label">Platforma</div>
        <nav className="bos-app-nav" aria-label="Nawigacja aplikacji BOS">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href} className={"bos-app-nav-link" + (isCurrentPath(pathname, item.href) ? " is-active" : "")}>
              <span className="bos-app-nav-marker" aria-hidden="true">{item.marker}</span><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="bos-app-sidebar-bottom">
          {utilityNavigation.map((item) => (
            <Link key={item.label} href={item.href} className={"bos-app-utility-link" + (isCurrentPath(pathname, item.href) ? " is-active" : "")}>{item.label}</Link>
          ))}
          <Link href="/api/auth/signout" className="bos-app-utility-link">Wyloguj</Link>
          <Link href="/" className="bos-app-public-link">Przejdź do strony BOS<span aria-hidden="true">↗</span></Link>
        </div>
      </aside>
      <div className="bos-app-main">
        <header className="bos-app-topbar">
          <Link className="bos-app-search" href="/app/search" aria-label="Przejdź do wyszukiwarki BOS">
            <span className="bos-app-search-label">Szukaj</span><span className="bos-app-search-placeholder">Szukaj w BOS...</span><span className="bos-app-search-status">wkrótce</span>
          </Link>
          <div className="bos-app-account">
            <div className="bos-app-account-copy"><strong>{account.name}</strong><span>{account.email || "Konto BOS"}</span></div>
            <div className="bos-app-account-mark" aria-hidden="true">{initials(account.name)}</div>
          </div>
        </header>
        <main className="bos-app-workspace">{children}</main>
      </div>
    </div>
  );
}
