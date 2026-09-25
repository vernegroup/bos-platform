import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";

const productMeta = {
  onboarding: { description:"System wdrażania pracownika", detail:"Przygotowanie stanowiska, standardy, proces wdrożenia i kontrola postępu.", href:"/app/onboarding" },
  promotions: { description:"System awansów wewnętrznych", detail:"Uporządkowany proces awansu i przesunięcia poziomego w organizacji.", href:"/app/promotions" },
} as const;

export const dynamic="force-dynamic";

export default async function ProductsPage(){
  const access=await requireBOSAccess();
  const products=await listLicensedProducts(access);
  return <>
    <section className="bos-products-header">
      <div><h1>Produkty</h1><p>Produkty BOS dostępne dla organizacji {access.organization.name}.</p></div>
      <span>{products.length} {products.length===1?"aktywny produkt":"aktywne produkty"}</span>
    </section>
    <section className="bos-products-grid" aria-label="Aktywne produkty BOS">
      {products.map(product=>{
        const meta=productMeta[product.key]; if(!meta)return null;
        return <article className="bos-product-card" key={product.key}>
          <div className="bos-product-card-top"><div className="bos-product-brand">BOS</div><span className="bos-product-status"><i aria-hidden="true"/>Aktywny</span></div>
          <div className="bos-product-card-body"><h2>{product.key==="onboarding"?"BOS Wdrożenia":product.key==="promotions"?"BOS Awanse":product.name}</h2><strong>{meta.description}</strong><p>{meta.detail}</p></div>
          <dl className="bos-product-meta"><div><dt>Licencja</dt><dd>Dożywotnia</dd></div><div><dt>Wersja</dt><dd>{product.currentVersion??"—"}</dd></div></dl>
          <Link href={meta.href}>Otwórz produkt <span aria-hidden="true">→</span></Link>
        </article>;
      })}
      {!products.length&&<div className="bos-products-empty"><strong>Brak aktywnych produktów</strong><p>Organizacja nie ma obecnie przypisanej aktywnej licencji BOS.</p></div>}
    </section>
  </>;
}
