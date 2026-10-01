import Link from "next/link";
import ProductDetailsModal from "@/components/home/ProductDetailsModal";
import { bosProducts } from "@/data/products";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";

const productMeta = {
  onboarding: { description:"System wdrażania pracownika", detail:"Przygotowanie stanowiska, standardy, proces wdrożenia i kontrola postępu.", href:"/app/onboarding" },
  promotions: { description:"System awansów wewnętrznych", detail:"Uporządkowany proces awansu i przesunięcia poziomego w organizacji.", href:"/app/promotions" },
} as const;

export const dynamic="force-dynamic";

export default async function ProductsPage(){
  const access=await requireBOSAccess();
  const licenses=await listLicensedProducts(access);
  const licensedByKey=new Map(licenses.map(product=>[product.key,product]));
  return <>
    <section className="bos-products-header">
      <div><h1>Produkty</h1><p>Produkty BOS dla organizacji {access.organization.name}. Licencja odblokowuje konkretny moduł; pozostałe produkty możesz poznać i kupić bez opuszczania panelu.</p></div>
      <span>{licenses.length} {licenses.length===1?"aktywny produkt":"aktywne produkty"}</span>
    </section>
    <section className="bos-products-grid" aria-label="Produkty BOS">
      {bosProducts.map(product=>{
        const license=licensedByKey.get(product.id);
        const meta=productMeta[product.id];
        return <article className={"bos-product-card"+(license?"":" is-unlicensed")} key={product.id}>
          <div className="bos-product-card-top"><div className="bos-product-brand">BOS</div><span className={"bos-product-status"+(license?"":" is-unlicensed")}><i aria-hidden="true"/>{license?"Aktywny":"Bez licencji"}</span></div>
          <div className="bos-product-card-body"><h2>{product.displayName}</h2><strong>{meta.description}</strong><p>{meta.detail}</p></div>
          <dl className="bos-product-meta">
            <div><dt>Licencja</dt><dd>{license?"Dożywotnia":"Nieaktywna"}</dd></div>
            <div><dt>Wersja</dt><dd>{license?.currentVersion??"—"}</dd></div>
          </dl>
          {license
            ? <Link href={meta.href}>Otwórz produkt <span aria-hidden="true">→</span></Link>
            : <ProductDetailsModal product={product.id}/>}
        </article>;
      })}
    </section>
  </>;
}
