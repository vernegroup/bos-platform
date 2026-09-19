import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";
import { listOrganizationMembers } from "@/lib/bos/organizationRepository";
import { listStandards, listProcesses } from "@/lib/bos/onboardingRepository";
import { listProductUpdates } from "@/lib/bos/productUpdateRepository";

const productMeta = {
  onboarding: { description:"System wdrażania pracownika", href:"/app/onboarding" },
  promotions: { description:"System awansów wewnętrznych", href:"/app/promotions" },
} as const;

const datePL=(value:string)=>new Intl.DateTimeFormat("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(value));
const firstName=(name:string)=>name.trim().split(/\s+/)[0]||name;

export const dynamic="force-dynamic";

export default async function BOSAppPage(){
  const access=await requireBOSAccess();
  const products=await listLicensedProducts(access);
  const hasOnboarding=products.some(product=>product.key==="onboarding");

  const [members,standards,processes,updates]=await Promise.all([
    listOrganizationMembers(access),
    hasOnboarding?listStandards(access.organization.id):Promise.resolve([]),
    hasOnboarding?listProcesses(access.organization.id):Promise.resolve([]),
    listProductUpdates(access),
  ]);

  return <>
    <section className="bos-home-welcome">
      <h1>Witaj, {firstName(access.user.displayName)}!</h1>
      <p>Oto najważniejsze informacje z Twojej organizacji.</p>
    </section>

    <section className="bos-home-kpis" aria-label="Podsumowanie organizacji">
      <article><strong>{products.length}</strong><span>Aktywne produkty</span></article>
      <article><strong>{members.filter(member=>member.status==="ACTIVE").length}</strong><span>Użytkowników</span></article>
      <article><strong>{standards.length}</strong><span>Standardów</span></article>
      <article><strong>{processes.length}</strong><span>Wdrożenia w toku</span></article>
    </section>

    <section className="bos-home-section" aria-labelledby="home-products">
      <div className="bos-home-section-head"><h2 id="home-products">Twoje produkty</h2><Link href="/app/products">Zobacz wszystkie →</Link></div>
      <div className="bos-home-products">
        {products.map(product=>{
          const meta=productMeta[product.key];
          if(!meta)return null;
          return <article className="bos-home-product" key={product.key}>
            <div className="bos-home-product-head"><div><h3>{product.name}</h3><p>{meta.description}</p></div><span>Aktywny</span></div>
            <Link href={meta.href}>Otwórz produkt →</Link>
          </article>;
        })}
        {!products.length&&<div className="bos-home-empty">Brak aktywnych produktów przypisanych do organizacji.</div>}
      </div>
    </section>

    <section className="bos-home-section" aria-labelledby="home-updates">
      <div className="bos-home-section-head"><h2 id="home-updates">Ostatnie aktualizacje</h2><Link href="/app/updates">Zobacz wszystkie →</Link></div>
      <div className="bos-home-updates">
        {updates.slice(0,3).map(update=><Link href="/app/updates" key={update.id}>
          <div><strong>{update.title}</strong><span>{update.productName}</span></div>
          <time dateTime={update.publishedAt}>{datePL(update.publishedAt)}</time>
        </Link>)}
        {!updates.length&&<div className="bos-home-empty">Brak nowych aktualizacji.</div>}
      </div>
    </section>
  </>;
}
