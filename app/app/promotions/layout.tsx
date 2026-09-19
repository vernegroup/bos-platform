import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { requireProductLicense } from "@/lib/bos/licenseRepository";

const productNavigation = [
  { step: "01", stage: "PRZEPROWADŹ", label: "Zmiany stanowiska", href: "/app/promotions/processes" },
  { step: "02", stage: "ZAMKNIJ", label: "Weryfikacja i historia", href: "/app/promotions/closed" },
];

export default async function PromotionsLayout({ children }: { children: React.ReactNode }) {
  const access = await requireBOSAccess();
  await requireProductLicense(access, "promotions");

  return (
    <div className="bos-product-shell bos-promotions-shell">
      <header className="bos-product-header">
        <div className="bos-product-identity">
          <Link href="/app/promotions" className="bos-product-name">BOS Promotions</Link>
          <span>Zmiana stanowiska jako kontrolowany proces operacyjny</span>
        </div>
        <div className="bos-product-context">
          <span>ORGANIZACJA</span>
          <strong>{access.organization.name}</strong>
        </div>
      </header>

      <nav className="bos-product-flow bos-promotions-product-flow" aria-label="Proces BOS Promotions">
        {productNavigation.map((item) => (
          <Link href={item.href} className="bos-product-flow-step" key={item.stage}>
            <span className="bos-product-flow-number">{item.step}</span>
            <span className="bos-product-flow-copy">
              <b>{item.stage}</b>
              <small>{item.label}</small>
            </span>
            <span className="bos-product-flow-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>

      <div className="bos-product-workspace">{children}</div>
    </div>
  );
}
