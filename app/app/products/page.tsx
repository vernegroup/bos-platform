import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";

const productMeta = {
  onboarding: { index: "01", description: "System wdrażania nowych pracowników", href: "/app/onboarding" },
  promotions: { index: "02", description: "System awansów i zmian ról", href: "/app/promotions" },
} as const;

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const access = await requireBOSAccess();
  const products = await listLicensedProducts(access);

  return (
    <>
      <section className="bos-app-intro">
        <div><div className="bos-app-kicker">BOS / PRODUKTY</div><h1>Produkty organizacji</h1><p>Moduły dostępne na podstawie aktywnych licencji {access.organization.name}.</p></div>
        <div className="bos-app-build-state"><span>LICENCJE</span><strong>{products.length} AKTYWNE</strong></div>
      </section>
      <section className="bos-route-products">
        {products.map((product) => {
          const meta = productMeta[product.key];
          if (!meta) return null;
          return <Link href={meta.href} className="bos-route-product-row" key={product.key}><span>{meta.index}</span><div><strong>{product.name}</strong><small>{meta.description} · Wersja {product.currentVersion ?? "—"}</small></div><b>LICENCJA AKTYWNA</b><em>OTWÓRZ →</em></Link>;
        })}
        {!products.length && <div className="bos-app-panel"><strong>Brak aktywnych produktów</strong><p>Organizacja nie ma obecnie przypisanej aktywnej licencji BOS.</p></div>}
      </section>
    </>
  );
}
