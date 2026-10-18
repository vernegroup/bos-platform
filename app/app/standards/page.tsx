import Link from "next/link";
import { requireBOSAccess } from "@/lib/bos/access";
import { listStandards } from "@/lib/bos/core/standardRepository";
import { db } from "@/lib/db";
import { getStandardCapacity } from "@/lib/bos/core/standardCapacity";
export const dynamic="force-dynamic";

export default async function OrganizationStandardsPage(){
 const access=await requireBOSAccess();
 const standards=await listStandards(access.organization.id);
 const products=await db().unsafe("SELECT p.id,p.key FROM products p JOIN licenses l ON l.product_id=p.id WHERE l.organization_id=$1 AND p.key IN ('onboarding','promotions') AND p.status='ACTIVE' AND l.status='ACTIVE' AND (l.license_type='PERPETUAL' OR (l.license_type='ANNUAL' AND l.valid_until>now())) GROUP BY p.id,p.key",[access.organization.id]);
 const capacitySummary=await Promise.all(products.map(async p=>({key:p.key,...await getStandardCapacity(db(),access.organization.id,p.id)})));
 const active=standards.filter(s=>s.status==="AKTYWNY").length;
 return <>
  <section className="bos-app-intro">
   <div><div className="bos-app-kicker">BOS / ZASOBY ORGANIZACJI</div><h1>Standardy organizacji</h1>
   <p>Jedno repozytorium definicji pracy dla produktów BOS. Standard utworzony tutaj może być używany we Wdrożeniach i Awansach bez kopiowania danych.</p></div>
   <Link href="/app/standards/new" className="bos-standard-primary-action">+ NOWY STANDARD</Link>
  </section>
  <div className="bos-onboarding-commandbar">
   <div><span>WSZYSTKIE</span><strong>{standards.length}</strong></div>
   <div><span>AKTYWNE</span><strong>{active}</strong></div>
   <div><span>ROBOCZE / ARCHIWALNE</span><strong>{standards.length-active}</strong></div>
  </div>
  <section aria-label="Limity Standardów według produktów" style={{display:"flex",flexWrap:"wrap",gap:12,margin:"12px 0 22px"}}>
   {capacitySummary.map(c=><div key={c.key} style={{background:"#fff",border:"1px solid #e3e2dd",borderLeft:"3px solid #b78a3e",borderRadius:5,padding:"12px 17px",minWidth:205}}>
    <div style={{fontSize:10,fontWeight:700,color:"#173146"}}>{c.key==="onboarding"?"BOS Wdrożenia":"BOS Awanse"} — {c.used} / {c.capacity}</div>
    <div style={{fontSize:10,color:"#687781",marginTop:5}}>Pozostało do publikacji: {c.remaining}</div>
   </div>)}
  </section>
  <section className="bos-standard-list bos-operational-list">
   <div className="bos-standard-list-head"><span>STANDARD</span><span>OBSZAR</span><span>WERSJA</span><span>CZYNNOŚCI</span><span>AKTUALIZACJA</span><span>STATUS</span><span /></div>
   {standards.map(s=><Link href={`/app/standards/${s.id}`} className="bos-standard-list-row" key={s.id}>
    <strong>{s.name}</strong><span>{s.area||"—"}</span><b>{s.currentVersion||"ROBOCZA"}</b>
    <span>{String("taskCount" in s?s.taskCount:0)}</span><span>{s.updatedAt||"—"}</span><em data-status={s.status}>{s.status}</em><i className="bos-standard-open-button">OTWÓRZ →</i>
   </Link>)}
   {!standards.length&&<div className="bos-operational-empty"><strong>Brak Standardów organizacji</strong><p>Utwórz pierwszy Standard. Będzie dostępny dla procesów BOS, które korzystają ze Standardów.</p></div>}
  </section>
  <div className="bos-onboarding-rule-note"><span>WSPÓLNY ZASÓB</span><p>Standard należy do organizacji. Produkt wykorzystuje jego opublikowaną wersję, ale nie staje się właścicielem Standardu.</p></div>
 </>;
}
