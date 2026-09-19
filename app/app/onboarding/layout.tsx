import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { requireProductLicense } from "@/lib/bos/licenseRepository";

const productNavigation = [
  { step: "01", stage: "PRZYGOTUJ", label: "Standardy stanowisk", href: "/app/onboarding/standards" },
  { step: "02", stage: "PRZEPROWADŹ", label: "Wdrożenia", href: "/app/onboarding/processes" },
  { step: "03", stage: "ZAMKNIJ", label: "Historia", href: "/app/onboarding/closed" },
];

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const access = await requireBOSAccess();
  await requireProductLicense(access, "onboarding");

  return (
    <div className="bos-product-shell bos-onboarding-shell">
      <header className="bos-product-header">
        <div className="bos-product-identity">
          <Link href="/app/onboarding" className="bos-product-name">BOS Onboarding</Link>
          <span>Wdrożenie pracownika jako kontrolowany proces operacyjny</span>
        </div>
        <div className="bos-product-context">
          <span>ORGANIZACJA</span>
          <strong>{access.organization.name}</strong>
        </div>
      </header>

      <nav className="bos-product-flow" aria-label="Proces BOS Onboarding">
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
