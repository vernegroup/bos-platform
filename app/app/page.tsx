import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listLicensedProducts } from "@/lib/bos/licenseRepository";
import { listOrganizationMembers } from "@/lib/bos/organizationRepository";
import { listProcesses } from "@/lib/bos/onboardingRepository";
import { listStandards } from "@/lib/bos/core/standardRepository";
import { listProductUpdates } from "@/lib/bos/productUpdateRepository";
import { listPromotionProcesses, listPromotionClosures } from "@/lib/bos/promotionsRepository";

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
  const hasPromotions=products.some(product=>product.key==="promotions");

  const [members,standards,processes,updates,promotionProcesses,promotionClosures]=await Promise.all([
    listOrganizationMembers(access),
    listStandards(access.organization.id),
    hasOnboarding?listProcesses(access.organization.id):Promise.resolve([]),
    listProductUpdates(access),
    hasPromotions?listPromotionProcesses(access):Promise.resolve([]),
    hasPromotions?listPromotionClosures(access):Promise.resolve([]),
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
      <article><strong>{processes.length+promotionProcesses.length}</strong><span>Procesy w toku</span></article>
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

    <section className="bos-home-section" aria-labelledby="home-resources">
      <div className="bos-home-section-head"><h2 id="home-resources">Zasoby organizacji</h2></div>
      <div className="bos-home-products">
        <article className="bos-home-product">
          <div className="bos-home-product-head"><div><h3>Standardy organizacji</h3><p>Wspólne definicje pracy używane przez produkty BOS.</p></div><span>{standards.length}</span></div>
          <Link href="/app/standards">Otwórz repozytorium →</Link>
        </article>
      </div>
    </section>

    {hasPromotions&&<section className="bos-home-section" aria-labelledby="home-promotions">
      <div className="bos-home-section-head"><h2 id="home-promotions">Zmiany ról</h2><Link href="/app/promotions/processes">Wszystkie →</Link></div>
      <div className="bos-home-updates">
       {promotionProcesses.slice(0,4).map(process=><Link href={`/app/promotions/processes/${process.id}`} key={process.id}>
        <div><strong>{process.employee}</strong><span>{process.fromRole} → {process.toRole} · {process.type}</span></div>
        <time>{process.gates.readyAllowed?"DO DECYZJI":process.latestDecision==="NOT_YET"?"JESZCZE NIE":process.lifecycleState}</time>
       </Link>)}
       {!promotionProcesses.length&&<div className="bos-home-empty">Brak zmian ról wymagających pracy.</div>}
      </div>
      <div className="bos-home-section-head" style={{marginTop:16}}><h2>Ostatnio zamknięte</h2><Link href="/app/promotions/closed">Historia →</Link></div>
      <div className="bos-home-updates">
       {promotionClosures.slice(0,3).map(item=><Link href={`/app/promotions/closed/${item.id}`} key={item.id}><div><strong>{item.employee}</strong><span>{item.fromRole} → {item.toRole}</span></div><time>{item.result==="READY"?"GOTOWY":"STOP"}</time></Link>)}
       {!promotionClosures.length&&<div className="bos-home-empty">Brak zamkniętych zmian ról.</div>}
      </div>
    </section>}
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
