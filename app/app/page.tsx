import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";

const productMeta = {
  onboarding: { index: "01", description: "System wdrażania nowych pracowników", href: "/app/onboarding" },
  promotions: { index: "02", description: "System awansów i zmian ról", href: "/app/promotions" },
} as const;

export const dynamic = "force-dynamic";

export default async function BOSAppPage() {
  const access = await requireBOSAccess();
  const products = await listLicensedProducts(access);
  return (
    <>
      <section className="bos-app-intro">
        <div><div className="bos-app-kicker">BOS / PANEL KLIENTA</div><h1>{access.organization.name}</h1><p>Produkty i środowisko organizacji w jednym miejscu.</p></div>
        <div className="bos-app-build-state"><span>ŚRODOWISKO</span><strong>POSTGRESQL / PRODUKCJA</strong></div>
      </section>
      <section className="bos-dashboard-section" id="produkty" aria-labelledby="products-title">
        <div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">PRODUKTY</span><h2 id="products-title">Aktywne moduły BOS</h2></div><span className="bos-dashboard-count">{products.length} aktywne</span></div>
        <div className="bos-dashboard-products">
          {products.map((product) => {
            const meta = productMeta[product.key];
            if (!meta) return null;
            return <article className="bos-dashboard-product" key={product.key}><div className="bos-dashboard-product-index">{meta.index}</div><div className="bos-dashboard-product-copy"><div className="bos-dashboard-product-topline"><h3>{product.name}</h3><span className="bos-dashboard-status">AKTYWNY</span></div><p>{meta.description}</p></div><div className="bos-dashboard-product-metric"><span>LICENCJA</span><strong>DOŻYWOTNIA</strong></div><Link className="bos-dashboard-open" href={meta.href}>OTWÓRZ <span aria-hidden="true">→</span></Link></article>;
          })}
          {!products.length && <div className="bos-app-panel"><strong>Brak aktywnych modułów</strong><p>Produkty pojawią się tutaj po przyznaniu licencji organizacji.</p></div>}
        </div>
      </section>
      <section className="bos-dashboard-grid">
        <div className="bos-dashboard-section bos-dashboard-activity"><div className="bos-dashboard-section-head"><div><span className="bos-dashboard-section-kicker">AKTYWNOŚĆ</span><h2>Ostatnie zmiany</h2></div></div><div className="bos-app-panel"><p>Aktywność organizacji będzie budowana z rzeczywistych rekordów BOS.</p></div></div>
        <aside className="bos-dashboard-side" aria-label="Podsumowanie organizacji"><div className="bos-dashboard-side-block"><span className="bos-dashboard-section-kicker">ORGANIZACJA</span><strong>{access.organization.name}</strong><dl><div><dt>Twoja rola</dt><dd>{access.membership.role}</dd></div><div><dt>Produkty</dt><dd>{products.length}</dd></div><div><dt>Licencje</dt><dd>{products.length} aktywne</dd></div></dl></div></aside>
      </section>
    </>
  );
}
